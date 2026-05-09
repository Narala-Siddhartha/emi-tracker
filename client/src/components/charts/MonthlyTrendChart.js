import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 16px", minWidth: "160px" }}>
      <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", fontSize: "13px" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{p.name}</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Build next 12 months of EMI schedule from active EMIs
const buildMonthlyData = (emis) => {
  const activeEMIs = emis.filter(e => e.status === "Active");
  const months = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

    let total = 0;
    activeEMIs.forEach((emi) => {
      const monthsFromNow = i;
      const remaining = (emi.remainingMonths || 0) - monthsFromNow;
      if (remaining > 0) total += emi.emiAmount;
    });

    months.push({ month: label, "Monthly EMI": Math.round(total) });
  }
  return months;
};

const MonthlyTrendChart = ({ emis }) => {
  const data = buildMonthlyData(emis);
  const maxVal = Math.max(...data.map(d => d["Monthly EMI"]));

  if (emis.filter(e => e.status === "Active").length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", color: "var(--text-secondary)", fontSize: "14px" }}>
        No active EMIs to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(14,165,233,0.05)" }} />
        <Bar dataKey="Monthly EMI" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry["Monthly EMI"] === maxVal
                ? "url(#barGradientHigh)"
                : entry["Monthly EMI"] < maxVal * 0.5
                ? "url(#barGradientLow)"
                : "url(#barGradient)"}
            />
          ))}
        </Bar>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0369a1" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="barGradientHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="barGradientLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyTrendChart;
