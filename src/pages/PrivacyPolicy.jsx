import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Panic Ring</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-[#666] text-sm mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-[#aaa] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Introduction</h2>
            <p>Panic Ring ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Information We Collect</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong className="text-white">Location Data:</strong> Real-time GPS coordinates to enable emergency tracking and SOS alerts. Location is only shared with your designated emergency contacts during active alerts.</li>
              <li><strong className="text-white">Personal Information:</strong> Name, email address, and phone number for account creation and emergency notifications.</li>
              <li><strong className="text-white">Emergency Contacts:</strong> Names, phone numbers, and emails of contacts you add to receive your alerts.</li>
              <li><strong className="text-white">Device Information:</strong> Device ID, model, and platform for device tracking features.</li>
              <li><strong className="text-white">Audio Recordings:</strong> Optional emergency audio clips recorded during SOS events, stored securely in the cloud.</li>
              <li><strong className="text-white">Usage Data:</strong> App interactions and alert history to improve service quality.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>To deliver emergency SOS alerts and real-time location to your chosen contacts</li>
              <li>To provide "Find My Device" functionality</li>
              <li>To send account-related notifications and updates</li>
              <li>To improve app performance and features</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Location Data</h2>
            <p>Panic Ring requires access to your precise location to function as a safety application. Location data is:</p>
            <ul className="space-y-2 list-disc pl-5 mt-2">
              <li>Collected only when the app is in use or during active SOS events</li>
              <li>Only shared with emergency contacts you have explicitly added</li>
              <li>Never sold to third parties or used for advertising</li>
              <li>Stored temporarily and purged after alert resolution</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Permissions Required</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong className="text-white">Location (Fine &amp; Coarse):</strong> Required for GPS tracking and SOS alerts</li>
              <li><strong className="text-white">Camera:</strong> Optional — used for discreet mode video streaming during SOS</li>
              <li><strong className="text-white">Microphone:</strong> Optional — used for emergency audio recording</li>
              <li><strong className="text-white">Internet:</strong> Required to send alerts and sync data</li>
              <li><strong className="text-white">Vibration:</strong> Used for alert notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Data Sharing</h2>
            <p>We do not sell, trade, or rent your personal information. Your data may be shared only:</p>
            <ul className="space-y-2 list-disc pl-5 mt-2">
              <li>With emergency contacts you designate, during active SOS events</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality)</li>
              <li>When required by law or to protect safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Data Security</h2>
            <p>We implement industry-standard security measures including encryption in transit and at rest. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and keep your account credentials confidential.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us. Alert history is retained for the duration specified by your subscription plan.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Children's Privacy</h2>
            <p>Panic Ring is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">10. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="space-y-2 list-disc pl-5 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for optional data collection (e.g. camera, microphone)</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
            <div className="mt-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-1">
              <p><strong className="text-white">Email:</strong> poomeigh503@gmail.com</p>
              <p><strong className="text-white">App:</strong> Panic Ring</p>
              <p><strong className="text-white">Location:</strong> South Africa</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}