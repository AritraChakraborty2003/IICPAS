import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import axios from "axios";
import Quill from "react-quill-new";

export default function TopicForm({ chapterId, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    status: "Active",
  });
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    if (chapterId)
      axios
        .get(
          `${getApiBase()}/topics/by-chapter/${chapterId}`
        )
        .then((res) => setTopics(res.data));
  }, [chapterId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleQuill = (val) => setForm((f) => ({ ...f, content: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await axios.post(
      `${getApiBase()}/topics/by-chapter/${chapterId}`,
      form
    );
    setTopics((ts) => [...ts, data]);
    setForm({ title: "", content: "", status: "Active" });
    onSuccess && onSuccess(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-4">
        <input
          name="title"
          placeholder="Topic Title"
          className="w-full border p-2 rounded"
          value={form.title}
          onChange={handleChange}
        />
        <Quill
          value={form.content}
          onChange={handleQuill}
          className="bg-white"
        />
        <select
          name="status"
          className="w-full border p-2 rounded"
          value={form.status}
          onChange={handleChange}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <FaPlus /> Add Topic
        </button>
      </form>
      <div>
        <h4 className="font-semibold mt-4 mb-2">Topics:</h4>
        <ul>
          {topics.map((t, i) => (
            <li key={t._id || i}>{t.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
