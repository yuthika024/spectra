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
} from "../utils/helpers.js";

export default function PortfolioMode() {
  const [positions, setPositions] = useState([
    { ticker: "", entry: "", qty: "" },
    { ticker: "", entry: "", qty: "" },
  ]);
  const [market,    setMarket]    = useState("NSE India");
  const [analyzing, setAnalyzing] = useState(false);
  const [portResult, setPortResult] = useState(null);
  const [error,     setError]     = useState("");
  const [stageIdx,  setStageIdx]  = useState(-1);
  const [progress,  setProgress]  = useState(0);
  const [logMsg,    setLogMsg]    = useState("");

  const mkt   = MARKETS[market];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const addPosition    = () => setPositions((prev) => [...prev, { ticker: "", entry: "", qty: "" }]);
  const removePosition = (i) => setPositions((prev) => prev.filter((_, idx) => idx !== i));
  const updatePosition = (i, field, val) =>
    setPositions((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

  const analyze = useCallback(async () => {
    const valid = positions.filter((p) => p.ticker.trim());
    if (valid.length < 2) { setError("Enter at least 2 positions."); return; }
    if (analyzing) return;

    setAnalyzing(true);
    setError("");
    setPortResult(null);
    setStageIdx(0);
    setProgress(10);

    const posStr = valid
      .map(
        (p) =>
          p.ticker.trim().toUpperCase() +
          (p.entry ? ` (entry: ${p.entry})` : "") +
          (p.qty ? ` qty: ${p.qty}` : "")
      )
      .join(", ");

    try {
      setLogMsg(`Researching portfolio: ${valid.map((p) => p.ticker.toUpperCase()).join(", ")}...`);

      const research = await claudeCall(
        "You are a portfolio analyst. Research all positions simultaneously. Get current prices, technical readings, sector classifications, and any news for each holding. Also assess the overall market regime.",
        `Today: ${today}. Market: ${market}. Portfolio: ${posStr}.\n\nFor each ticker: current price, today's change, RSI, trend direction, sector classification, any news. Also assess market regime and sector concentration risks.`,
        true
      );

      setStageIdx(1);
      setProgress(65);
      setLogMsg("Running portfolio-level intelligence analysis...");

      const synthResult = await claudeCall(
        "You output only a raw JSON object. No markdown. No text before { or after }.",
        `You are a portfolio risk analyst. Based on this research:\n\n${research.slice(0, 2500)}\n\n${STYLE_RULES}\n\nPortfolio: ${posStr}\n\nOutput ONLY this JSON (start with { immediately):\n{\n  "positions": [\n    {\n      "ticker": "SYMBOL",\n      "name": "Company",\n      "sector": "Banking",\n      "currentPrice": 0,\n      "currency": "${mkt.currency}",\n      "priceChangeToday": 0,\n      "trend": "uptrend",\n      "momentum": "strong",\n      "verdict": "HOLD",\n      "rsi": 0,\n      "weight": 0\n    }\n  ],\n  "sectorExposure": [\n    { "sector": "Banking", "pct": 40 }\n  ],\n  "netBias": { "bullish": 70, "bearish": 30 },\n  "correlationRisk": "Sharp 1-2 sentences on main correlation risk",\n  "weakestPosition": { "ticker": "SYMBOL", "reason": "Sharp 1 sentence" },\n  "strongestPosition": { "ticker": "SYMBOL", "reason": "Sharp 1 sentence" },\n  "portfolioVerdict": "BALANCED",\n  "verdictReason": "Sharp 1-2 sentences",\n  "hiddenRisks": [\n    "Specific hidden risk 1",\n    "Specific hidden risk 2",\n    "Specific hidden risk 3"\n  ],\n  "actions": [\n    "Specific action 1",\n    "Specific action 2"\n  ],\n  "overallRisk": "The single biggest risk in 1-2 sharp sentences"\n}\n\nportfolioVerdict must be: OVEREXPOSED, BALANCED, or DEFENSIVE.\nFor each position, verdict must be: ADD, HOLD, TRIM, or EXIT.\nSet weight as estimated equal split (100 / number of positions).\nhiddenRisks: identify non-obvious risks like correlation, macro sensitivity, sector crowding, liquidity.`,
        false
      );

      setProgress(92);

      const parsed = extractJSON(synthResult);
      if (!parsed) throw new Error("Could not parse portfolio analysis. Try again.");

      setPortResult(parsed);
      setProgress(100);
      setLogMsg("Portfolio analysis complete");

    } catch (err) {
      setError(err.message || "Analysis failed. Try again.");
      setLogMsg("Error");
    }

    setAnalyzing(false);
  }, [positions, market, analyzing]);

  const pr      = portResult;
  const pvClass = pr?.portfolioVerdict === "OVEREXPOSED" ? "v-over"
                : pr?.portfolioVerdict === "DEFENSIVE"   ? "v-def"
                : "v-bal";
  const pvColor = pr?.portfolioVerdict === "OVEREXPOSED" ? "var(--red)"
                : pr?.portfolioVerdict === "DEFENSIVE"   ? "var(--gold)"
                : "var(--lime)";

  return (
    <>
      <div className="ctrl">
        <select className="mkt-sel" value={market} onChange={(e) => setMarket(e.target.value)}>
          {Object.keys(MARKETS).map((m) => <option key={m}>{m}</option>)}
        </select>
        <button
          className={`btn-prime ml-auto ${analyzing ? "running" : ""}`}
          onClick={analyze}
          disabled={analyzing}
        >
          {analyzing ? <><div className="spin" />Analyzing&hellip;</> : "Analyze Portfolio"}
        </button>
      </div>

      <div className="content">
        <div className="sec-lbl">Portfolio Positions</div>
        <div className="pos-input-list">
          {positions.map((p, i) => (
            <div key={i} className="pos-input-row">
              <input
                className="inp inp-wide"
                placeholder={`Ticker ${i + 1}`}
                value={p.ticker}
                onChange={(e) => updatePosition(i, "ticker", e.target.value)}
              />
              <input
                className="inp inp-med"
                placeholder="Entry price"
                value={p.entry}
                onChange={(e) => updatePosition(i, "entry", e.target.value)}
              />
              <input
                className="inp inp-sm"
                placeholder="Qty"
                value={p.qty}
                onChange={(e) => updatePosition(i, "qty", e.target.value)}
              />
              {positions.length > 2 && (
                <button onClick={() => removePosition(i)}>&times;</button>
              )}
            </div>
          ))}
        </div>
        <button className="add-pos-btn" onClick={addPosition}>+ Add Position</button>

        {(analyzing || stageIdx >= 0) && (
          <Pipeline
            stages={["Research Positions", "Portfolio Analysis"]}
            stageIdx={stageIdx}
            progress={progress}
            scanning={analyzing}
            logMsg={logMsg}
          />
        )}

        {error && <div className="err-box">{error}</div>}

        {!pr && !analyzing && (
          <div className="empty" style={{ marginTop: 0 }}>
            <div className="empty-icon">\u25a6</div>
            <div className="empty-msg">Add your positions above and run portfolio analysis</div>
          </div>
        )}

        {pr && (
          <>
            {/* PORTFOLIO VERDICT */}
            <div className={`port-verdict ${pvClass}`}>
              <div className="pv-ttl" style={{ color: pvColor }}>{pr.portfolioVerdict}</div>
              <div className="pv-txt">{pr.verdictReason}</div>
              {pr.overallRisk && (
                <div style={{
                  marginTop: 8, padding: "8px 10px",
                  background: "rgba(255,45,78,0.06)",
                  border: "1px solid var(--red-d)",
                  fontSize: 9, color: "var(--text2)", lineHeight: 1.6,
                }}>
                  <b style={{ color: "var(--red)", fontSize: 7, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 3 }}>
                    Biggest Risk
                  </b>
                  {pr.overallRisk}
                </div>
              )}

              {/* HIDDEN RISK DETECTOR */}
              {pr.hiddenRisks?.length > 0 && (
                <div className="risk-box">
                  <div className="risk-title">\u26a0 Hidden Risk Detector</div>
                  {pr.hiddenRisks.map((risk, i) => (
                    <div key={i} className="risk-item">{risk}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="port-grid">
              {/* SECTOR EXPOSURE */}
              {pr.sectorExposure?.length > 0 && (
                <div className="port-panel">
                  <div className="port-panel-ttl">Sector Exposure</div>
                  {pr.sectorExposure.map((s, i) => {
                    const color = s.pct > 50 ? "var(--red)" : s.pct > 35 ? "var(--gold)" : "var(--lime)";
                    return (
                      <div key={i} className="exposure-bar">
                        <div className="exp-row">
                          <span className="exp-label">{s.sector}</span>
                          <span className="exp-pct" style={{ color }}>{Number(s.pct).toFixed(0)}%</span>
                        </div>
                        <div className="exp-track">
                          <div className="exp-fill" style={{ width: `${s.pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                  {pr.correlationRisk && (
                    <div style={{
                      marginTop: 10, fontSize: 9, color: "var(--text2)", lineHeight: 1.6,
                      borderTop: "1px solid var(--border)", paddingTop: 8,
                    }}>
                      {pr.correlationRisk}
                    </div>
                  )}
                </div>
              )}

              {/* NET BIAS */}
              <div className="port-panel">
                <div className="port-panel-ttl">Net Bias</div>
                {pr.netBias && (
                  <>
                    <div className="exposure-bar">
                      <div className="exp-row">
                        <span className="exp-label">Bullish</span>
                        <span className="exp-pct" style={{ color: "var(--lime)" }}>{pr.netBias.bullish}%</span>
                      </div>
                      <div className="exp-track">
                        <div className="exp-fill" style={{ width: `${pr.netBias.bullish}%`, background: "var(--lime)" }} />
                      </div>
                    </div>
                    <div className="exposure-bar">
                      <div className="exp-row">
                        <span className="exp-label">Bearish / Defensive</span>
                        <span className="exp-pct" style={{ color: "var(--red)" }}>{pr.netBias.bearish}%</span>
                      </div>
                      <div className="exp-track">
                        <div className="exp-fill" style={{ width: `${pr.netBias.bearish}%`, background: "var(--red)" }} />
                      </div>
                    </div>
                  </>
                )}
                {pr.strongestPosition && (
                  <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(184,255,0,0.04)", border: "1px solid var(--lime-d)" }}>
                    <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--lime)", textTransform: "uppercase", marginBottom: 4 }}>Strongest</div>
                    <div style={{ fontFamily: "var(--disp)", fontSize: 14, fontWeight: 700, color: "var(--lime)" }}>{pr.strongestPosition.ticker}</div>
                    <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 3 }}>{pr.strongestPosition.reason}</div>
                  </div>
                )}
                {pr.weakestPosition && (
                  <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(255,45,78,0.04)", border: "1px solid var(--red-d)" }}>
                    <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--red)", textTransform: "uppercase", marginBottom: 4 }}>Weakest -- Review First</div>
                    <div style={{ fontFamily: "var(--disp)", fontSize: 14, fontWeight: 700, color: "var(--red)" }}>{pr.weakestPosition.ticker}</div>
                    <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 3 }}>{pr.weakestPosition.reason}</div>
                  </div>
                )}
              </div>
            </div>

            {/* POSITION VERDICTS */}
            {pr.positions?.length > 0 && (
              <>
                <div className="sec-lbl">Individual Position Verdicts</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 20 }}>
                  {pr.positions.map((pos, i) => {
                    const vd     = getPositionVerdict(pos.verdict || "HOLD");
                    const action = verdictAction(pos.verdict || "HOLD");
                    return (
                      <div key={i} style={{ background: "var(--s1)", border: "1px solid var(--border)", padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontFamily: "var(--disp)", fontSize: 14, fontWeight: 700 }}>{pos.ticker}</div>
                            <div style={{ fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{pos.sector}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: "var(--disp)", fontSize: 12, fontWeight: 700, padding: "3px 8px", border: "1px solid", color: vd.color, borderColor: vd.color, background: vd.bg, marginBottom: 4 }}>
                              {pos.verdict}
                            </div>
                            <div style={{ fontSize: 7, letterSpacing: 1, color: vd.color, textTransform: "uppercase", textAlign: "right" }}>
                              {action}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontFamily: "var(--disp)", fontSize: 16, fontWeight: 600 }}>
                            {fmtP(pos.currentPrice, pos.currency || mkt.currency)}
                          </span>
                          <span
                            className={`pct ${pos.priceChangeToday >= 0 ? "up" : "dn"}`}
                            style={{ fontSize: 10 }}
                          >
                            {pos.priceChangeToday >= 0 ? "\u25b2" : "\u25bc"}
                            {Math.abs(Number(pos.priceChangeToday)).toFixed(2)}%
                          </span>
                        </div>
                        <div className="chips">
                          {pos.trend && (
                            <span className={`chip ${pos.trend === "uptrend" ? "bull" : pos.trend === "downtrend" ? "bear" : "neu"}`}>
                              {pos.trend}
                            </span>
                          )}
                          {pos.momentum && <span className="chip neu">{pos.momentum}</span>}
                          {pos.rsi > 0 && (
                            <span className="chip" style={{ color: pos.rsi < 35 ? "var(--lime)" : pos.rsi > 65 ? "var(--red)" : "var(--gold)" }}>
                              RSI {Number(pos.rsi).toFixed(0)}
                            </span>
                          )}
                        </div>
                        <a
                          href={tvUrl(pos.ticker, market)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 8, color: "var(--cyan)", textDecoration: "none", letterSpacing: 1 }}
                        >
                          View chart &rarr;
                        </a>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ACTIONS */}
            {pr.actions?.length > 0 && (
              <>
                <div className="sec-lbl">Recommended Actions</div>
                <div style={{ background: "var(--s1)", border: "1px solid var(--border)", padding: "14px 16px", marginBottom: 20 }}>
                  <div className="port-action-list">
                    {pr.actions.map((action, i) => (
                      <div key={i} className="port-action">
                        <b>{i + 1}.</b>{action}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="disc">
          Portfolio analysis is AI-generated. Sector exposure, correlation risk, and position verdicts
          are estimates. Not financial advice.
        </div>
      </div>
    </>
  );
}
