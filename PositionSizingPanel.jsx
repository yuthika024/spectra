import { calcPositionSize, fmtP } from "../utils/helpers.js";

export default function PositionSizingPanel({ setup, capital }) {
  const pos = calcPositionSize(capital, setup.currentPrice, setup.stopLoss);
  if (!pos || !capital) return null;

  return (
    <div className="pos-sec">
      <div className="pos-ttl">Position Sizing (1% risk rule)</div>
      <div className="pos-grid">
        <div className="pos-box">
          <div className="pos-l">Shares / Units</div>
          <div className="pos-v">{pos.shares.toLocaleString()}</div>
          <div className="pos-s">at current price</div>
        </div>
        <div className="pos-box">
          <div className="pos-l">Position Value</div>
          <div className="pos-v">{fmtP(pos.positionValue, setup.currency)}</div>
          <div className="pos-s">{pos.positionPct.toFixed(1)}% of capital</div>
        </div>
        <div className="pos-box">
          <div className="pos-l">Max Risk (1%)</div>
          <div className="pos-v" style={{ color: "var(--red)" }}>
            {fmtP(pos.riskAmount, setup.currency)}
          </div>
          <div className="pos-s">hard stop</div>
        </div>
        <div className="pos-box">
          <div className="pos-l">Potential Gain</div>
          <div className="pos-v" style={{ color: "var(--lime)" }}>
            {fmtP(pos.riskAmount * setup.riskReward, setup.currency)}
          </div>
          <div className="pos-s">{Number(setup.riskReward).toFixed(1)}:1 R:R</div>
        </div>
      </div>
    </div>
  );
}
