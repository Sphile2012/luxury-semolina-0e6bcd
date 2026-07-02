import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { functions } from "@/api/client";
import { 
  Book, ChevronDown, ChevronRight, AlertCircle, CheckCircle, 
  MessageSquare, Star, Send, Phone, Mail, Shield, MapPin,
  Users, Settings, Bell, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const guideSteps = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Shield,
    steps: [
      {
        number: 1,
        title: "Create Your Account",
        description: "Sign up with your email and phone number. Make sure to use a valid email as this will be used for emergency notifications.",
        tip: "Use an email you check regularly for important alerts and updates."
      },
      {
        number: 2,
        title: "Enable Location Services",
        description: "Allow the app to access your location for accurate emergency tracking. This is crucial for the SOS feature to work properly.",
        warning: "Without location access, emergency alerts cannot include your coordinates."
      },
      {
        number: 3,
        title: "Add Emergency Contacts",
        description: "Go to the Contacts page and add at least 3 trusted people who will receive your emergency alerts. Include their phone numbers and email addresses.",
        tip: "Add contacts you trust - they will be notified immediately during emergencies."
      },
      {
        number: 4,
        title: "Test Your Setup",
        description: "Send test alerts to your contacts to ensure they receive notifications properly. This helps verify phone numbers and email addresses.",
        tip: "Inform your contacts that you're testing the system first."
      },
      {
        number: 5,
        title: "Customize Alert Message",
        description: "Go to Settings and customize your emergency alert message. This message will be sent to all contacts when SOS is triggered.",
        tip: "Include any medical conditions or special instructions in your message."
      }
    ]
  },
  {
    id: "emergency-features",
    title: "Emergency Features",
    icon: AlertCircle,
    steps: [
      {
        number: 1,
        title: "SOS Panic Button",
        description: "Hold the red SOS button for 3 seconds to trigger an emergency alert. Your location and custom message will be sent to all emergency contacts.",
        warning: "Only use for real emergencies - false alarms can desensitize your contacts."
      },
      {
        number: 2,
        title: "Location Tracking",
        description: "Your real-time GPS location is automatically included in emergency alerts with accuracy information.",
        tip: "Ensure location services are always enabled for the app."
      },
      {
        number: 3,
        title: "WhatsApp Alerts",
        description: "Emergency contacts receive WhatsApp messages with your location link for instant response.",
        tip: "Make sure your contacts use WhatsApp for faster communication."
      }
    ]
  },
  {
    id: "managing-contacts",
    title: "Managing Contacts",
    icon: Users,
    steps: [
      {
        number: 1,
        title: "Add Contact",
        description: "Enter contact name, phone number, email, and relationship. Set priority order for notification sequence.",
        tip: "Higher priority contacts receive alerts first."
      },
      {
        number: 2,
        title: "Edit Contact Details",
        description: "Click edit icon to update contact information or change notification preferences.",
        tip: "Keep contact information up-to-date for reliable alerts."
      },
      {
        number: 3,
        title: "Notification Preferences",
        description: "Toggle SMS and email notifications for each contact based on their preference.",
        tip: "Enable both for maximum reliability."
      }
    ]
  },
  {
    id: "location-tracking",
    title: "Location Tracking",
    icon: MapPin,
    steps: [
      {
        number: 1,
        title: "View Live Map",
        description: "Access the Map page to see your current location and nearby safe zones.",
        tip: "Check the map regularly to familiarize yourself with safe zones."
      },
      {
        number: 2,
        title: "Safe Zones",
        description: "View nearby police stations, hospitals, and emergency services on the map.",
        tip: "Note the closest safe zones to your common locations."
      }
    ]
  },
  {
    id: "subscription-plans",
    title: "Subscription Plans",
    icon: Bell,
    steps: [
      {
        number: 1,
        title: "Basic Plan (R50/mo)",
        description: "3 emergency contacts, real-time GPS tracking, SOS alerts, 7-day history.",
        tip: "Perfect for individual users with basic safety needs."
      },
      {
        number: 2,
        title: "Standard Plan (R100/mo)",
        description: "10 emergency contacts, video recording, WhatsApp alerts, 30-day history, fall detection.",
        tip: "Best for families and those needing advanced features."
      },
      {
        number: 3,
        title: "Premium Plan (R150/mo)",
        description: "Unlimited contacts, 24/7 priority support, advanced analytics, unlimited history.",
        tip: "Ideal for maximum protection and peace of mind."
      }
    ]
  }
];

