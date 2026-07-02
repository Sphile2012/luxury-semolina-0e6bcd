import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth, entities } from "@/api/client";
import { AlertTriangle, Users, Activity, Shield, CheckCircle, RefreshCw, MapPin, TrendingUp, Smartphone, UserCheck, ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedUser, setExpandedUser] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
    staleTime: 300000,
  });

  const { data: allAlerts = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['adminAlerts'],
    queryFn: () => entities.Alert.list('-created_date', 100),
    enabled: user?.role === 'admin',
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: () => entities.SafetyProfile.list('-created_date', 200),
    enabled: user?.role === 'admin',
    staleTime: 30000,
  });

  const { data: allDevices = [] } = useQuery({
    queryKey: ['adminDevices'],
    queryFn: () => entities.SharedDevice.list('-created_date', 200),
    enabled: user?.role === 'admin',
    staleTime: 30000,
  });

  const { mutate: resolveAlert } = useMutation({
    mutationFn: (id) => entities.Alert.update(id, { status: 'resolved', resolved_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminAlerts'] }),
  });

  if (isLoading || !user) return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-48 bg-white/5 rounded-xl mb-2" />
            <div className="h-3 w-64 bg-white/5 rounded-lg" />
          </div>
          <div className="w-9 h-9 bg-white/5 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-white/5 rounded-2xl mb-6" />
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center px-4">
      <div>
        <Shield size={48} className="text-[#333] mx-auto mb-4" />
        <p className="text-white font-bold text-lg mb-2">Admin Access Only</p>
        <p className="text-[#555] text-sm">You don't have permission to view this page.</p>
      </div>
    </div>
  );

  const activeAlerts = allAlerts.filter(a => a.status === 'active');
  const resolvedAlerts = allAlerts.filter(a => a.status === 'resolved');
  const uniqueUsers = [...new Set(allAlerts.map(a => a.owner_email))];
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  // Build enriched registrations list from SafetyProfile
  const registrations = allProfiles.map(p => ({
    ...p,
    alertCount: allAlerts.filter(a => a.owner_email === p.owner_email).length,
    deviceCount: allDevices.filter(d => d.owner_email === p.owner_email).length,
    devices: allDevices.filter(d => d.owner_email === p.owner_email),
  }));

  // Build last-7-days chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const next = startOfDay(subDays(new Date(), 5 - i));
    const count = allAlerts.filter(a => {
      const d = new Date(a.created_date);
      return d >= day && d < next;
    }).length;
    return { day: format(day, 'EEE'), count };
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "registrations", label: "Registrations", icon: UserCheck },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-[#666] text-sm mt-1">Last: {lastUpdated}</p>
          </div>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['adminAlerts'] });
              queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
              queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
            }}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={15} className="text-[#666]" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Registered", value: allProfiles.length, icon: UserCheck, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            { label: "Active Now", value: activeAlerts.length, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
            { label: "Resolved", value: resolvedAlerts.length, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Devices", value: allDevices.length, icon: Smartphone, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
              <s.icon size={16} className={s.color} />
              <p className="text-3xl font-bold text-white mt-2">{s.value}</p>
              <p className="text-[#666] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === t.id ? "bg-white/10 text-white" : "text-[#555] hover:text-[#888]"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* Chart */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-teal-400" />
                <h2 className="text-white text-sm font-semibold">Alerts — Last 7 Days</h2>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} fill="url(#alertGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Active emergencies */}
            {activeAlerts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-red-400 text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Active Emergencies ({activeAlerts.length})
                </h2>
                <div className="space-y-3">
                  {activeAlerts.map(a => (
                    <div key={a.id} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white text-sm font-semibold">{a.owner_email}</p>
                          <p className="text-[#888] text-xs mt-0.5">{a.message?.slice(0, 60)}</p>
                        </div>
                        <button onClick={() => resolveAlert(a.id)} className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl hover:bg-emerald-500/30 transition-colors">
                          Resolve
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[#555] text-xs">
                        {a.address && <span className="flex items-center gap-1"><MapPin size={10} /> {a.address.slice(0, 40)}</span>}
                        <span>🕐 {formatDistanceToNow(new Date(a.created_date), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity feed */}
            <h2 className="text-[#666] text-xs uppercase tracking-widest mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {allAlerts.slice(0, 15).map(a => (
                <div key={a.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'active' ? 'bg-red-500' : a.status === 'resolved' ? 'bg-emerald-500' : 'bg-[#444]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{a.owner_email}</p>
                    <p className="text-[#555] text-xs">{formatDistanceToNow(new Date(a.created_date), { addSuffix: true })}</p>
                  </div>
                  <span className={`text-xs capitalize ${a.status === 'active' ? 'text-red-400' : a.status === 'resolved' ? 'text-emerald-400' : 'text-[#666]'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
              {allAlerts.length === 0 && <p className="text-center text-[#444] text-sm py-8">No alerts yet</p>}
            </div>
          </>
        )}

        {/* ── REGISTRATIONS TAB ── */}
        {activeTab === "registrations" && (
          <div>
            <p className="text-[#555] text-xs mb-4">{registrations.length} registered user{registrations.length !== 1 ? 's' : ''}</p>
            {registrations.length === 0 && (
              <div className="text-center py-16">
                <Users size={40} className="mx-auto text-[#333] mb-3" />
                <p className="text-[#555] text-sm">No registrations yet</p>
              </div>
            )}
            <div className="space-y-3">
              {registrations.map(reg => {
                const isExpanded = expandedUser === reg.id;
                const plan = reg.subscription_plan || 'basic';
                const planColor = plan === 'premium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                  plan === 'standard' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                  'text-blue-400 bg-blue-500/10 border-blue-500/20';
                return (
                  <div key={reg.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedUser(isExpanded ? null : reg.id)}
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                        {reg.owner_email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{reg.owner_email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${planColor}`}>{plan}</span>
                          <span className="text-[#555] text-[10px]">{reg.alertCount} alerts · {reg.deviceCount} device{reg.deviceCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${reg.device_connected ? 'bg-emerald-400' : 'bg-[#333]'}`} />
                        {isExpanded ? <ChevronUp size={14} className="text-[#555]" /> : <ChevronDown size={14} className="text-[#555]" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/[0.05] px-4 pb-4 pt-3 space-y-3">
                        {/* Profile details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {reg.owner_phone && (
                            <div className="flex items-center gap-1.5 text-[#666]">
                              <Phone size={10} /> {reg.owner_phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[#666]">
                            <Mail size={10} /> {reg.owner_email}
                          </div>
                          {reg.device_name && (
                            <div className="flex items-center gap-1.5 text-[#666] col-span-2">
                              <Smartphone size={10} /> {reg.device_name}
                              {reg.device_platform && <span className="text-[#444] capitalize">({reg.device_platform})</span>}
                            </div>
                          )}
                        </div>

                        {/* Feature flags */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "Location", on: reg.location_sharing },
                            { label: "Safe Zones", on: reg.safe_zones_alerts },
                            { label: "Crime Alerts", on: reg.crime_alerts },
                            { label: "Auto 911", on: reg.auto_call_911 },
                          ].map(f => (
                            <span key={f.label} className={`text-[10px] px-2 py-0.5 rounded-full border ${f.on ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-[#444]'}`}>
                              {f.on ? '✓' : '✗'} {f.label}
                            </span>
                          ))}
                        </div>

                        {/* Linked devices */}
                        {reg.devices.length > 0 && (
                          <div>
                            <p className="text-[#555] text-[10px] uppercase tracking-widest mb-2">Devices</p>
                            <div className="space-y-1.5">
                              {reg.devices.map(d => (
                                <div key={d.id} className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2">
                                  <Smartphone size={11} className="text-teal-400 shrink-0" />
                                  <span className="text-white text-xs flex-1 truncate">{d.device_name || 'Unknown'}</span>
                                  {d.battery_level != null && (
                                    <span className={`text-[10px] font-mono ${d.battery_level <= 15 ? 'text-red-400' : d.battery_level <= 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                      {Math.round(d.battery_level)}%{d.battery_charging ? '⚡' : ''}
                                    </span>
                                  )}
                                  <div className={`w-1.5 h-1.5 rounded-full ${d.last_latitude ? 'bg-emerald-400' : 'bg-[#333]'}`} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[#444] text-[10px]">
                          Registered {formatDistanceToNow(new Date(reg.created_date), { addSuffix: true })}
                          {reg.device_imei && <span className="ml-2 font-mono">ID: {reg.device_imei.slice(-8)}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ALERTS TAB ── */}
        {activeTab === "alerts" && (
          <div>
            {activeAlerts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-red-400 text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Active Emergencies ({activeAlerts.length})
                </h2>
                <div className="space-y-3">
                  {activeAlerts.map(a => (
                    <div key={a.id} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white text-sm font-semibold">{a.owner_email}</p>
                          <p className="text-[#888] text-xs mt-0.5">{a.message?.slice(0, 80)}</p>
                        </div>
                        <button onClick={() => resolveAlert(a.id)} className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl hover:bg-emerald-500/30 transition-colors shrink-0 ml-2">
                          Resolve
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[#555] text-xs">
                        {a.address && <span className="flex items-center gap-1"><MapPin size={10} /> {a.address.slice(0, 50)}</span>}
                        <span>🕐 {formatDistanceToNow(new Date(a.created_date), { addSuffix: true })}</span>
                        <span className="capitalize text-[#666]">via {a.trigger_method?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-[#666] text-xs uppercase tracking-widest mb-4">All Alerts ({allAlerts.length})</h2>
            <div className="space-y-2">
              {allAlerts.map(a => (
                <div key={a.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'active' ? 'bg-red-500' : a.status === 'resolved' ? 'bg-emerald-500' : 'bg-[#444]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{a.owner_email}</p>
                    <p className="text-[#555] text-xs">{formatDistanceToNow(new Date(a.created_date), { addSuffix: true })} · {a.trigger_method?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs capitalize ${a.status === 'active' ? 'text-red-400' : a.status === 'resolved' ? 'text-emerald-400' : 'text-[#666]'}`}>
                      {a.status}
                    </span>
                    {a.status === 'active' && (
                      <button onClick={() => resolveAlert(a.id)} className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg hover:bg-emerald-500/30 transition-colors">
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {allAlerts.length === 0 && <p className="text-center text-[#444] text-sm py-8">No alerts recorded</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}