"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaPaperPlane, FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const Chatbot = () => {
  const pathname = usePathname();
  const isDigitalHubRoute = pathname?.includes("/digital-hub");
  const chatWindowPositionClasses = isDigitalHubRoute
    ? "top-1/2 left-3 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm sm:left-4 sm:w-96"
    : "bottom-20 right-4 w-96";
  const chatButtonPositionClasses = isDigitalHubRoute
    ? "top-1/2 left-3 translate-y-12 sm:left-4"
    : "bottom-4 right-4";
  const [isOpen, setIsOpen] = useState(false);
  const [leadFormVisible, setLeadFormVisible] = useState(true);
  const [hasLead, setHasLead] = useState(false);
  const [leadData, setLeadData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [leadErrors, setLeadErrors] = useState({});
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatbotSettings, setChatbotSettings] = useState({
    assistantName: "Neha Singh",
    profilePicture:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    welcomeMessage:
      "Hi! I'm your course assistant. I'm here to help you with course details, pricing, and enrollment.",
    status: "Online",
  });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const renderMarkdown = (text) => {
    if (!text) return "";

    const boldText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const italicText = boldText.replace(/\*(.*?)\*/g, "<em>$1</em>");
    return italicText.replace(/\n/g, "<br>");
  };

  const normalizePhone = (value = "") => value.replace(/\D/g, "");

  const validateLeadForm = () => {
    const errors = {};
    const trimmedName = leadData.name.trim();
    const normalizedPhone = normalizePhone(leadData.phone);
    const trimmedEmail = leadData.email.trim();

    if (trimmedName.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    return errors;
  };

  useEffect(() => {
    if (!sessionId) {
      setSessionId(uuidv4());
    }
  }, [sessionId]);

  useEffect(() => {
    const fetchChatbotSettings = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/chatbot/settings`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.success) {
          setChatbotSettings(data.settings);
        }
      } catch (error) {
        console.error("Error fetching chatbot settings:", error);
      }
    };

    fetchChatbotSettings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveChatMessage = async (message, userDetails = null) => {
    if (!sessionId) return;

    try {
      await fetch(`${API_BASE}/api/chat/save-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message,
          userDetails,
          userAgent: navigator.userAgent,
          ipAddress: null,
        }),
      });
    } catch (error) {
      console.error("Error saving chat message:", error);
    }
  };

  const startChatWithLead = (details, saveFailed = false) => {
    const welcomeText =
      `Hi ${details.name}! I'm your course assistant. How can I help you with our courses today?`;

    const botMessage = {
      id: Date.now(),
      text: welcomeText,
      isBot: true,
      timestamp: new Date(),
    };

    setHasLead(true);
    setLeadFormVisible(false);
    setMessages((prev) => (prev.length ? prev : [botMessage]));

    if (messages.length === 0) {
      saveChatMessage(botMessage, details);
    }

    if (saveFailed) {
      console.warn("Lead save failed, chat unlocked with local lead data.");
    }
  };

  const handleLeadInputChange = (field, value) => {
    setLeadData((prev) => ({ ...prev, [field]: value }));
    if (leadErrors[field]) {
      setLeadErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();

    const errors = validateLeadForm();
    setLeadErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const preparedLead = {
      name: leadData.name.trim(),
      phone: normalizePhone(leadData.phone),
      email: leadData.email.trim(),
    };

    setIsLeadSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chatbot-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...preparedLead,
          source: "chatbot",
          sessionId,
          message: "Lead captured from chatbot pre-chat form",
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "Failed to save chatbot lead");
      }

      setLeadData(preparedLead);
      startChatWithLead(preparedLead, false);
    } catch (error) {
      console.error("Failed to save chatbot lead:", error);
      setLeadData(preparedLead);
      startChatWithLead(preparedLead, true);
    } finally {
      setIsLeadSubmitting(false);
    }
  };

  const responses = {
    "what courses do you offer?":
      "We offer courses in Accounting, HR, Finance, US CMA, and Excel. You can browse all available courses on this page and filter by category or skill level.",
    "how much do courses cost?":
      "Course prices vary by level and content. Foundation courses start from ₹1,000, Core courses from ₹2,000, and Expert courses from ₹5,000. Many courses have discounts available!",
    "what is the duration?":
      "Course duration depends on the level and content. Foundation courses typically take 2-4 weeks, Core courses 4-8 weeks, and Expert courses 8-12 weeks. Check individual course pages for specific details.",
    "do you provide certificates?":
      "Yes! We provide completion certificates for all our courses. These certificates are industry-recognized and can help boost your career prospects.",
    "how do i enroll?":
      "Simply click the 'Enroll Now' button on any course card, or visit the course detail page. You'll be redirected to our enrollment process where you can complete your registration.",
    "what are the prerequisites?":
      "Prerequisites vary by course level. Foundation courses have no prerequisites, Core courses may require basic knowledge, and Expert courses typically require intermediate to advanced knowledge in the subject area.",
    default:
      "I'm here to help with course-related questions! You can ask about our courses, pricing, enrollment process, certificates, or any other queries. Feel free to browse the courses on this page or ask me anything!",
  };

  const handleSendMessage = () => {
    if (!hasLead || !inputMessage.trim()) return;

    const activeUserDetails = {
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
    };

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    saveChatMessage(userMessage, activeUserDetails);

    const botResponse = {
      id: messages.length + 2,
      text: responses[inputMessage.toLowerCase()] || responses.default,
      isBot: true,
      timestamp: new Date(),
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botResponse]);
      saveChatMessage(botResponse, activeUserDetails);
    }, 1000);

    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className={`fixed z-40 flex h-[500px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ${chatWindowPositionClasses}`}
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
                  <img
                    src={chatbotSettings.profilePicture}
                    alt="Assistant"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                  <FaUser className="text-sm hidden" />
                </div>
                <div>
                  <h3 className="font-semibold">{chatbotSettings.assistantName}</h3>
                  <p className="text-xs opacity-90">{chatbotSettings.status}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {leadFormVisible && !hasLead ? (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-gray-100 rounded-2xl p-4 mb-4 text-gray-800 text-sm leading-relaxed">
                  Hi! I&apos;m your course assistant. Please share your details to start the chat.
                </div>

                <form className="space-y-4" onSubmit={handleLeadSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={leadData.name}
                        onChange={(e) => handleLeadInputChange("name", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    {leadErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{leadErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={leadData.phone}
                        onChange={(e) => handleLeadInputChange("phone", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your 10-digit phone"
                        maxLength={14}
                      />
                    </div>
                    {leadErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{leadErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (optional)
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={leadData.email}
                        onChange={(e) => handleLeadInputChange("email", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    {leadErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{leadErrors.email}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLeadSubmitting}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {isLeadSubmitting ? "Starting chat..." : "Start Chat"}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl ${
                          message.isBot
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        <div
                          className="text-base leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                        />
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                    >
                      <FaPaperPlane className="text-xs" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`fixed z-50 ${chatButtonPositionClasses}`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-1 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
            <img
              src={chatbotSettings.profilePicture}
              alt="Assistant"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
            <FaUser className="text-xl hidden" />
          </div>
        </motion.button>
      </div>
    </>
  );
};

export default Chatbot;
