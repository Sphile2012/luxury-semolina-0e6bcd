/**
 * REQ 2 — Hidden SOS Button
 * Transparent 44x44px overlay, triple-tap within 2 seconds triggers SOS
 */
import { useRef, useCallback } from "react";

const CORNER_STYLES = {
  "bottom-right": { bottom: 80, right: 16 },
  "bottom-left":  { bottom: 80, left: 16 },
  "top-right":    { top: 80, right: 16 },
  "top-left":     { top: 80, left: 16 },
};

export default function HiddenSOSButton({ onTrigger, corner = "bottom-right" }) {
  const tapsRef = useRef([]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current = tapsRef.current.filter(t => now - t < 2000);
    tapsRef.current.push(now);

    if (tapsRef.current.length >= 3) {
      tapsRef.current = [];
      onTrigger?.();
    }
  }, [onTrigger]);

  const style = {
    position: "fixed",
    width: 44,
    height: 44,
    zIndex: 9999,
    opacity: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    ...CORNER_STYLES[corner],
  };

  return (
    <button
      style={style}
      onClick={handleTap}
      aria-label="Emergency SOS"
      aria-hidden="true"
    />
  );
}
