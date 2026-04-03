import { getApiBase } from "@/lib/apiBase";
// components/AddStudentTab.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

const initialState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  location: "",
  course: "",
  teacher: "",
};

export default function AddStudentTab({ onSuccess }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/students/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setSuccess("Student registered successfully!");
      setForm(initialState);
      if (onSuccess) onSuccess(data.student);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center min-h-[60vh] bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#f1f5f9] rounded-2xl p-4"
    >
      <Card className="backdrop-blur-xl bg-white/70 border border-indigo-100 shadow-2xl rounded-2xl w-full max-w-xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserPlus className="text-indigo-500" size={32} />
            <h2 className="text-2xl font-bold tracking-tight">
              Add New Student
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: "Name", name: "name", type: "text" },
              { label: "Email", name: "email", type: "email" },
              { label: "Phone", name: "phone", type: "tel" },
              { label: "Password", name: "password", type: "password" },
              { label: "Location", name: "location", type: "text" },
              { label: "Course", name: "course", type: "text" },
              { label: "Teacher", name: "teacher", type: "text" },
            ].map((field) => (
              <div key={field.name} className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder=" "
                  required
                  autoComplete="off"
                  className="peer p-4 pt-6 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={loading}
                />
                <Label
                  htmlFor={field.name}
                  className="absolute left-4 top-4 text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs transition-all bg-white/80 px-1 rounded"
                >
                  {field.label}
                </Label>
              </div>
            ))}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm rounded p-2 bg-red-50 border border-red-100"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-600 text-sm rounded p-2 bg-green-50 border border-green-100"
              >
                {success}
              </motion.div>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-2xl text-lg font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-blue-500 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Adding...
                </>
              ) : (
                <>Add Student</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
