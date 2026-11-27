// Direct Claude (Anthropic API) provider for every Course Management AI task.
// Used instead of the n8n workflow when ANTHROPIC_API_KEY is set in backend/.env.
//
//   ANTHROPIC_API_KEY=sk-ant-...        (required to enable Claude)
//   CLAUDE_MODEL=claude-opus-5-5        (optional, default shown)
//   CLAUDE_EFFORT=medium                (optional: low | medium | high)
import Anthropic from "@anthropic-ai/sdk";
import { buildIicpaSystemPrompt } from "./iicpaSystemPrompt.js";

const DEFAULT_MODEL = "claude-opus-5-5";

export const claudeEnabled = () => !!String(process.env.ANTHROPIC_API_KEY || "").trim();

let client = null;
const getClient = () => {
  // The SDK reads ANTHROPIC_API_KEY from the environment
  if (!client) client = new Anthropic({ maxRetries: 2 });
  return client;
};


const EFFORTS = new Set(["low", "medium", "high", "xhigh", "max"]);

/**
 * Sends one prompt to Claude and returns the text of the answer.
 * Streaming is used because long lessons can take a few minutes to write.
 */
export async function generateWithClaude({ prompt, json = false, effort: effortOverride }) {
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  const effort = EFFORTS.has(effortOverride)
    ? effortOverride
    : EFFORTS.has(process.env.CLAUDE_EFFORT)
      ? process.env.CLAUDE_EFFORT
      : "medium";

  const stream = getClient().beta.messages.stream({
    model,
    max_tokens: 32000,
    system: buildIicpaSystemPrompt({ json }),
    output_config: { effort },
    // If a safety classifier declines, the API retries on a suitable fallback model
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content: json ? `${prompt}\n\nRespond with the JSON only.` : prompt,
      },
    ],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined this request. Try rephrasing the title or instructions.");
  }
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned an empty response.");
  if (message.stop_reason === "max_tokens") {
    // Keep what was written, but make the truncation visible in logs
    console.warn("Claude response hit max_tokens; the result may be cut off.");
  }
  return text;
}

/** Turns SDK errors into short messages the admin UI can show */
export function describeClaudeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Claude API key is invalid. Check ANTHROPIC_API_KEY in backend/.env.";
  if (err instanceof Anthropic.PermissionDeniedError) return "This Claude API key does not have access to the selected model.";
  if (err instanceof Anthropic.NotFoundError) return `Claude model not found. Check CLAUDE_MODEL in backend/.env.`;
  if (err instanceof Anthropic.RateLimitError) return "Claude rate limit reached. Please wait a minute and try again.";
  if (err instanceof Anthropic.BadRequestError) return `Claude rejected the request: ${err.message}`;
  if (err instanceof Anthropic.InternalServerError) return "Claude is temporarily unavailable. Please try again.";
  if (err instanceof Anthropic.APIConnectionError) return "Could not reach the Claude API (network error).";
  return err?.message || "Claude request failed.";
}
