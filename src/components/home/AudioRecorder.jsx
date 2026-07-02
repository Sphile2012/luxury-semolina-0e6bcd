import { useState, useRef } from "react";
import { Mic, Square, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AudioRecorder({ onRecordingComplete }) {
  const [state, setState] = useState("idle"); // idle | recording | uploading | done | error
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = handleUpload;
      mediaRecorder.start();

      setState("recording");
      setDuration(0);
      setAudioUrl(null);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      setState("error");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const handleUpload = async () => {
    setState("uploading");
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      // Store as object URL (in-memory) — attach to alert when triggered
      const objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
      setState("done");
      onRecordingComplete?.(objectUrl);
    } catch {
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setDuration(0);
    setAudioUrl(null);
    onRecordingComplete?.(null);
  };

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      state === "recording" ? "bg-red-500/10 border-red-500/30" :
      state === "done" ? "bg-emerald-500/10 border-emerald-500/30" :
      "bg-white/[0.03] border-white/[0.07]"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic size={16} className={state === "recording" ? "text-red-400" : state === "done" ? "text-emerald-400" : "text-[#666]"} />
          <h3 className="text-white font-semibold text-sm">Emergency Audio</h3>
        </div>
        {state === "recording" && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="flex items-center gap-1.5"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-red-400 text-xs font-mono">{formatTime(duration)}</span>
          </motion.div>
        )}
        {state === "uploading" && (
          <div className="flex items-center gap-1.5">
            <Upload size={12} className="text-amber-400 animate-bounce" />
            <span className="text-amber-400 text-xs">Uploading…</span>
          </div>
        )}
        {state === "done" && (
          <div className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs">Saved to cloud</span>
          </div>
        )}
      </div>

      {state === "idle" || state === "error" ? (
        <>
          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors text-sm"
          >
            <Mic size={16} />
            Start Emergency Recording
          </button>
          {state === "error" && (
            <p className="text-red-400 text-xs mt-2 text-center flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Microphone access denied
            </p>
          )}
          {state === "idle" && (
            <p className="text-[#555] text-xs mt-2 text-center">One tap — audio auto-uploads & attaches to alert</p>
          )}
        </>
      ) : state === "recording" ? (
        <button
          onClick={stopRecording}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors text-sm border border-white/10"
        >
          <Square size={16} />
          Stop & Upload ({formatTime(duration)})
        </button>
      ) : state === "uploading" ? (
        <div className="w-full py-3 rounded-xl bg-white/5 text-[#888] text-sm text-center">Uploading audio…</div>
      ) : state === "done" ? (
        <div className="space-y-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 text-center">
            ✅ Audio clip ready — will be attached to your next alert
          </div>
          <button onClick={reset} className="w-full py-2 rounded-xl bg-white/5 text-[#666] text-xs hover:bg-white/10 transition-colors">
            Record new clip
          </button>
        </div>
      ) : null}
    </div>
  );
}