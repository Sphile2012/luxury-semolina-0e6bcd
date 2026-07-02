/**
 * REQ 18 — Voice Command "Hey Panic Ring"
 * Continuous SpeechRecognition listening for wake word
 */
import { useState, useEffect, useRef, useCallback } from "react";

const COOLDOWN_MS = 30000;
const CONFIRMATION_TIMEOUT_MS = 5000;

export default function useWakeWord({ enabled = false, onTrigger, onConfirmNeeded } = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);
  const lastTriggerRef = useRef(0);
  const confirmTimerRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const handleResult = useCallback((event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.toLowerCase().trim();

      const hasWakeWord = transcript.includes("hey panic ring") || transcript.includes("panic ring");
      const hasCommand = /\bsos\b|\bhelp\b|\bemergency\b/.test(transcript);

      if (!hasWakeWord) continue;

      const now = Date.now();
      if (now - lastTriggerRef.current < COOLDOWN_MS) continue;
      lastTriggerRef.current = now;

      if (hasCommand) {
        // Direct trigger
        clearTimeout(confirmTimerRef.current);
        onTrigger?.("voice_command");
      } else {
        // Wake word only — show confirmation modal, auto-trigger after 5s
        onConfirmNeeded?.();
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = setTimeout(() => {
          onTrigger?.("voice_command");
        }, CONFIRMATION_TIMEOUT_MS);
      }
    }
  }, [onTrigger, onConfirmNeeded]);

  const cancelConfirmation = useCallback(() => {
    clearTimeout(confirmTimerRef.current);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!enabled || !SR) {
      setListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = handleResult;
    recognition.onerror = () => {};
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      // Auto-restart if still enabled
      if (recognitionRef.current === recognition && enabled) {
        try { recognition.start(); } catch {}
      } else {
        setListening(false);
      }
    };

    try { recognition.start(); } catch {}
    recognitionRef.current = recognition;

    return () => {
      clearTimeout(confirmTimerRef.current);
      recognition.onend = null;
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
      setListening(false);
    };
  }, [enabled, handleResult]);

  return { listening, supported, cancelConfirmation };
}
