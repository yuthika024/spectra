/**
 * api.js
 *
 * All Anthropic calls go through /api/analyze (Express backend).
 * The API key NEVER touches the browser.
 *
 * For local dev: set VITE_API_BASE= (empty) so fetch hits localhost:3001
 * For production: set VITE_API_BASE to your deployed backend URL
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {boolean} useSearch - enables web_search tool
 * @returns {Promise<string>} - concatenated text from all content blocks
 */
export async function claudeCall(systemPrompt, userPrompt, useSearch = false) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  };

  if (useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  // Handle tool_use blocks (web search) + text blocks
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
