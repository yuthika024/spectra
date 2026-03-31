import { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown.jsx";
import PositionSizingPanel from "./PositionSizingPanel.jsx";
import {
  getVerdict,
  getConviction,
  scoreColor,
  fmtP,
  tvWidgetUrl,
  tvUrl,
} from "./helpers.js";
import { MAX_SCORE } from "./constants.js";

export default function StockCard({ setup, capital, market, idx }) {
  const [showChart, setShowChart] = useState(false);

  const isLong     = setup.direction === "LONG";
  const verdict    = getVerdict(setup);
  const conviction = getConviction(setup.totalScore);
  const ind        = setup.indicators || {};
  const confLen    = Math.min(8, setup.confluenceCount || 0);
  const scoreRatio = setup.totalScore / MAX_SCORE;

  const convictionClass =
    conviction === "HIGH CONVICTION" ? "conviction-high" :
    conviction === "SOLID SETUP"     ? "conviction-solid" :
                                       "conviction-weak";

  return (
    <div className="card" style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className={`card-stripe ${isLong ? "stripe-long" : "stripe-short"}`} />
      <div className="ci">

        {/* TOP */}
        <div className="ctop">
          <div>
            <div className="ticker">{setup.ticker}</div>
            <div className="coname">{setup.name}</div>
          </div>
          <div className={`dir-badge ${isLong ? "dir-long" : "dir-short"}`}>
            {isLong ? "\u25b2 LONG" : "\u25bc SHORT"}
          </div>
        </div>

        {/* CONVICTION */}
        <div className={`conviction-tag ${convictionClass}`}>{conviction}</div>

        {/* VERDICT */}
        <div className="verdict-row">
          <div
            className="verdict-badge"
            style={{ color: verdict.color, borderColor: verdict.color, background: "rgba(0,0,0,0.3)" }}
          >
            {verdict.label}
          </div>
          <div className="verdict-sub">
            Score {setup.totalScore}/{MAX_SCORE} &middot; Confidence {setup.confidence}%
            {setup.confluenceCount > 0 && ` \u00b7 ${setup.confluenceCount} signals`}
          </div>
        </div>

        {/* PRICE */}
        <div className="prow">
          <span className="price">{fmtP(setup.currentPrice, setup.currency)}</span>
          {setup.priceChangeToday != null && (
            <span className={`pct ${setup.priceChangeToday >= 0 ? "up" : "dn"}`}>
              {setup.priceChangeToday >= 0 ? "\u25b2" : "\u25bc"}
              {Math.abs(Number(setup.priceChangeToday)).toFixed(2)}%
            </span>
          )}
        </div>

        {setup.timeframe && <div className="ttag">{setup.timeframe}</div>}

        {/* CHART — toggle embed or link */}
        <button className="chart-toggle" onClick={() => setShowChart((v) => !v)}>
          {showChart ? "Hide chart" : `View ${setup.ticker} chart (TradingView)`}
        </button>
        {showChart && (
          <iframe
            src={tvWidgetUrl(setup.ticker, market)}
            className="tv-embed"
            allowtransparency="true"
            scrolling="no"
            title={`${setup.ticker} chart`}
          />
        )}
        {!showChart && (
          <a
            href={tvUrl(setup.ticker, market)}
            target="_blank"
            rel="noopener noreferrer"
            className="chart-link"
          >
            <span>Open full chart on TradingView</span>
            <span>&rarr;</span>
          </a>
        )}

        {/* SCORE */}
        <div className="score-sec">
          <div className="score-hdr">
            <span className="score-ttl">Analytical Score</span>
            <span className="score-tot" style={{ color: scoreColor(scoreRatio) }}>
              {setup.totalScore}<span>/{MAX_SCORE}</span>
            </span>
          </div>
          <ScoreBreakdown scores={setup.scores} />
        </div>

        {/* CONFLUENCE DOTS */}
        {setup.confluenceCount > 0 && (
          <div className="conf-row">
            <span style={{ fontSize: 8, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", width: 68, flexShrink: 0 }}>
              Confluence
            </span>
            <div className="cdots">
              {Array.from({ length: 8 }).map((_, di) => (
                <div
                  key={di}
                  className={`cdot ${di < confLen ? (confLen >= 5 ? "on" : "warn") : ""}`}
                />
              ))}
            </div>
            <span className="cdot-count">{setup.confluenceCount} signals</span>
          </div>
        )}

        {/* CONFIDENCE BAR */}
        <div className="conf-row">
          <span className="conf-lbl">Confidence</span>
          <div className="conf-track">
            <div
              className="conf-fill"
              style={{ width: `${setup.confidence}%`, background: scoreColor(setup.confidence / 100) }}
            />
          </div>
          <span className="conf-num" style={{ color: scoreColor(setup.confidence / 100) }}>
            {setup.confidence}%
          </span>
        </div>

        {/* TARGETS */}
        <div className="tgrid">
          <div className="tbox">
            <div className="tl">Target</div>
            <div className="tv" style={{ color: isLong ? "var(--lime)" : "var(--red)" }}>
              {fmtP(setup.targetPrice, setup.currency)}
            </div>
            <div className="ts">{setup.targetPercent > 0 ? "+" : ""}{Number(setup.targetPercent).toFixed(1)}%</div>
          </div>
          <div className="tbox">
            <div className="tl">Stop Loss</div>
            <div className="tv" style={{ color: "var(--red)" }}>{fmtP(setup.stopLoss, setup.currency)}</div>
            <div className="ts">
              {Number(setup.stopLossPercent).toFixed(1)}%
              {setup.atr > 0 && ` \u00b7 ATR ${fmtP(setup.atr, setup.currency)}`}
            </div>
          </div>
          <div className="tbox">
            <div className="tl">R:R / RSI</div>
            <div className="tv" style={{ color: "var(--cyan)" }}>
              {setup.riskReward ? `${Number(setup.riskReward).toFixed(1)}:1` : "\u2014"}
            </div>
            <div className="ts" style={{ color: "var(--gold)" }}>
              RSI {ind.rsi != null ? Number(ind.rsi).toFixed(0) : "\u2014"}
            </div>
          </div>
        </div>

        {/* POSITION SIZING */}
        <PositionSizingPanel setup={setup} capital={capital} />

        {/* DIALECTIC */}
        {(setup.bullCase || setup.bearCase) && (
          <div className="dialectic">
            {setup.bullCase && (
              <div className="bull-c">
                <div className="case-lbl">\u25b2 Bull Case</div>
                <div className="case-txt">{setup.bullCase}</div>
              </div>
            )}
            {setup.bearCase && (
              <div className="bear-c">
                <div className="case-lbl">\u25bc Bear Case</div>
                <div className="case-txt">{setup.bearCase}</div>
              </div>
            )}
          </div>
        )}

        {/* INDICATOR CHIPS */}
        <div className="chips">
          {ind.macd   && <span className={`chip ${ind.macd === "bullish" ? "bull" : ind.macd === "bearish" ? "bear" : "neu"}`}>MACD {ind.macd}</span>}
          {ind.volume && <span className={`chip ${["above average","high","above normal"].includes(ind.volume) ? "bull" : ""}`}>Vol: {ind.volume}</span>}
          {ind.trend  && <span className={`chip ${ind.trend === "uptrend" ? "bull" : ind.trend === "downtrend" ? "bear" : "neu"}`}>{ind.trend}</span>}
          {ind.pattern && <span className="chip">{ind.pattern}</span>}
        </div>

        {/* CATALYSTS */}
        {setup.catalysts?.length > 0 && (
          <div className="cats">
            {setup.catalysts.map((cat, ci) => <span key={ci} className="cat">{cat}</span>)}
          </div>
        )}

        {/* THESIS */}
        {setup.thesis && <div className="thesis">{setup.thesis}</div>}

        {/* INVALIDATION */}
        {(setup.invalidationNote || setup.invalidationLevel > 0) && (
          <div className="inval">
            <b>Exit immediately if</b>
            {setup.invalidationLevel > 0 && `${fmtP(setup.invalidationLevel, setup.currency)} breach \u00b7 `}
            {setup.invalidationNote}
          </div>
        )}

      </div>
    </div>
  );
}
