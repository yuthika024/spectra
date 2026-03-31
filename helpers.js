import { MARKETS, MAX_SCORE, MIN_SCORE, RUBRIC } from "./constants.js";

// ── JSON extraction ──────────────────────────────────────────────────────────
export function extractJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  const arrStart = clean.indexOf("[");
  const arrEnd   = clean.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(clean.slice(arrStart, arrEnd + 1)); } catch (_) {}
  }

  const objStart = clean.indexOf("{");
  const objEnd   = clean.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(clean.slice(objStart, objEnd + 1)); } catch (_) {}
  }

  return null;
}

// ── Validation ───────────────────────────────────────────────────────────────
export function validateSetup(s) {
  return (
    Boolean(s.ticker) &&
    Number(s.currentPrice) > 0 &&
    Number(s.stopLoss) > 0 &&
    Number(s.targetPrice) > 0 &&
    Number(s.totalScore) >= MIN_SCORE &&
    Number(s.riskReward) >= 2.0
  );
}

// ── Normalization ────────────────────────────────────────────────────────────
export function normalizeSetup(raw, fallbackCurrency = "USD") {
  return {
    ticker:           String(raw.ticker || "").toUpperCase(),
    name:             String(raw.name || raw.ticker || ""),
    direction:        String(raw.direction || "LONG").toUpperCase() === "SHORT" ? "SHORT" : "LONG",
    currentPrice:     Number(raw.currentPrice) || 0,
    currency:         raw.currency || fallbackCurrency,
    priceChangeToday: Number(raw.priceChangeToday) || 0,
    targetPrice:      Number(raw.targetPrice) || 0,
    targetPercent:    Number(raw.targetPercent) || 0,
    stopLoss:         Number(raw.stopLoss) || 0,
    stopLossPercent:  Number(raw.stopLossPercent) || 0,
    atr:              Number(raw.atr) || 0,
    timeframe:        String(raw.timeframe || ""),
    riskReward:       Number(raw.riskReward) || 0,
    scores:           raw.scores || {},
    totalScore:       Number(raw.totalScore) || 0,
    confidence:       Math.min(100, Math.max(0, Number(raw.confidence) ||
                        Math.round((Number(raw.totalScore) / MAX_SCORE) * 100))),
    confluenceCount:  Number(raw.confluenceCount) || 0,
    bullCase:         String(raw.bullCase || ""),
    bearCase:         String(raw.bearCase || ""),
    invalidationLevel: Number(raw.invalidationLevel) || 0,
    invalidationNote: String(raw.invalidationNote || ""),
    catalysts:        Array.isArray(raw.catalysts) ? raw.catalysts.slice(0, 4) : [],
    indicators:       raw.indicators || {},
    thesis:           String(raw.thesis || ""),
  };
}

// ── Verdict engines ──────────────────────────────────────────────────────────
export function getVerdict(setup) {
  const score = Number(setup.totalScore);
  const rr    = Number(setup.riskReward);
  if (score >= 75 && rr >= 2.5) return { label: "STRONG BUY", color: "var(--lime)" };
  if (score >= 65 && rr >= 2.0) return { label: "BUY",        color: "#88ff44" };
  if (score >= 55)               return { label: "WATCH",      color: "var(--gold)" };
  return                                { label: "AVOID",      color: "var(--red)" };
}

export function getConviction(totalScore) {
  if (totalScore > 75) return "HIGH CONVICTION";
  if (totalScore > 65) return "SOLID SETUP";
  return "WEAK EDGE";
}

export function getPositionVerdict(label) {
  const map = {
    ADD:  { color: "var(--lime)", icon: "++", bg: "rgba(184,255,0,0.06)",  border: "var(--lime-d)" },
    HOLD: { color: "var(--cyan)", icon: "=",  bg: "rgba(0,212,255,0.06)", border: "rgba(0,212,255,0.3)" },
    TRIM: { color: "var(--gold)", icon: "-",  bg: "rgba(255,192,0,0.06)", border: "rgba(255,192,0,0.3)" },
    EXIT: { color: "var(--red)",  icon: "XX", bg: "rgba(255,45,78,0.06)", border: "var(--red-d)" },
  };
  return map[label] || map.HOLD;
}

export function verdictAction(label) {
  const map = {
    ADD:  "Increase exposure",
    HOLD: "Do nothing",
    TRIM: "Reduce position",
    EXIT: "Exit completely",
  };
  return map[label] || "Hold";
}

// ── Colour helpers ────────────────────────────────────────────────────────────
export function scoreColor(ratio) {
  if (ratio >= 0.75) return "var(--lime)";
  if (ratio >= 0.55) return "var(--gold)";
  if (ratio >= 0.40) return "var(--orange)";
  return "var(--red)";
}

// ── Formatting ────────────────────────────────────────────────────────────────
export function fmtP(price, currency) {
  if (!price) return "\u2014";
  const sym = currency === "INR" ? "\u20b9" : "$";
  return sym + Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── TradingView helpers ───────────────────────────────────────────────────────
export function tvWidgetUrl(ticker, market) {
  const mkt    = MARKETS[market] || MARKETS["NSE India"];
  const prefix = mkt.tvPrefix || "";
  const suffix = mkt.tvSuffix || "";
  return `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(prefix + ticker.toUpperCase() + suffix)}&interval=D&theme=dark&style=1&locale=en&toolbar_bg=%230a0a12&hide_top_toolbar=0&hide_legend=0&save_image=0`;
}

export function tvUrl(ticker, market) {
  const mkt    = MARKETS[market] || MARKETS["NSE India"];
  const prefix = mkt.tvPrefix || "";
  const suffix = mkt.tvSuffix || "";
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(prefix + ticker.toUpperCase() + suffix)}`;
}

// ── Position sizing ───────────────────────────────────────────────────────────
export function calcPositionSize(capital, currentPrice, stopLoss) {
  if (!capital || !currentPrice || !stopLoss || stopLoss >= currentPrice) return null;
  const riskAmount    = capital * 0.01;
  const riskPerShare  = Math.abs(currentPrice - stopLoss);
  const shares        = Math.floor(riskAmount / riskPerShare);
  const positionValue = shares * currentPrice;
  const positionPct   = (positionValue / capital) * 100;
  return { shares, positionValue, positionPct, riskAmount };
}

// ── Rubric text for prompts ───────────────────────────────────────────────────
export function buildRubricText() {
  return RUBRIC.map((r) => `  ${r.key} (0-${r.max}): ${r.desc}`).join("\n");
}
