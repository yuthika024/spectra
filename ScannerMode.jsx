import { useState, useCallback } from "react";
import StockCard from "./StockCard.jsx";
import Pipeline from "./Pipeline.jsx";
import { claudeCall } from "./api.js";
import { MARKETS, RUBRIC, MAX_SCORE, MIN_SCORE, STYLE_RULES } from "./constants.js";
import {
  extractJSON,
  validateSetup,
  normalizeSetup,
  scoreColor,
  buildRubricText,
} from "./helpers.js";

export default function ScannerMode() {
  const [mode,       setMode]       = useState("swing");
  const [market,     setMarket]     = useState("NSE India");
  const [capital,    setCapital]    = useState("");
  const [scanning,   setScanning]   = useState(false);
  const [stageIdx,   setStageIdx]   = useState(-1);
  const [progress,   setProgress]   = useState(0);
  const [logMsg,     setLogMsg]     = useState("");
  const [results,    setResults]    = useState([]);
  const [regime,     setRegime]     = useState(null);
  const [noTrade,    setNoTrade]    = useState(null);
  const [error,      setError]      = useState("");
  const [lastScan,   setLastScan]   = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  const mkt        = MARKETS[market];
  const capitalNum = parseFloat(capital.replace(/[^0-9.]/g, "")) || 0;
  const today      = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const doScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setError("");
    setResults([]);
    setRegime(null);
    setNoTrade(null);
    setStageIdx(0);
    setProgress(8);

    try {
      setLogMsg("Sweeping news, technicals, screeners, regime, and no-trade signals...");

      const research = await claudeCall(
        `You are a comprehensive financial intelligence system. Search exhaustively for market-moving information across news, technicals, screeners, and macro data for ${mkt.region}. Run at least 6 different web searches. Return a rich detailed brief with specific ticker symbols, exact prices, RSI readings, volume ratios, and percentage moves.`,
        `Today: ${today}. Market: ${market}. Mode: ${mode === "intraday" ? "intraday same-session" : "swing 3-12 days"}.\n\nSearch for: (1) market regime -- what is Nifty/SPY/BTC doing and VIX; (2) top gainers/losers with exact % moves; (3) earnings releases and analyst upgrades/downgrades; (4) stocks with RSI below 35 showing reversal OR above 65 in strong uptrend; (5) MACD bullish/bearish crossovers in last 1-2 sessions; (6) stocks with volume 2x+ above average; (7) breakouts above resistance or breakdowns below support with specific price levels; (8) FII/DII institutional flows and sector rotation; (9) any no-trade conditions: high VIX, major central bank events, market breakdown, holiday.\n\nReturn a detailed brief with specific numbers and ticker symbols.`,
        true
      );

      setStageIdx(1);
      setProgress(60);
      setLogMsg("Scoring setups, running dialectic analysis, ranking by score...");

      const rubricText = buildRubricText();
      const synthResult = await claudeCall(
        "You output only a single raw JSON object. No markdown. No backticks. No text before { or after }. Start with { and end with }.",
        `You are a systematic quantitative analyst. Based on this research brief:\n\n${research.slice(0, 3000)}\n\n${STYLE_RULES}\n\nOutput ONLY this JSON structure (start with { immediately):\n{\n  "regime": {\n    "label": "BULL",\n    "vix": 14.5,\n    "indexMove": "Nifty +0.6% today",\n    "summary": "one sharp sentence"\n  },\n  "noTrade": {\n    "recommended": false,\n    "reasons": [],\n    "verdict": "one sentence"\n  },\n  "setups": [\n    {\n      "ticker": "SYMBOL",\n      "name": "Company",\n      "direction": "LONG",\n      "currentPrice": 0,\n      "currency": "${mkt.currency}",\n      "priceChangeToday": 0,\n      "targetPrice": 0,\n      "targetPercent": 0,\n      "stopLoss": 0,\n      "stopLossPercent": 0,\n      "atr": 0,\n      "timeframe": "${mode === "intraday" ? "1-3 hours" : "5-8 days"}",\n      "riskReward": 0,\n      "scores": {\n${rubricText}\n      },\n      "totalScore": 0,\n      "confidence": 0,\n      "confluenceCount": 0,\n      "bullCase": "Sharp 1-sentence trader take",\n      "bearCase": "Sharp 1-sentence trader take",\n      "invalidationLevel": 0,\n      "invalidationNote": "Break below [price] -> exit immediately",\n      "catalysts": ["cat1", "cat2"],\n      "indicators": { "rsi": 0, "macd": "bullish", "volume": "above average", "trend": "uptrend", "pattern": "bull flag" },\n      "thesis": "2 short decisive sentences. No hedging."\n    }\n  ]\n}\n\nRULES: totalScore = sum of scores (max ${MAX_SCORE}). Only include setups where totalScore >= ${MIN_SCORE} AND riskReward >= 2.0. Targets: ${mode === "intraday" ? "intraday 1.5-3%, stop 0.7-1.2%" : "swing 4-12%, stop 1.5-3.5%"}. Generate 5-8 setups.`,
        false
      );

      setProgress(92);
      setLogMsg("Validating and filtering setups...");

      const parsed = extractJSON(synthResult);
      if (!parsed) throw new Error(`Could not parse analytical output. Preview: ${synthResult.slice(0, 150)}`);

      const root    = Array.isArray(parsed) ? { setups: parsed } : parsed;
      if (root.regime)  setRegime(root.regime);
      if (root.noTrade) setNoTrade(root.noTrade);

      const cleaned = (Array.isArray(root.setups) ? root.setups : [])
        .map((r) => normalizeSetup(r, mkt.currency))
        .filter(validateSetup)
        .sort((a, b) => b.totalScore - a.totalScore);

      if (cleaned.length === 0 && !root.noTrade?.recommended) {
        throw new Error(`No setups passed validation (score >= ${MIN_SCORE}, R:R >= 2.0). Try during market hours.`);
      }

      setResults(cleaned);
      setLastScan(new Date());
      setProgress(100);
      setLogMsg(`${cleaned.length} setup${cleaned.length !== 1 ? "s" : ""} passed all filters`);

    } catch (err) {
      setError(err.message || "Scan failed. Please try again.");
      setLogMsg("Error -- see message above");
    }

    setScanning(false);
  }, [mode, market, scanning]);

  const longs    = results.filter((r) => r.direction === "LONG").length;
  const shorts   = results.filter((r) => r.direction === "SHORT").length;
  const avgScore = results.length
    ? Math.round(results.reduce((a, b) => a + b.totalScore, 0) / results.length)
    : null;
  const topConf  = results.length ? Math.max(...results.map((r) => r.confidence)) : null;

  const regimeClass = (label) =>
    label === "BULL" ? "rc-bull" : label === "BEAR" ? "rc-bear" : "rc-chop";

  return (
    <>
      {/* CONTROLS */}
      <div className="ctrl">
        <div className="seg">
          <button
            className={`seg-btn ${mode === "intraday" ? "sa-i" : ""}`}
            onClick={() => setMode("intraday")}
          >
            Intraday
          </button>
          <button
            className={`seg-btn ${mode === "swing" ? "sa-s" : ""}`}
            onClick={() => setMode("swing")}
          >
            Swing
          </button>
        </div>
        <select className="mkt-sel" value={market} onChange={(e) => setMarket(e.target.value)}>
          {Object.keys(MARKETS).map((m) => <option key={m}>{m}</option>)}
        </select>
        <input
          className="inp inp-med"
          placeholder="Capital (e.g. 100000)"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />
        <button
          className={`btn-ghost ${showLegend ? "active" : ""}`}
          onClick={() => setShowLegend((v) => !v)}
        >
          {showLegend ? "Hide" : "Show"} Rubric
        </button>
        <button
          className={`btn-prime ml-auto ${scanning ? "running" : ""}`}
          onClick={doScan}
          disabled={scanning}
        >
          {scanning ? <><div className="spin" />Scanning&hellip;</> : `\u25b6 Scan ${mode === "intraday" ? "Intraday" : "Swing"}`}
        </button>
      </div>

      {/* LEGEND */}
      {showLegend && (
        <div style={{ padding: "0 24px", background: "var(--s1)", borderBottom: "1px solid var(--border)" }}>
          <div className="legend">
            <div className="legend-ttl">
              Scoring Rubric -- Max: {MAX_SCORE} pts. Minimum to pass: {MIN_SCORE} pts. R:R must be &ge; 2.0:1.
            </div>
            <div className="legend-grid">
              {RUBRIC.map((r) => (
                <div key={r.key} className="leg-item">
                  <div className="leg-f">{r.label}</div>
                  <div className="leg-p">max {r.max} pts</div>
                  <div className="leg-d">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE */}
      {(scanning || stageIdx >= 0) && (
        <Pipeline
          stages={["Research Sweep", "Score + Rank"]}
          stageIdx={stageIdx}
          progress={progress}
          scanning={scanning}
          logMsg={logMsg}
        />
      )}

      {/* REGIME BANNER */}
      {regime && (
        <div className="regime-bar">
          <div className={`regime-chip ${regimeClass(regime.label)}`}>
            {regime.label === "BULL" ? "\u25b2" : regime.label === "BEAR" ? "\u25bc" : "\u2248"} {regime.label}
          </div>
          {regime.vix != null && (
            <div className={`regime-chip ${regime.vix > 20 ? "rc-bear" : "rc-bull"}`}>
              VIX {Number(regime.vix).toFixed(1)}
            </div>
          )}
          {regime.indexMove && (
            <div className={`regime-chip ${regime.indexMove.includes("+") ? "rc-bull" : "rc-bear"}`}>
              {regime.indexMove}
            </div>
          )}
          {regime.summary && <div className="regime-txt">{regime.summary}</div>}
        </div>
      )}

      {/* NO-TRADE BANNER */}
      {noTrade?.recommended && (
        <div className="no-trade-bar">
          <div className="nt-title">No-Trade Advisory</div>
          {noTrade.reasons?.length > 0 && (
            <div className="nt-reasons">
              {noTrade.reasons.map((r, i) => (
                <div key={i} className="nt-reason"><b>&#9632;</b>{r}</div>
              ))}
            </div>
          )}
          {noTrade.verdict && <div className="nt-verdict">{noTrade.verdict}</div>}
        </div>
      )}

      {/* CONTENT */}
      <div className="content">
        {results.length > 0 && (
          <div className="stats">
            <div className="stat">
              <div className="stat-l">Setups Passed</div>
              <div className="stat-v" style={{ color: "var(--text)" }}>{results.length}</div>
            </div>
            <div className="stat">
              <div className="stat-l">Long</div>
              <div className="stat-v" style={{ color: "var(--lime)" }}>{longs}</div>
            </div>
            <div className="stat">
              <div className="stat-l">Short</div>
              <div className="stat-v" style={{ color: "var(--red)" }}>{shorts}</div>
            </div>
            <div className="stat">
              <div className="stat-l">Avg Score</div>
              <div className="stat-v" style={{ color: scoreColor(avgScore / MAX_SCORE) }}>
                {avgScore}/{MAX_SCORE}
              </div>
            </div>
            <div className="stat">
              <div className="stat-l">Top Confidence</div>
              <div className="stat-v" style={{ color: "var(--cyan)" }}>{topConf}%</div>
            </div>
          </div>
        )}

        {error && (
          <div className="err-box">
            {error}
            <br />
            <span style={{ color: "var(--text2)" }}>
              Best results during market hours. Try a different market or mode if the issue persists.
            </span>
          </div>
        )}

        <div className="sec-lbl">
          {results.length > 0
            ? `${results.length} setups \u00b7 score >= ${MIN_SCORE}/${MAX_SCORE} \u00b7 R:R >= 2:1 \u00b7 ${lastScan ? lastScan.toLocaleTimeString() : ""}`
            : "Awaiting scan"}
        </div>

        <div className="grid">
          {results.length === 0 && !scanning && (
            <div className="empty" style={{ gridColumn: "1/-1" }}>
              <div className="empty-icon">\u25ca</div>
              <div className="empty-msg">
                {noTrade?.recommended
                  ? "No setups recommended -- see advisory above"
                  : "Select mode and market, then run scan"}
              </div>
            </div>
          )}
          {results.map((setup, i) => (
            <StockCard key={i} setup={setup} capital={capitalNum} market={market} idx={i} />
          ))}
        </div>

        <div className="disc">
          RISK DISCLAIMER -- SPECTRA is an AI research tool for personal use only. All outputs are
          AI-generated estimates using a heuristic scoring rubric. This is not financial or investment
          advice. Always verify independently. Never trade with capital you cannot afford to lose.
          Scores and confidence figures do not guarantee outcomes.
        </div>
      </div>
    </>
  );
}
