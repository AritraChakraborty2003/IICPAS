"use client";

import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

const WhatsAppButton = () => {
  const pathname = usePathname();
  const isDigitalHubRoute = pathname?.includes("/digital-hub");
  const positionClasses = isDigitalHubRoute
    ? "top-1/2 left-3 -translate-y-16 sm:left-4"
    : "bottom-4 right-24";

  // WhatsApp configuration - you can change this number
  const whatsappNumber = "+1234567890"; // Replace with your actual WhatsApp number
  const whatsappMessage =
    "Hi! I'm interested in your courses. Can you help me?";

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className={`fixed z-[60] ${positionClasses}`}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleWhatsAppClick}
        className="bg-gradient-to-r from-green-400 to-green-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        title="Chat with us on WhatsApp"
      >
        <FaWhatsapp className="text-xl sm:text-2xl" />
      </motion.button>
    </div>
  );
};

export default WhatsAppButton;