const faqs = [
  {
    question: "How does the SOS panic button work?",
    answer: "Hold the red SOS button for 3 seconds to trigger an emergency alert. Your real-time location, custom message, and timestamp are instantly sent to all your emergency contacts via WhatsApp and email. They receive a Google Maps link to track you."
  },
  {
    question: "What happens if I don't have location services enabled?",
    answer: "The SOS alert will still be sent to your contacts, but it won't include your GPS coordinates. We strongly recommend keeping location services enabled for your safety."
  },
  {
    question: "Can I use the app without internet?",
    answer: "You need an internet connection to send emergency alerts. However, GPS location tracking can work offline. We recommend staying connected when possible for full functionality."
  },
  {
    question: "How many emergency contacts can I add?",
    answer: "It depends on your subscription plan: Basic (3 contacts), Standard (10 contacts), Premium (unlimited contacts)."
  },
  {
    question: "Will my contacts know it's a test alert?",
    answer: "No, all alerts look the same. Always inform your contacts before sending test alerts to avoid unnecessary panic."
  },
  {
    question: "How accurate is the location tracking?",
    answer: "GPS accuracy is typically within 5-50 meters depending on your device and environment. The alert includes accuracy information so contacts know the precision."
  },
  {
    question: "Can I customize the emergency message?",
    answer: "Yes! Go to Settings → Custom Alert Message to personalize what your contacts receive. Include any medical conditions or special instructions."
  },
  {
    question: "What if my emergency contact doesn't have WhatsApp?",
    answer: "They'll still receive an email alert with all the same information including your location link. Enable email notifications for contacts without WhatsApp."
  },
  {
    question: "How do I cancel an alert?",
    answer: "Go to History, find the active alert, and tap 'Resolve'. This marks the alert as resolved but contacts will already have received the initial notification."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, all data is encrypted and stored securely. We never share your information with third parties. Emergency alerts are only sent to your chosen contacts."
  }
];

const troubleshooting = [
  {
    issue: "SOS button not working",
    solutions: [
      "Ensure you're holding the button for the full 3 seconds",
      "Check your internet connection",
      "Make sure you have at least one emergency contact added",
      "Try refreshing the app or logging out and back in",
      "Check if location permissions are granted"
    ]
  },
  {
    issue: "Location not accurate",
    solutions: [
      "Enable 'High Accuracy' mode in your device location settings",
      "Make sure GPS is enabled, not just Wi-Fi location",
      "Go outdoors for better satellite reception",
      "Restart your device to refresh GPS",
      "Check if other apps can access your location"
    ]
  },
  {
    issue: "Contacts not receiving alerts",
    solutions: [
      "Verify contact phone numbers are in international format (+27...)",
      "Check that email addresses are correct",
      "Ensure notification preferences are enabled for each contact",
      "Ask contacts to check spam/junk folders for emails",
      "Test with a different contact to isolate the issue"
    ]
  },
  {
    issue: "WhatsApp links not opening",
    solutions: [
      "Make sure WhatsApp is installed on your device",
      "Update WhatsApp to the latest version",
      "Check phone numbers are formatted correctly (no spaces or special characters)",
      "Try opening the link manually from the alert history",
      "Clear WhatsApp cache and try again"
    ]
  },
  {
    issue: "App crashing or freezing",
    solutions: [
      "Update the app to the latest version",
      "Clear app cache in device settings",
      "Restart your device",
      "Ensure you have enough storage space",
      "Uninstall and reinstall the app (data is saved in cloud)"
    ]
  },
  {
    issue: "Can't add emergency contacts",
    solutions: [
      "Check if you've reached your plan's contact limit",
      "Ensure all required fields are filled in",
      "Verify phone number format is correct",
      "Try using a different email format",
      "Check your internet connection"
    ]
  }
];

