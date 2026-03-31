/**
 * server/index.js
 *
 * Minimal Express proxy for Anthropic API.
 * The API key lives in .env — never in the browser.
 *
 * Install: npm install express dotenv cors
 * Run:     node server/index.js
 */

import "dotenv/config";
import express  from "express";
import cors     from "cors";

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Proxy all Claude API calls
app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not set on server" } });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        // Allow beta features (web search tool)
        "anthropic-beta":    "web-search-2025-03-05",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);

  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(502).json({ error: { message: "Proxy error: " + err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`SPECTRA backend running on http://localhost:${PORT}`);
});
