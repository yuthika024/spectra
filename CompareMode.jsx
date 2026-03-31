import { useState, useCallback } from "react";
import StockCard from "../components/StockCard.jsx";
import Pipeline from "../components/Pipeline.jsx";
import { claudeCall } from "../utils/api.js";
import { MARKETS, MAX_SCORE, MIN_SCORE, STYLE_RULES } from "../utils/constants.js";
import {
  extractJSON,
  normalizeSetup,
  getVerdict,
  scoreColor,
  buildRubricText,
} from "../utils/helpers.js";

export default function CompareMode() {
  const [tickerInput,      setTickerInput]      = useState("");
  const [market,           setMarket]           = useState("NSE India");
  const [comparing,        setComparing]        = useState(false);
  const [results,          setResults]          = useState([]);
  const [allocationVerdict, setAllocationVerdict] = useState("");
  const [winnerReason,     setWinnerReason]     = useState("");
  const [error,            setError]            = useState("");
  const [stageIdx,         setStageIdx]         = useState(-1);
  const [progress,         setProgress]         = useState(0);
  const [logMsg,           setLogMsg]           = useState("");

  const mkt   = MARKETS[market];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const doCompare = useCallback(async () => {
    const tickers = tickerInput
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (tickers.length < 2) { setError("Enter at least 2 tickers separated by commas."); return; }
    if (tickers.length > 5) { setError("Maximum 5 tickers for comparison."); return; }
    if (comparing) return;

    setComparing(true);
    setError("");
    setResults([]);
    setAllocationVerdict("");
    setWinnerReason("");
    setStageIdx(0);
    setProgress(10);

    try {
      setLogMsg(`Researching ${tickers.join(", ")}...`);

      const research = await claudeCall(
        "You are a comparative market analyst. Research multiple stocks simultaneously. For each, gather current price, technical readings, momentum, catalysts, and sector context. Be specific with numbers.",
        `Today: ${today}. Market: ${market}. Compare: ${tickers.join(", ")}.\n\nFor EACH ticker: current price and today's change, RSI, MACD, volume vs average, recent price trend, nearest support and resistance, any news catalysts. Also assess which has strongest momentum and each ticker's sector.`,
        true
      );

      setStageIdx(1);
      setProgress(65);
      setLogMsg("Scoring, ranking, and generating capital allocation verdict...");

      const rubricText = buildRubricText();
      const synthResult = await claudeCall(
        "You output only a raw JSON object. No markdown. No backticks. Start with { and end with }.",
        `You are a capital allocation analyst. Based on this research:\n\n${research.slice(0, 2500)}\n\n${STYLE_RULES}\n\nOutput ONLY this JSON (start with { immediately):\n{\n  "setups": [\n    {\n      "ticker": "SYMBOL",\n      "name": "Company",\n      "direction": "LONG",\n      "currentPrice": 0,\n      "currency": "${mkt.currency}",\n      "priceChangeToday": 0,\n      "targetPrice": 0,\n      "targetPercent": 0,\n      "stopLoss": 0,\n      "stopLossPercent": 0,\n      "atr": 0,\n      "timeframe": "5-8 days",\n      "riskReward": 0,\n      "scores": {\n${rubricText}\n      },\n      "totalScore": 0,\n      "confidence": 0,\n      "confluenceCount": 0,\n      "bullCase": "1 sharp sentence",\n      "bearCase": "1 sharp sentence",\n      "invalidationLevel": 0,\n      "invalidationNote": "Break below [price] -> exit",\n      "catalysts": ["cat1"],\n      "indicators": { "rsi": 0, "macd": "neutral", "volume": "normal", "trend": "sideways", "pattern": "none" },\n      "thesis": "2 decisive sentences"\n    }\n  ],\n  "winnerReason": "Strongest momentum + clean breakout + sector tailwind -- 1 sharp sentence explaining why rank #1 wins",\n  "allocationVerdict": "2-3 sentences. Which ticker deserves capital priority and exactly why. Be direct and actionable."\n}\n\nScore ALL ${tickers.length} tickers (${tickers.join(", ")}). totalScore = sum of scores (max ${MAX_SCORE}). Sort setups by totalScore descending.`,
        false
      );

      setProgress(92);

      const parsed = extractJSON(synthResult);
      if (!parsed) throw new Error("Could not parse comparison results. Try again.");

      const root    = Array.isArray(parsed) ? { setups: parsed } : parsed;
      const cleaned = (Array.isArray(root.setups) ? root.setups : [])
        .map((r) => normalizeSetup(r, mkt.currency))
        .filter((s) => s.ticker && s.currentPrice > 0)
        .sort((a, b) => b.totalScore - a.totalScore);

      setResults(cleaned);
      setWinnerReason(root.winnerReason || "");
      setAllocationVerdict(root.allocationVerdict || "");
      setProgress(100);
      setLogMsg(`Comparison complete -- ${cleaned.length} tickers ranked`);

    } catch (err) {
      setError(err.message || "Comparison failed. Try again.");
      setLogMsg("Error");
    }

    setComparing(false);
  }, [tickerInput, market, comparing]);

  return (
    <>
      <div className="ctrl">
        <input
          className="inp"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Tickers separated by commas (e.g. RELIANCE, TCS, INFY)"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doCompare()}
        />
        <select className="mkt-sel" value={market} onChange={(e) => setMarket(e.target.value)}>
          {Object.keys(MARKETS).map((m) => <option key={m}>{m}</option>)}
        </select>
        <button
          className={`btn-prime ml-auto ${comparing ? "running" : ""}`}
          onClick={doCompare}
          disabled={comparing}
        >
          {comparing ? <><div className="spin" />Comparing&hellip;</> : "Compare + Rank"}
        </button>
      </div>

      {(comparing || stageIdx >= 0) && (
        <Pipeline
          stages={["Research All Tickers", "Score + Rank"]}
          stageIdx={stageIdx}
          progress={progress}
          scanning={comparing}
          logMsg={logMsg}
        />
      )}

      <div className="content">
        {error && <div className="err-box">{error}</div>}

        {results.length === 0 && !comparing && (
          <div className="empty">
            <div className="empty-icon">\u2261</div>
            <div className="empty-msg">Enter 2-5 tickers to compare and allocate capital</div>
          </div>
        )}

        {results.length > 0 && (
          <>
            {/* WHY #1 WINS */}
            {winnerReason && (
              <div className="winner-box">
                <div className="winner-box-lbl">\u{1F947} Why #{1} wins</div>
                <div className="winner-box-txt">{winnerReason}</div>
              </div>
            )}

            {/* ALLOCATION VERDICT */}
            {allocationVerdict && (
              <div className="alloc-verdict">
                <div className="alloc-ttl">Capital Allocation Verdict</div>
                <div className="alloc-txt">{allocationVerdict}</div>
              </div>
            )}

            {/* RANKED TABLE */}
            <div className="sec-lbl">{results.length} tickers ranked by score</div>
            <div className="compare-table" style={{ marginBottom: 20 }}>
              <div className="compare-row header-row">
                <div className="compare-cell">Rank</div>
                <div className="compare-cell">Ticker</div>
                <div className="compare-cell">Score</div>
                <div className="compare-cell">R:R</div>
                <div className="compare-cell">RSI</div>
                <div className="compare-cell">Momentum</div>
                <div className="compare-cell">Verdict</div>
              </div>
              {results.map((s, i) => {
                const verdict = getVerdict(s);
                const ind     = s.indicators || {};
                return (
                  <div
                    key={i}
                    className="compare-row"
                    style={{ background: i === 0 ? "rgba(184,255,0,0.03)" : "transparent" }}
                  >
                    <div className="compare-cell">
                      <span className={`rank-num ${i === 0 ? "rank-1" : i === 1 ? "rank-2" : ""}`}>
                        #{i + 1}
                      </span>
                    </div>
                    <div className="compare-cell">
                      <div style={{ fontFamily: "var(--disp)", fontSize: 13, fontWeight: 700 }}>{s.ticker}</div>
                      <div style={{ fontSize: 8, color: "var(--muted)" }}>{s.name}</div>
                    </div>
                    <div className="compare-cell">
                      <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.totalScore / MAX_SCORE) }}>
                        {s.totalScore}
                      </span>
                      <span style={{ fontSize: 8, color: "var(--muted)" }}>/{MAX_SCORE}</span>
                    </div>
                    <div className="compare-cell" style={{ color: "var(--cyan)", fontWeight: 700 }}>
                      {s.riskReward ? `${Number(s.riskReward).toFixed(1)}:1` : "\u2014"}
                    </div>
                    <div className="compare-cell" style={{ color: "var(--gold)" }}>
                      {ind.rsi ? Number(ind.rsi).toFixed(0) : "\u2014"}
                    </div>
                    <div
                      className="compare-cell"
                      style={{
                        color: ind.macd === "bullish" ? "var(--lime)"
                             : ind.macd === "bearish" ? "var(--red)"
                             : "var(--gold)",
                        fontSize: 9,
                      }}
                    >
                      {ind.macd || "\u2014"}
                    </div>
                    <div className="compare-cell">
                      <span style={{ fontSize: 9, fontWeight: 700, color: verdict.color }}>
                        {verdict.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FULL CARDS */}
            <div className="sec-lbl">Full analysis</div>
            <div className="grid">
              {results.map((setup, i) => (
                <StockCard key={i} setup={setup} capital={0} market={market} idx={i} />
              ))}
            </div>
          </>
        )}

        <div className="disc">
          Comparison is AI-generated. Capital allocation verdicts are not financial advice.
        </div>
      </div>
    </>
  );
}