export default function Guide() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("getting-started");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedTrouble, setExpandedTrouble] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "", rating: 0 });
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedback.message || feedback.rating === 0) {
      alert("Please provide a rating and message");
      return;
    }

    try {
      await functions.invoke('sendFeedback', {
        type: feedback.type,
        subject: `${feedback.type === 'complaint' ? 'Complaint' : 'Compliment'} - Panic Ring`,
        message: feedback.message,
        rating: feedback.rating,
        email: user?.email || 'Anonymous',
        userName: user?.full_name || 'Anonymous',
      });

      setSubmitted(true);
      setTimeout(() => {
        setFeedback({ type: "", message: "", rating: 0 });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      alert("Failed to send feedback. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <Book size={20} className="text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold">User Guide</h1>
          </div>
          <p className="text-[#888] text-sm">Learn how to use Panic Ring effectively and stay safe</p>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          <a href="#guide" className="px-4 py-2 bg-white/5 rounded-full text-sm whitespace-nowrap hover:bg-white/10 transition-colors">📖 Guide</a>
          <a href="#faq" className="px-4 py-2 bg-white/5 rounded-full text-sm whitespace-nowrap hover:bg-white/10 transition-colors">❓ FAQ</a>
          <a href="#troubleshoot" className="px-4 py-2 bg-white/5 rounded-full text-sm whitespace-nowrap hover:bg-white/10 transition-colors">🔧 Troubleshoot</a>
          <a href="#feedback" className="px-4 py-2 bg-white/5 rounded-full text-sm whitespace-nowrap hover:bg-white/10 transition-colors">💬 Feedback</a>
          <a href="#contact" className="px-4 py-2 bg-white/5 rounded-full text-sm whitespace-nowrap hover:bg-white/10 transition-colors">📞 Support</a>
        </div>

        {/* Guide Sections */}
        <div id="guide" className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Book size={20} className="text-teal-400" />
            Step-by-Step Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="space-y-2">
              {guideSteps.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      activeSection === section.id
                        ? "bg-teal-500/20 border border-teal-500/40 text-teal-400"
                        : "bg-white/5 border border-white/10 text-[#888] hover:bg-white/10"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              <AnimatePresence mode="wait">
                {guideSteps.filter(s => s.id === activeSection).map(section => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {section.steps.map(step => (
                      <div key={step.number} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-teal-400 font-bold text-sm">{step.number}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                            <p className="text-[#888] text-sm mb-3">{step.description}</p>
                            {step.tip && (
                              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <CheckCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-blue-400 text-xs">{step.tip}</p>
                              </div>
                            )}
                            {step.warning && (
                              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                <p className="text-amber-400 text-xs">{step.warning}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-blue-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  {expandedFaq === idx ? <ChevronDown size={18} className="text-[#888] flex-shrink-0" /> : <ChevronRight size={18} className="text-[#888] flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.07]"
                    >
                      <p className="p-4 text-[#888] text-sm leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div id="troubleshoot" className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-amber-400" />
            Troubleshooting
          </h2>
          <div className="space-y-3">
            {troubleshooting.map((item, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedTrouble(expandedTrouble === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-medium pr-4">{item.issue}</span>
                  {expandedTrouble === idx ? <ChevronDown size={18} className="text-[#888] flex-shrink-0" /> : <ChevronRight size={18} className="text-[#888] flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {expandedTrouble === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.07]"
                    >
                      <div className="p-4">
                        <p className="text-[#888] text-sm mb-3">Try these solutions:</p>
                        <ul className="space-y-2">
                          {item.solutions.map((solution, sidx) => (
                            <li key={sidx} className="flex items-start gap-2 text-sm text-[#888]">
                              <CheckCircle size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div id="feedback" className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-purple-400" />
            Complaints & Compliments
          </h2>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-white font-bold mb-2">Thank You!</h3>
                <p className="text-[#888] text-sm">Your feedback has been submitted successfully.</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-white text-sm font-medium mb-2 block">Type of Feedback</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFeedback(f => ({ ...f, type: "complaint" }))}
                      className={`flex-1 py-3 rounded-xl transition-all ${
                        feedback.type === "complaint"
                          ? "bg-red-500/20 border-2 border-red-500/40 text-red-400"
                          : "bg-white/5 border border-white/10 text-[#888]"
                      }`}
                    >
                      Complaint
                    </button>
                    <button
                      onClick={() => setFeedback(f => ({ ...f, type: "compliment" }))}
                      className={`flex-1 py-3 rounded-xl transition-all ${
                        feedback.type === "compliment"
                          ? "bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border border-white/10 text-[#888]"
                      }`}
                    >
                      Compliment
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-white text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setFeedback(f => ({ ...f, rating: star }))}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={star <= feedback.rating ? "fill-amber-400 text-amber-400" : "text-[#444]"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-white text-sm font-medium mb-2 block">Your Message</label>
                  <textarea
                    value={feedback.message}
                    onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-teal-500/40"
                    rows={5}
                    placeholder="Tell us what you think..."
                  />
                </div>

                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.type || !feedback.message || feedback.rating === 0}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-white/10 disabled:text-[#666] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Submit Feedback
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div id="contact" className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Phone size={20} className="text-green-400" />
            Contact Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://wa.me/27000000000"
              target="_blank"
              className="bg-green-600/20 border border-green-600/40 rounded-2xl p-5 hover:bg-green-600/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Phone size={20} className="text-green-400" />
                <h3 className="text-white font-semibold">WhatsApp Support</h3>
              </div>
              <p className="text-[#888] text-sm">24/7 instant messaging support</p>
            </a>

            <a
              href="mailto:poomeigh503@gmail.com"
              className="bg-blue-600/20 border border-blue-600/40 rounded-2xl p-5 hover:bg-blue-600/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Mail size={20} className="text-blue-400" />
                <h3 className="text-white font-semibold">Email Support</h3>
              </div>
              <p className="text-[#888] text-sm">poomeigh503@gmail.com</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}