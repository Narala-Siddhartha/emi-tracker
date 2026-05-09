import React from "react";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

// Individual radial progress ring for each EMI
const RadialRing = ({ emi, size = 80, stroke = 7 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = emi.progressPercent || 0;
  const offset = circ - (progress / 100) * circ;

  const color =
    progress >= 75 ? "#10b981" :
    progress >= 40 ? "#0ea5e9" :
    "#f97316";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "rgba(15,23,42,0.5)", borderRadius: "12px" }}>
      {/* Ring */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color }}>{progress}%</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emi.loanName}</p>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>{emi.lenderName}</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{emi.tenureMonths - (emi.remainingMonths || 0)}</strong>/{emi.tenureMonths} mo
          </span>
          <span style={{ fontSize: "12px", color: color, fontWeight: 600 }}>{fmt(emi.emiAmount)}/mo</span>
        </div>
      </div>
    </div>
  );
};

const EMIProgressChart = ({ emis }) => {
  const activeEMIs = emis
    .filter(e => e.status === "Active")
    .sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0));

  if (!activeEMIs.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-secondary)", fontSize: "14px" }}>
        No active EMIs to display
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
      {activeEMIs.map(emi => <RadialRing key={emi._id} emi={emi} />)}
    </div>
  );
};

export default EMIProgressChart;
