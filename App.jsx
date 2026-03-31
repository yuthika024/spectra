import { useState, useEffect } from "react";
import "global.css";
import LandingPage    from "./modes/LandingPage.jsx";
import ScannerMode    from "./modes/ScannerMode.jsx";
import PositionMode   from "./modes/PositionMode.jsx";
import CompareMode    from "./modes/CompareMode.jsx";
import PortfolioMode  from "./modes/PortfolioMode.jsx";

const TABS = [
  { id: "scan",      label: "Scan" },
  { id: "position",  label: "Position" },
  { id: "compare",   label: "Compare" },
  { id: "portfolio", label: "Portfolio" },
];

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [tab,         setTab]         = useState("scan");
  const [time,        setTime]        = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="hdr">
        <div style={{ cursor: "pointer" }} onClick={() => setShowLanding(true)}>
          <div className="logo">
            <span className="live-dot" />
            SPECTRA
          </div>
          <div className="hdr-sub">Systematic Market Intelligence Engine</div>
        </div>
        <div className="hdr-time">{time}</div>
      </header>

      {/* TABS */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ACTIVE MODE */}
      {tab === "scan"      && <ScannerMode />}
      {tab === "position"  && <PositionMode />}
      {tab === "compare"   && <CompareMode />}
      {tab === "portfolio" && <PortfolioMode />}
    </div>
  );
}
