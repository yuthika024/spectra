import { RUBRIC } from "../utils/constants.js";
import { scoreColor } from "../utils/helpers.js";

export default function ScoreBreakdown({ scores }) {
  return (
    <div className="sf-grid">
      {RUBRIC.map((r) => {
        const val   = Number(scores?.[r.key] || 0);
        const ratio = r.max > 0 ? val / r.max : 0;
        return (
          <div key={r.key} className="sf">
            <div className="sf-name">{r.label}</div>
            <div className="sf-track">
              <div
                className="sf-fill"
                style={{ width: `${ratio * 100}%`, background: scoreColor(ratio) }}
              />
            </div>
            <div className="sf-val" style={{ color: scoreColor(ratio) }}>
              {val}/{r.max}
            </div>
          </div>
        );
      })}
    </div>
  );
}
