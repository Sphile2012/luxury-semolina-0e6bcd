import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { entities, functions } from "@/api/client";
import PanicButton from "@/components/home/PanicButton";
import StatusBar from "@/components/home/StatusBar";
import QuickStats from "@/components/home/QuickStats";
import RecentAlerts from "@/components/home/RecentAlerts";
import ActiveAlertBanner from "@/components/home/ActiveAlertBanner";
import LandingHero from "@/components/home/LandingHero";
import AudioRecorder from "@/components/home/AudioRecorder";
import FakeCallTrigger from "@/components/home/FakeCallTrigger";
import WatchDashboard from "@/components/smartwatch/WatchDashboard";
import OnboardingSetup from "@/components/home/OnboardingSetup";
import IncidentFeed from "@/components/home/IncidentFeed";
import QuickActions from "@/components/home/QuickActions";
import LiveMapView from "@/components/home/LiveMapView";
import useBatteryMonitor from "@/hooks/useBatteryMonitor";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import DistressMonitor from "@/components/home/DistressMonitor";
import EmergencyCallingScreen from "@/components/home/EmergencyCallingScreen";
import TapToAlert from "@/components/home/TapToAlert";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pendingAudioUrl, setPendingAudioUrl] = useState(null);
  const [showCallingScreen, setShowCallingScreen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['safetyProfile', user?.email],
    queryFn: () => entities.SafetyProfile.filter({ owner_email: user.email }).then(d => d[0] || null),
    enabled: !!user?.email,
    staleTime: 60000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', user?.email],
    queryFn: () => entities.Alert.filter({ owner_email: user.email }, '-created_date', 10),
    enabled: !!user?.email,
    staleTime: 20000,
    refetchInterval: 30000,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', user?.email],
    queryFn: () => entities.EmergencyContact.filter({ owner_email: user.email }, 'priority', 20),
    enabled: !!user?.email,
    staleTime: 120000,
  });

  const loading = profileLoading || alertsLoading || contactsLoading;
  const activeAlert = alerts.find(a => a.status === 'active') || null;
  const needsOnboarding = !loading && isAuthenticated && !profile;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['alerts', user?.email] });
    queryClient.invalidateQueries({ queryKey: ['safetyProfile', user?.email] });
  };

  // Background battery monitor — silently alerts contacts below 5%
  useBatteryMonitor(user, contacts);

  // Stream live location updates to the active alert record
  useEffect(() => {
    if (!activeAlert) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        entities.Alert.update(activeAlert.id, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeAlert?.id]);

  // Periodically push battery level to SharedDevice record
  useEffect(() => {
    if (!user?.email || !profile?.device_imei) return;
    // getBattery is a non-standard API, not available everywhere
    const hasBattery = typeof navigator !== 'undefined' && 'getBattery' in navigator;
    if (!hasBattery) return;

    const pushBattery = async () => {
      try {
        // eslint-disable-next-line no-undef
        const bat = await navigator['getBattery']?.();
        if (!bat) return;
        const pos = await new Promise((res) =>
          navigator.geolocation.getCurrentPosition(res, () => res(null), { enableHighAccuracy: false, timeout: 8000 })
        );

        const info = (await import("@/hooks/useDeviceFingerprint")).getDeviceInfo();
        await functions.invoke("updateDeviceLocation", {
          latitude: pos?.coords?.latitude,
          longitude: pos?.coords?.longitude,
          accuracy: pos?.coords?.accuracy,
          deviceId: info.deviceId,
          deviceName: info.deviceName,
          platform: info.platform,
          batteryLevel: bat.level,
          batteryCharging: bat.charging,
        });
      } catch {}
    };

    pushBattery(); // run immediately
    const interval = setInterval(pushBattery, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, [user?.email, profile?.device_imei]);

  const handleAlertResolved = async (alertId) => {
    await entities.Alert.update(alertId, { status: 'resolved', resolved_at: new Date().toISOString() });
    setShowCallingScreen(false);
    invalidateAll();
  };

  const handleAlertTriggered = () => {
    setShowCallingScreen(true);
    invalidateAll();
  };



  if (isLoadingAuth || (isAuthenticated && loading)) return <HomeSkeleton />;

  if (!isAuthenticated) return (
    <LandingHero onGetStarted={() => navigate('/Login')} />
  );

  if (!loading && needsOnboarding) return (
    <OnboardingSetup user={user} onComplete={() => { invalidateAll(); }} />
  );

  return (
    <div className="min-h-screen text-gray-900 page-enter" style={{ background: "var(--sos-bg)" }}>
      {/* Emergency Calling Screen overlay */}
      <AnimatePresence>
        {showCallingScreen && activeAlert && (
          <EmergencyCallingScreen
            contacts={contacts}
            alert={activeAlert}
            user={user}
            onDismiss={() => setShowCallingScreen(false)}
          />
        )}
      </AnimatePresence>

      {/* Hidden tap-to-alert: tap 4x in bottom-right corner */}
      <TapToAlert corner="bottom-right" onTriggered={handleAlertTriggered} />

      {activeAlert && (
        <ActiveAlertBanner alert={activeAlert} onResolve={() => handleAlertResolved(activeAlert.id)} />
      )}
      <div className="max-w-md mx-auto px-4 pb-24 pt-6">
        <StatusBar user={user} profile={profile} loading={loading} contactCount={contacts.length} />
        <DistressMonitor active={!!activeAlert} alertId={activeAlert?.id} user={user} />
        {activeAlert && <IncidentFeed alert={activeAlert} />}
        <WatchDashboard user={user} />
        <PanicButton
          user={user}
          profile={profile}
          contacts={contacts}
          onAlertTriggered={handleAlertTriggered}
          hasActiveAlert={!!activeAlert}
          audioUrl={pendingAudioUrl}
        />
        <QuickActions />
        <LiveMapView user={user} alerts={alerts} />
        <QuickStats alerts={alerts} contacts={contacts} />
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <AudioRecorder onRecordingComplete={(url) => setPendingAudioUrl(url)} />
          <FakeCallTrigger />
        </div>

        <RecentAlerts alerts={alerts} />
      </div>
    </div>
  );
}