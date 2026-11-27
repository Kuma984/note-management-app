/**
 * Tiny client for any OpenAI-compatible LLM API (chat + embeddings). Default = Google Gemini.
 *
 *   LLM_API_KEY          (required)  e.g. a Google AI Studio key
 *   LLM_BASE_URL         default https://generativelanguage.googleapis.com/v1beta/openai
 *   LLM_MODEL            default gemini-3.8-flash   (check the current name in Google AI Studio)
 *   EMBEDDING_MODEL      default gemini-embedding-001
 *   LLM_REASONING_EFFORT optional: none | low | medium | high
 *
 * Works with OpenAI / Groq / OpenRouter too: just change the three variables.
 */
class LlmError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

const baseUrl = () => (process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '');
const isConfigured = () => !!process.env.LLM_API_KEY;

async function post(path, body, timeoutMs = 45000) {
  if (!isConfigured()) throw new LlmError('AI is not configured on the server (missing LLM_API_KEY).', 503);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (err) {
      /* not JSON */
    }
    if (!res.ok) {
      const detail = json?.error?.message || json?.[0]?.error?.message || text.slice(0, 200);
      throw new LlmError(`AI service error (${res.status}): ${detail}`, res.status === 429 ? 429 : 502);
    }
    return json;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err.name === 'AbortError') throw new LlmError('The AI service took too long to answer. Please try again.', 504);
    throw new LlmError(`Cannot reach the AI service: ${err.message}`, 502);
  } finally {
    clearTimeout(timer);
  }
}

async function chat({ system, user, temperature = 0.2 }) {
  const body = {
    model: process.env.LLM_MODEL || 'gemini-3.8-flash',
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (process.env.LLM_REASONING_EFFORT) body.reasoning_effort = process.env.LLM_REASONING_EFFORT;
  const json = await post('/chat/completions', body);
  const out = json?.choices?.[0]?.message?.content;
  if (!out || !String(out).trim()) throw new LlmError('The AI returned an empty answer. Please try again.', 502);
  return String(out).trim();
}

async function embed(inputs) {
  const json = await post('/embeddings', { model: process.env.EMBEDDING_MODEL || 'gemini-embedding-001', input: inputs });
  const data = json?.data;
  if (!Array.isArray(data) || data.length !== inputs.length) throw new LlmError('Unexpected embeddings response.', 502);
  return [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((d) => d.embedding);
}

module.exports = { LlmError, isConfigured, chat, embed };
