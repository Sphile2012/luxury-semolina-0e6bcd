/**
 * REQ 8 — Wearable Bluetooth Integration
 * Web Bluetooth API: scan for BLE devices with SOS characteristic
 */
import { useState, useRef, useCallback } from "react";

// Standard SOS characteristic UUID (custom — devices must implement this)
const SOS_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const SOS_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

export default function useBluetoothSOS({ onSOSTrigger } = {}) {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState(null);
  const [error, setError] = useState(null);
  const [pairing, setPairing] = useState(false);
  const deviceRef = useRef(null);
  const charRef = useRef(null);

  const supported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  const connect = useCallback(async () => {
    if (!supported) {
      setError("Web Bluetooth is not supported on this device/browser.");
      return;
    }
    setPairing(true);
    setError(null);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SOS_SERVICE_UUID] }],
        optionalServices: [SOS_SERVICE_UUID],
      });

      device.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        setDeviceName(null);
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SOS_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(SOS_CHARACTERISTIC_UUID);

      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", (e) => {
        const value = e.target.value;
        const byte = value.getUint8(0);
        if (byte === 0x01) {
          // SOS signal received
          onSOSTrigger?.("bluetooth_wearable");
        }
      });

      deviceRef.current = device;
      charRef.current = characteristic;
      setDeviceName(device.name || "Wearable Device");
      setConnected(true);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        setError(err.message || "Failed to connect to device.");
      }
    } finally {
      setPairing(false);
    }
  }, [supported, onSOSTrigger]);

  const disconnect = useCallback(async () => {
    try {
      if (charRef.current) {
        await charRef.current.stopNotifications().catch(() => {});
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    } catch {}
    setConnected(false);
    setDeviceName(null);
    deviceRef.current = null;
    charRef.current = null;
  }, []);

  return { supported, connected, deviceName, error, pairing, connect, disconnect };
}
