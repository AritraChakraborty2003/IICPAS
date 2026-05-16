/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaPaperPlane } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { getApiBase } from "@/lib/apiBase";

interface FormField {
  placeholder: string;
  required: boolean;
  visible: boolean;
}

interface MessageField extends FormField {
  rows: number;
}

interface FormConfig {
  smallText: string;
  mainHeading: string;
  formFields: {
    nameField: FormField;
    emailField: FormField;
    phoneField: FormField;
    messageField: MessageField;
  };
  submitButton: {
    text: string;
    color: string;
  };
  colors: {
    smallText: string;
    mainHeading: string;
    buttonText: string;
  };
  image?: {
    url: string;
    alt: string;
  };
  messages?: {
    successMessage: string;
    errorMessage: string;
  };
}

export default function ContactSection() {
  const apiBase = getApiBase();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFormConfig();
  }, []);

  const fetchFormConfig = async () => {
    try {
      const response = await fetch(`${apiBase}/contact-form/active`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFormConfig(data);
    } catch (error) {
      console.error("Error fetching form config:", error);
      // Fallback to default configuration
      setFormConfig({
        smallText: "🎓 Get In Touch",
        mainHeading: "We're Here To Help And Ready To Hear From You",
        formFields: {
          nameField: {
            placeholder: "Enter your name",
            required: true,
            visible: true,
          },
          emailField: {
            placeholder: "Enter your email",
            required: true,
            visible: true,
          },
          phoneField: {
            placeholder: "Write about your phone",
            required: true,
            visible: true,
          },
          messageField: {
            placeholder: "Write Your Message",
            required: true,
            visible: true,
            rows: 5,
          },
        },
        submitButton: {
          text: "Submit",
          color: "bg-green-500 hover:bg-green-600",
        },
        messages: {
          successMessage: "Message sent successfully!",
          errorMessage: "Submission failed",
        },
        colors: {
          smallText: "text-green-600",
          mainHeading: "text-slate-900",
          buttonText: "text-white",
        },
        image: {
          url: "/images/contact-section.jpg",
          alt: "Contact Support",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.message) {
      toast.error("All fields are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`${apiBase}/contact`, payload);

      toast.success(formConfig?.messages?.successMessage || "Message sent successfully!");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || formConfig?.messages?.errorMessage || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full bg-white pt-24 pb-10 px-4 md:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="w-full h-full">
            <div className="bg-gray-200 rounded-2xl w-full h-96 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!formConfig) {
    return null;
  }

  return (
    <section className="w-full bg-white pt-24 pb-10 px-4 md:px-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        {/* Left Image */}
        <div className="w-full h-full">
          <Image
            src={formConfig.image?.url || "/images/contact-section.jpg"}
            alt={formConfig.image?.alt || "Contact Support"}
            width={600}
            height={600}
            className="rounded-2xl w-full h-auto object-cover"
          />
        </div>

        {/* Right Form */}
        <div>
          <h4 className={`font-semibold text-sm mb-2 ${formConfig.colors.smallText}`}>
            {formConfig.smallText}
          </h4>
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${formConfig.colors.mainHeading}`}>
            {formConfig.mainHeading}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {formConfig.formFields.nameField.visible && (
                <input
                  type="text"
                  name="name"
                  required={formConfig.formFields.nameField.required}
                  value={form.name}
                  onChange={handleChange}
                  placeholder={formConfig.formFields.nameField.placeholder}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              {formConfig.formFields.emailField.visible && (
                <input
                  type="email"
                  name="email"
                  required={formConfig.formFields.emailField.required}
                  value={form.email}
                  onChange={handleChange}
                  placeholder={formConfig.formFields.emailField.placeholder}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {formConfig.formFields.phoneField.visible && (
              <input
                type="tel"
                name="phone"
                required={formConfig.formFields.phoneField.required}
                value={form.phone}
                onChange={handleChange}
                placeholder={formConfig.formFields.phoneField.placeholder}
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {formConfig.formFields.messageField.visible && (
              <textarea
                name="message"
                rows={formConfig.formFields.messageField.rows}
                required={formConfig.formFields.messageField.required}
                value={form.message}
                onChange={handleChange}
                placeholder={formConfig.formFields.messageField.placeholder}
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 ${formConfig.submitButton.color} ${formConfig.colors.buttonText} font-semibold px-6 py-3 rounded-full transition-all`}
            >
              {isSubmitting ? "Sending..." : formConfig.submitButton.text} <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
