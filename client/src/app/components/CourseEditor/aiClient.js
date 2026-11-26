"use client";
import axios from "axios";
import { getApiBase } from "@/lib/apiBase";

const API_BASE = getApiBase();

const authHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const withAuth = (cfg = {}) => ({ ...cfg, headers: { ...authHeaders(), ...(cfg.headers || {}) } });

export const aiHttp = {
  get: (url, cfg) => axios.get(`${API_BASE}${url}`, withAuth(cfg)),
  post: (url, body, cfg) => axios.post(`${API_BASE}${url}`, body, withAuth(cfg)),
  put: (url, body, cfg) => axios.put(`${API_BASE}${url}`, body, withAuth(cfg)),
  delete: (url, cfg) => axios.delete(`${API_BASE}${url}`, withAuth(cfg)),
};

export const errorMessage = (err, fallback = "Something went wrong.") =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait for an AI job (returned by any generate endpoint) to finish.
 * Resolves with job.result, rejects with a readable error.
 */
export async function waitForJob(job, { onTick, shouldStop, intervalMs = 3000, maxMs = 330000 } = {}) {
  if (!job) throw new Error("No AI job was started.");
  let current = job;
  const startedAt = Date.now();
  onTick?.(current, 0);
  while (current.status === "pending") {
    if (shouldStop?.()) throw new Error("Cancelled");
    if (Date.now() - startedAt > maxMs) throw new Error("Timed out waiting for the AI result.");
    await sleep(intervalMs);
    const { data } = await aiHttp.get(`/ai/jobs/${current._id}`);
    current = data.job;
    onTick?.(current, Date.now() - startedAt);
  }
  if (current.status === "failed") throw new Error(current.error || "AI generation failed.");
  return current.result;
}

/** POST to a generate endpoint and wait for its job's result */
export async function runAi(url, body, opts) {
  const { data } = await aiHttp.post(url, body);
  return { result: await waitForJob(data.job, opts), data };
}

export const htmlToText = (html = "") => {
  if (typeof window === "undefined") return String(html).replace(/<[^>]*>/g, " ");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText || div.textContent || "";
};

export const textStats = (html = "") => {
  const text = htmlToText(html).replace(/\s+/g, " ").trim();
  return { words: text ? text.split(" ").length : 0, characters: text.length };
};

export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d);
};

export const formatElapsed = (ms = 0) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
