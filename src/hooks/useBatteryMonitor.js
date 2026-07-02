import { useEffect, useRef } from "react";
import { functions } from "@/api/client";

const LOW_BATTERY_THRESHOLD = 0.05; // 5%
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min between alerts

export default function useBatteryMonitor(user, contacts = []) {
  const alertedRef = useRef(false);
  const lastAlertTime = useRef(0);

  useEffect(() => {
    if (!user?.email || !navigator.getBattery) return;

    let battery = null;

    const checkAndAlert = async (bat) => {
      const level = bat.level;
      const charging = bat.charging;

      if (
        !charging &&
        level <= LOW_BATTERY_THRESHOLD &&
        !alertedRef.current &&
        Date.now() - lastAlertTime.current > COOLDOWN_MS
      ) {
        alertedRef.current = true;
        lastAlertTime.current = Date.now();

        try {
          await functions.invoke("sendLowBatteryAlert", {
            battery_level: Math.round(level * 100),
          });
        } catch (e) {
          console.warn("Low battery alert failed:", e);
        }
      }

      if (charging || level > LOW_BATTERY_THRESHOLD) {
        alertedRef.current = false;
      }
    };

    navigator.getBattery().then((bat) => {
      battery = bat;
      checkAndAlert(bat);

      const onChange = () => checkAndAlert(bat);
      bat.addEventListener("levelchange", onChange);
      bat.addEventListener("chargingchange", onChange);

      battery._cleanup = () => {
        bat.removeEventListener("levelchange", onChange);
        bat.removeEventListener("chargingchange", onChange);
      };
    }).catch(() => {});

    return () => {
      if (battery?._cleanup) battery._cleanup();
    };
  }, [user?.email]);
}
