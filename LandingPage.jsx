// Landing page — shown before the user enters the app
// Designed to make them feel stupid for not using it

const DEMO_SETUP = {
  ticker: "RELIANCE",
  name: "Reliance Industries Ltd",
  direction: "LONG",
  currentPrice: 2847.50,
  currency: "INR",
  priceChangeToday: 1.84,
  targetPrice: 3120.0,
  targetPercent: 9.6,
  stopLoss: 2720.0,
  stopLossPercent: 4.5,
  riskReward: 2.8,
  totalScore: 78,
  confidence: 81,
  confluenceCount: 6,
  thesis: "Clean breakout above 2800 resistance with volume expansion. Buyers in control. Room to 3120 before next supply zone.",
  invalidationNote: "Break below 2720 -> thesis invalid. Exit immediately.",
  bullCase: "Momentum intact, institutional accumulation visible in volume profile.",
  bearCase: "Broad market weakness or oil price collapse breaks the setup.",
  indicators: { rsi: 58, macd: "bullish", volume: "above average", trend: "uptrend", pattern: "breakout" },
  catalysts: ["Q3 earnings beat", "Jio subscriber growth", "Sector rotation into energy"],
};

function DemoCard() {
  const isLong    = true;
  const scoreRatio = DEMO_SETUP.totalScore / 100;

  return (
    <div className="demo-card">
      <div className="card-stripe stripe-long" />
      <div className="ci">
        <div className="ctop">
          <div>
            <div className="ticker">{DEMO_SETUP.ticker}</div>
            <div className="coname">{DEMO_SETUP.name}</div>
          </div>
          <div className="dir-badge dir-long">\u25b2 LONG</div>
        </div>

        <div className="conviction-tag conviction-high">HIGH CONVICTION</div>

        <div className="verdict-row">
          <div className="verdict-badge" style={{ color: "var(--lime)", borderColor: "var(--lime)", background: "rgba(0,0,0,0.3)" }}>
            STRONG BUY
          </div>
          <div className="verdict-sub">
            Score 78/100 &middot; Confidence 81% &middot; 6 signals
          </div>
        </div>

        <div className="prow">
          <span className="price">\u20b92,847.50</span>
          <span className="pct up">\u25b21.84%</span>
        </div>

        <div className="tgrid">
          <div className="tbox">
            <div className="tl">Target</div>
            <div className="tv" style={{ color: "var(--lime)" }}>\u20b93,120</div>
            <div className="ts">+9.6%</div>
          </div>
          <div className="tbox">
            <div className="tl">Stop Loss</div>
            <div className="tv" style={{ color: "var(--red)" }}>\u20b92,720</div>
            <div className="ts">-4.5%</div>
          </div>
          <div className="tbox">
            <div className="tl">R:R / RSI</div>
            <div className="tv" style={{ color: "var(--cyan)" }}>2.8:1</div>
            <div className="ts" style={{ color: "var(--gold)" }}>RSI 58</div>
          </div>
        </div>

        <div className="thesis">{DEMO_SETUP.thesis}</div>

        <div className="inval">
          <b>Exit immediately if</b>
          {DEMO_SETUP.invalidationNote}
        </div>

        <div style={{ marginTop: 8, padding: "4px 8px", background: "rgba(184,255,0,0.06)", border: "1px solid var(--lime-d)", display: "inline-block", fontSize: 8, color: "var(--lime)", letterSpacing: 1.5, textTransform: "uppercase" }}>
          DEMO -- Real scan powered by live AI
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onEnter }) {
  return (
    <div className="landing">

      {/* HERO */}
      <section className="land-hero">
        <div className="land-eyebrow">
          <span className="live-dot" /> Systematic Market Intelligence
        </div>
        <h1 className="land-h1">
          Stop guessing trades.<br />
          <em>Start running a system.</em>
        </h1>
        <p className="land-sub">
          SPECTRA scans markets, scores setups against a 9-factor rubric, and forces a decision &mdash;
          with risk defined, targets calculated, and invalidation conditions explicit.
        </p>
        <div className="land-hook">
          No indicators. No noise. Just decisions.
        </div>
        <div className="land-ctas">
          <button className="cta-primary" onClick={onEnter}>
            Run Live Scan
          </button>
          <button className="cta-ghost" onClick={onEnter}>
            View Demo Below
          </button>
        </div>
      </section>

      {/* LIVE PREVIEW */}
      <section className="land-preview">
        <div className="land-preview-lbl">
          Sample output &mdash; what a scored setup looks like
        </div>
        <DemoCard />
      </section>

      {/* 3 PILLARS */}
      <section className="land-pillars">
        <div className="sec-lbl">What it does</div>
        <div className="pillar-grid">
          <div className="pillar">
            <div className="pillar-icon">\u26a1</div>
            <div className="pillar-ttl">Scan</div>
            <div className="pillar-txt">
              Sweeps markets in real time using web search. Finds high-probability setups
              and filters ruthlessly &mdash; only shows trades that pass a strict scoring
              rubric with minimum score 55/100 and R:R above 2:1.
            </div>
          </div>
          <div className="pillar">
            <div className="pillar-icon">\u25ce</div>
            <div className="pillar-ttl">Decide</div>
            <div className="pillar-txt">
              Every setup gets a verdict: STRONG BUY, BUY, WATCH, or AVOID.
              No ambiguity. No "it depends." Bull case and bear case both visible.
              Conviction tag tells you how hard to lean.
            </div>
          </div>
          <div className="pillar">
            <div className="pillar-icon">\u25a6</div>
            <div className="pillar-ttl">Manage Risk</div>
            <div className="pillar-txt">
              Position sizing calculated automatically using the 1% risk rule.
              Stop-loss, target, ATR, and exact invalidation conditions
              defined before you enter. Know your downside first.
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATOR */}
      <section className="land-diff">
        <div className="land-diff-inner">
          <h2 className="diff-h2">
            This isn&apos;t a screener.<br />It&apos;s a thinking system.
          </h2>
          <p className="diff-sub">
            Most tools give you data. SPECTRA gives you judgment.
            It weighs nine factors, forces a structured dialectic, and returns a
            decision &mdash; not a chart with colored lines.
          </p>
          <div className="diff-list">
            {[
              "RSI position relative to trend (not just absolute value)",
              "MACD crossover + histogram confirmation",
              "Volume surge 1.5x-3x+ above 20-day average",
              "News catalyst: earnings, upgrades, sector rotation",
              "Price action: breakout above resistance, breakdown below support",
              "Market regime: is the broad trend working with or against you",
              "Risk-reward ratio enforced at 2:1 minimum before inclusion",
            ].map((item, i) => (
              <div key={i} className="diff-item">{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* MODES */}
      <section className="land-modes">
        <div className="sec-lbl">Four modes</div>
        <div className="modes-grid">
          <div className="mode-card" onClick={onEnter}>
            <div className="mode-num">01</div>
            <div className="mode-name">Scanner</div>
            <div className="mode-desc">
              Sweeps intraday or swing setups across NSE, BSE, US, or Crypto.
              Ranks results by score. Shows only what passes.
            </div>
            <div className="mode-tag">Find trades &rarr;</div>
          </div>
          <div className="mode-card" onClick={onEnter}>
            <div className="mode-num">02</div>
            <div className="mode-name">Position</div>
            <div className="mode-desc">
              You&apos;re already in a trade. Should you add, hold, trim, or exit?
              Get updated targets, stop levels, and a decisive action command.
            </div>
            <div className="mode-tag">What do I do now? &rarr;</div>
          </div>
          <div className="mode-card" onClick={onEnter}>
            <div className="mode-num">03</div>
            <div className="mode-name">Compare</div>
            <div className="mode-desc">
              Two to five tickers. Scored head-to-head. Ranked by quality.
              Capital allocation verdict tells you exactly where money goes first.
            </div>
            <div className="mode-tag">Where does capital go? &rarr;</div>
          </div>
          <div className="mode-card" onClick={onEnter}>
            <div className="mode-num">04</div>
            <div className="mode-name">Portfolio</div>
            <div className="mode-desc">
              Your full book analyzed. Sector exposure, correlation risk,
              hidden risk detector, strongest and weakest positions.
            </div>
            <div className="mode-tag">What&apos;s wrong with my portfolio? &rarr;</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta-final">
        <div className="land-cta-h">Run your first scan in 10 seconds.</div>
        <p className="land-cta-s">No account. No setup. Just open and scan.</p>
        <button className="cta-primary" onClick={onEnter}>
          Open SPECTRA &rarr;
        </button>
      </section>

      <div className="disc" style={{ margin: 0, borderTop: "1px solid var(--border)", borderLeft: "none", borderRight: "none", borderBottom: "none" }}>
        SPECTRA is an AI research tool for personal use only. All outputs are AI-generated estimates.
        This is not financial or investment advice. Always verify independently.
        Never trade with capital you cannot afford to lose.
      </div>

    </div>
  );
}
