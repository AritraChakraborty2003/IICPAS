"use client";

import { useState, useEffect } from "react";
import { FaThumbsUp, FaCommentAlt, FaShareAlt, FaYoutube } from "react-icons/fa";
import axios from "axios";

const getApiBase = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api";

  const trimmed = configuredBase.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const extractNewsItems = (payload: any): NewsItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.news)) return payload.news;
  if (Array.isArray(payload?.data?.news)) return payload.data.news;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

interface NewsItem {
  _id: string;
  title: string;
  descr: string;
  link: string;
  createdAt: string;
}

export default function NewsTab() {
  const API_BASE = getApiBase();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/news`);
        setNewsItems(extractNewsItems(response.data));
        setError(null);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [API_BASE]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen px-6 py-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">News</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading news...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen px-6 py-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">News</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen px-6 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">News</h2>

      {newsItems.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">No news available at the moment.</div>
        </div>
      ) : (
        <div className="space-y-8">
          {newsItems.map((item) => (
            <div
              key={item._id}
              className="bg-gray-100 rounded-xl p-5 shadow-md flex flex-col md:flex-row gap-6"
            >
              {/* Media Preview */}
              <div className="md:w-1/3 flex items-center justify-center">
                {item.link && item.link.includes('youtube') ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full aspect-video bg-black flex items-center justify-center rounded-lg"
                  >
                    <FaYoutube className="text-red-500 text-5xl" />
                  </a>
                ) : (
                  <div className="w-full aspect-video bg-gray-300 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">News</span>
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className="md:w-2/3 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-800">{item.title}</h3>
                  <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                </div>
                <p className="whitespace-pre-line text-gray-700 text-sm">{item.descr}</p>

                {/* Reactions */}
                <div className="flex gap-4 items-center pt-2">
                  <button className="flex items-center gap-1 px-3 py-1 bg-yellow-200 text-yellow-700 rounded-full">
                    <FaShareAlt />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    <FaThumbsUp />
                    <span>0</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    <FaCommentAlt />
                    <span>0</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
