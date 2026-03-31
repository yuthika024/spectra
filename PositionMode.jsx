import { useState, useCallback } from "react";
import Pipeline from "../components/Pipeline.jsx";
import { claudeCall } from "../utils/api.js";
import { MARKETS, STYLE_RULES } from "../utils/constants.js";
import {
  extractJSON,
  getPositionVerdict,
  verdictAction,
  fmtP,
  tvUrl,
  scoreColor,
} from "../utils/helpers.js";

export default function PositionMode() {
  const [ticker,    setTicker]    = useState("");
  const [entry,     setEntry]     = useState("");
  const [qty,       setQty]       = useState("");
  const [market,    setMarket]    = useState("NSE India");
  const [analyzing, setAnalyzing] = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");
  const [stageIdx,  setStageIdx]  = useState(-1);
  const [progress,  setProgress]  = useState(0);
  const [logMsg,    setLogMsg]    = useState("");

  const mkt   = MARKETS[market];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const analyze = useCallback(async () => {
    const t = ticker.trim().toUpperCase();
    if (!t || analyzing) return;
    setAnalyzing(true);
    setError("");
    setResult(null);
    setStageIdx(0);
    setProgress(10);

    try {
      setLogMsg(`Fetching live price, technical data, and news for ${t}...`);

      const research = await claudeCall(
        "You are a real-time position analyst. Search for the most current available information about this specific stock/asset. Get latest price, recent price action, technical indicators, and any news. Be specific with numbers.",
        `Today: ${today}. Market: ${market}. Analyze: ${t}.\nSearch for: (1) current price and today's % change; (2) recent price action over last 5-10 sessions; (3) RSI-14 reading and trend; (4) MACD signal; (5) volume vs average; (6) nearest support and resistance with exact prices; (7) any recent news or catalysts; (8) sector performance.`,
        true
      );

      setStageIdx(1);
      setProgress(60);
      setLogMsg("Running position intelligence analysis...");

      const entryNum = parseFloat(entry) || 0;
      const qtyNum   = parseFloat(qty) || 0;

      const synthResult = await claudeCall(
        "You output only a single raw JSON object. No markdown. No text before { or after }.",
        `You are an expert position manager. Based on this research:\n\n${research.slice(0, 2500)}\n\n${STYLE_RULES}\n\nThe trader bought ${t}${entryNum > 0 ? ` at entry price ${entryNum} ${mkt.currency}` : ""}${qtyNum > 0 ? `, quantity ${qtyNum}` : ""}.\n\nOutput ONLY this JSON (start with { immediately):\n{\n  "ticker": "${t}",\n  "name": "Full company name",\n  "currency": "${mkt.currency}",\n  "currentPrice": 0,\n  "priceChangeToday": 0,\n  "verdict": "HOLD",\n  "verdictReason": "Sharp 1-2 sentences. No hedging.",\n  "updatedTarget": 0,\n  "updatedStop": 0,\n  "invalidationLevel": 0,\n  "invalidationNote": "Break below [price] -> thesis invalid. Exit immediately.",\n  "bullCase": "1 sentence. Decisive.",\n  "bearCase": "1 sentence. Decisive.",\n  "whatNext": "1-2 sentences on most likely price path. No maybes.",\n  "trend": "uptrend",\n  "momentum": "strengthening",\n  "structure": "near resistance",\n  "rsi": 0,\n  "macd": "bullish",\n  "support": 0,\n  "resistance": 0\n}\n\nverdict must be exactly: ADD, HOLD, TRIM, or EXIT.`,
        false
      );

      setProgress(95);

      const parsed = extractJSON(synthResult);
      if (!parsed || !parsed.ticker) throw new Error("Could not parse position analysis. Try again.");

      setResult({
        ticker:          t,
        name:            String(parsed.name || t),
        currency:        parsed.currency || mkt.currency,
        currentPrice:    Number(parsed.currentPrice) || 0,
        priceChangeToday: Number(parsed.priceChangeToday) || 0,
        verdict:         String(parsed.verdict || "HOLD").toUpperCase(),
        verdictReason:   String(parsed.verdictReason || ""),
        updatedTarget:   Number(parsed.updatedTarget) || 0,
        updatedStop:     Number(parsed.updatedStop) || 0,
        invalidationLevel: Number(parsed.invalidationLevel) || 0,
        invalidationNote:  String(parsed.invalidationNote || ""),
        bullCase:        String(parsed.bullCase || ""),
        bearCase:        String(parsed.bearCase || ""),
        whatNext:        String(parsed.whatNext || ""),
        trend:           String(parsed.trend || ""),
        momentum:        String(parsed.momentum || ""),
        structure:       String(parsed.structure || ""),
        rsi:             Number(parsed.rsi) || 0,
        macd:            String(parsed.macd || ""),
        support:         Number(parsed.support) || 0,
        resistance:      Number(parsed.resistance) || 0,
        entryPrice:      entryNum,
        qty:             qtyNum,
      });
      setProgress(100);
      setLogMsg("Analysis complete");

    } catch (err) {
      setError(err.message || "Analysis failed. Try again.");
      setLogMsg("Error");
    }

    setAnalyzing(false);
  }, [ticker, entry, qty, market, analyzing]);

  const r      = result;
  const vd     = r ? getPositionVerdict(r.verdict) : null;
  const action = r ? verdictAction(r.verdict) : null;
  const pnlPct = r && r.entryPrice > 0
    ? ((r.currentPrice - r.entryPrice) / r.entryPrice) * 100
    : null;
  const pnlAbs = r && r.entryPrice > 0 && r.qty > 0
    ? (r.currentPrice - r.entryPrice) * r.qty
    : null;

  return (
    <>
      <div className="ctrl">
        <input
          className="inp inp-wide"
          placeholder="Ticker (e.g. RELIANCE, AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
        />
        <input
          className="inp inp-med"
          placeholder="Entry price (optional)"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />
        <input
          className="inp inp-sm"
          placeholder="Quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <select className="mkt-sel" value={market} onChange={(e) => setMarket(e.target.value)}>
          {Object.keys(MARKETS).map((m) => <option key={m}>{m}</option>)}
        </select>
        <button
          className={`btn-prime ml-auto ${analyzing ? "running" : ""}`}
          onClick={analyze}
          disabled={analyzing || !ticker.trim()}
        >
          {analyzing ? <><div className="spin" />Analyzing&hellip;</> : "Analyze Position"}
        </button>
      </div>

      {(analyzing || stageIdx >= 0) && (
        <Pipeline
          stages={["Live Research", "Position Analysis"]}
          stageIdx={stageIdx}
          progress={progress}
          scanning={analyzing}
          logMsg={logMsg}
        />
      )}

      <div className="content">
        {error && <div className="err-box">{error}</div>}

        {!r && !analyzing && (
          <div className="empty">
            <div className="empty-icon">\u25ce</div>
            <div className="empty-msg">Enter a ticker to analyze your position</div>
          </div>
        )}

        {r && (
          <div className="pos-mode-card">
            {/* HEADER */}
            <div className="pos-header">
              <div>
                <div style={{ fontFamily: "var(--disp)", fontSize: 20, fontWeight: 700 }}>{r.ticker}</div>
                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{r.name}</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="price">{fmtP(r.currentPrice, r.currency)}</span>
                <span className={`pct ${r.priceChangeToday >= 0 ? "up" : "dn"}`}>
                  {r.priceChangeToday >= 0 ? "\u25b2" : "\u25bc"}
                  {Math.abs(Number(r.priceChangeToday)).toFixed(2)}%
                </span>
              </div>
              <a
                href={tvUrl(r.ticker, market)}
                target="_blank"
                rel="noopener noreferrer"
                className="chart-link"
                style={{ margin: 0 }}
              >
                View Chart &rarr;
              </a>
            </div>

            {/* VERDICT BLOCK */}
            <div
              className="pos-verdict-block"
              style={{ background: vd.bg, borderBottom: `1px solid ${vd.border}` }}
            >
              <div className="verdict-icon" style={{ color: vd.color }}>{vd.icon}</div>
              <div className="verdict-info">
                <div className="verdict-label" style={{ color: vd.color }}>{r.verdict}</div>
                <div className="verdict-reason">{r.verdictReason}</div>
                {/* ACTION COMMAND */}
                <div
                  className="verdict-command"
                  style={{ color: vd.color, borderColor: vd.color, background: "rgba(0,0,0,0.2)" }}
                >
                  ACTION: {action}
                </div>
              </div>
            </div>

            <div className="pos-body">

              {/* P&L BANNER */}
              {(pnlPct !== null || r.entryPrice > 0) && (
                <div
                  className="pnl-banner"
                  style={{ background: "var(--s2)", border: "1px solid var(--border)", marginBottom: 14 }}
                >
                  {r.entryPrice > 0 && (
                    <div className="pnl-item">
                      <div className="pnl-lbl">Entry</div>
                      <div className="pnl-val">{fmtP(r.entryPrice, r.currency)}</div>
                    </div>
                  )}
                  {pnlPct !== null && (
                    <div className="pnl-item">
                      <div className="pnl-lbl">P&L %</div>
                      <div className="pnl-val" style={{ color: pnlPct >= 0 ? "var(--lime)" : "var(--red)" }}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  {pnlAbs !== null && (
                    <div className="pnl-item">
                      <div className="pnl-lbl">P&L ({r.currency})</div>
                      <div className="pnl-val" style={{ color: pnlAbs >= 0 ? "var(--lime)" : "var(--red)" }}>
                        {pnlAbs >= 0 ? "+" : ""}{fmtP(Math.abs(pnlAbs), r.currency)}
                      </div>
                    </div>
                  )}
                  {r.updatedStop > 0 && r.entryPrice > 0 && (
                    <div className="pnl-item">
                      <div className="pnl-lbl">Distance to Stop</div>
                      <div className="pnl-val" style={{ color: "var(--red)" }}>
                        {(((r.currentPrice - r.updatedStop) / r.currentPrice) * 100).toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UPDATED LEVELS */}
              <div className="tgrid" style={{ marginBottom: 14 }}>
                <div className="tbox">
                  <div className="tl">Updated Target</div>
                  <div className="tv" style={{ color: "var(--lime)" }}>{fmtP(r.updatedTarget, r.currency)}</div>
                  <div className="ts">
                    {r.updatedTarget && r.currentPrice
                      ? `+${(((r.updatedTarget - r.currentPrice) / r.currentPrice) * 100).toFixed(1)}%`
                      : ""}
                  </div>
                </div>
                <div className="tbox">
                  <div className="tl">Updated Stop</div>
                  <div className="tv" style={{ color: "var(--red)" }}>{fmtP(r.updatedStop, r.currency)}</div>
                  <div className="ts">
                    {r.updatedStop && r.currentPrice
                      ? `${(((r.updatedStop - r.currentPrice) / r.currentPrice) * 100).toFixed(1)}%`
                      : ""}
                  </div>
                </div>
                <div className="tbox">
                  <div className="tl">RSI / MACD</div>
                  <div className="tv" style={{ color: "var(--gold)" }}>
                    {r.rsi ? Number(r.rsi).toFixed(0) : "\u2014"}
                  </div>
                  <div
                    className="ts"
                    style={{
                      color: r.macd === "bullish" ? "var(--lime)"
                           : r.macd === "bearish" ? "var(--red)"
                           : "var(--gold)",
                    }}
                  >
                    {r.macd}
                  </div>
                </div>
              </div>

              {/* CHIPS */}
              <div className="chips">
                {r.trend      && <span className={`chip ${r.trend === "uptrend" ? "bull" : r.trend === "downtrend" ? "bear" : "neu"}`}>{r.trend}</span>}
                {r.momentum   && <span className="chip neu">{r.momentum}</span>}
                {r.structure  && <span className="chip">{r.structure}</span>}
                {r.support    > 0 && <span className="chip">Support {fmtP(r.support, r.currency)}</span>}
                {r.resistance > 0 && <span className="chip">Resistance {fmtP(r.resistance, r.currency)}</span>}
              </div>

              {/* DIALECTIC */}
              <div className="dialectic">
                {r.bullCase && (
                  <div className="bull-c">
                    <div className="case-lbl">\u25b2 Stay In</div>
                    <div className="case-txt">{r.bullCase}</div>
                  </div>
                )}
                {r.bearCase && (
                  <div className="bear-c">
                    <div className="case-lbl">\u25bc Get Out</div>
                    <div className="case-txt">{r.bearCase}</div>
                  </div>
                )}
              </div>

              {/* WHAT NEXT */}
              {r.whatNext && (
                <div className="what-next">
                  <b>Most likely next move</b>
                  {r.whatNext}
                </div>
              )}

              {/* INVALIDATION */}
              {(r.invalidationNote || r.invalidationLevel > 0) && (
                <div className="inval" style={{ marginTop: 10 }}>
                  <b>Exit immediately if</b>
                  {r.invalidationLevel > 0 && `${fmtP(r.invalidationLevel, r.currency)} breach. `}
                  {r.invalidationNote}
                </div>
              )}

            </div>
          </div>
        )}

        <div className="disc">
          Position analysis is AI-generated and may be inaccurate. Not financial advice. Always use your own judgment.
        </div>
      </div>
    </>
  );
}
