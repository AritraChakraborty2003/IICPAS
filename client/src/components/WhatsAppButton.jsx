"use client";

import { motion } from "framer-motion";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import { usePathname } from "next/navigation";

const IICPA_WHATSAPP_NUMBER = "919593330999";
const IICPA_CALL_NUMBER = "8090570646";
const WHATSAPP_MESSAGE = "Hi! I'm interested in your courses. Can you help me?";

const WhatsAppButton = () => {
  const pathname = usePathname();
  const isDigitalHubRoute = pathname?.includes("/digital-hub");
  const positionClasses = isDigitalHubRoute
    ? "top-1/2 left-1 -translate-y-16 sm:left-2"
    : "bottom-4 right-24";

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
    const whatsappUrl = `https://wa.me/${IICPA_WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      {/* Call Button — fixed bottom-left */}
      <motion.a
        href={`tel:${IICPA_CALL_NUMBER}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed z-[60] bottom-4 left-4 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        title={`Call us: ${IICPA_CALL_NUMBER}`}
        aria-label="Call IICPA"
      >
        <FaPhone className="text-xl sm:text-2xl rotate-90" />
      </motion.a>

      {/* WhatsApp Button — fixed bottom-right */}
      <div className={`fixed z-[60] ${positionClasses}`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWhatsAppClick}
          className="flex items-center justify-center bg-gradient-to-r from-green-400 to-green-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          title="Chat with us on WhatsApp"
          aria-label="WhatsApp IICPA"
        >
          <FaWhatsapp className="text-xl sm:text-2xl" />
        </motion.button>
      </div>
    </>
  );
};

export default WhatsAppButton;
