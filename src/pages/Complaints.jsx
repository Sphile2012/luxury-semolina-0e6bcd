import { useState } from "react";
import { functions } from "@/api/client";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function Complaints() {
  const [form, setForm] = useState({ type: "complaint", subject: "", message: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    setSubmitting(true);
    try {
      await functions.invoke('sendFeedback', {
        type: form.type,
        subject: form.subject,
        message: form.message,
        email: form.email || 'Anonymous',
      });
      setSubmitted(true);
    } catch {
      alert("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-8 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Complaints & Feedback</h1>
          <p className="text-[#666] text-sm mt-1">We take every concern seriously</p>
        </div>

        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Submitted!</h3>
            <p className="text-[#888] text-sm">We'll respond within 24–48 hours.</p>
            <button
              onClick={() => { setSubmitted(false); setForm({ type: "complaint", subject: "", message: "", email: "" }); }}
              className="mt-6 text-sm text-teal-400 underline"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div className="flex gap-3">
              {["complaint", "compliment"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all border ${
                    form.type === t
                      ? t === "complaint"
                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border-white/10 text-[#888]"
                  }`}
                >
                  {t === "complaint" ? "⚠️" : "✅"} {t}
                </button>
              ))}
            </div>

            {/* Email */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <label className="text-[10px] uppercase tracking-widest text-[#555] block mb-1.5">Your Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="for us to reply to you"
                className="w-full bg-transparent text-white placeholder-[#333] focus:outline-none text-sm"
              />
            </div>

            {/* Subject */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <label className="text-[10px] uppercase tracking-widest text-[#555] block mb-1.5">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description..."
                className="w-full bg-transparent text-white placeholder-[#333] focus:outline-none text-sm"
                required
              />
            </div>

            {/* Message */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <label className="text-[10px] uppercase tracking-widest text-[#555] block mb-1.5">Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Tell us what happened..."
                rows={5}
                className="w-full bg-transparent text-white placeholder-[#333] focus:outline-none text-sm resize-none"
                required
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-400 text-xs">For urgent safety emergencies, always contact 112 or 10111 directly.</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !form.subject || !form.message}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}