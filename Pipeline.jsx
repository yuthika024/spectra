export default function Pipeline({ stages, stageIdx, progress, scanning, logMsg }) {
  return (
    <div className="pipe">
      <div className="pipe-stages">
        {stages.map((label, i) => (
          <div
            key={i}
            className={`pstage ${stageIdx === i ? "active" : stageIdx > i ? "done" : ""}`}
          >
            {stageIdx > i ? "\u2713 " : ""}
            {label}
          </div>
        ))}
      </div>
      <div className="pbar-t">
        <div className="pbar-f" style={{ width: `${progress}%` }} />
        {scanning && <div className="pbar-g" />}
      </div>
      <div className="log-ln">
        {logMsg && (
          <>
            <span>&rsaquo;</span>
            {logMsg}
          </>
        )}
      </div>
    </div>
  );
}
