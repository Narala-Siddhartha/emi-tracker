import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 16px" }}>
      <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", fontSize: "13px" }}>{label}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Outstanding</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444" }}>{fmt(payload[0]?.value)}</span>
      </div>
    </div>
  );
};

// Build payoff curve: outstanding amount over the next N months
const buildPayoffData = (emis) => {
  const activeEMIs = emis.filter(e => e.status === "Active");
  if (!activeEMIs.length) return [];

  // Find max remaining months
  const maxMonths = Math.max(...activeEMIs.map(e => e.remainingMonths || 0));
  const points = [];
  const now = new Date();

  // Sample every 3 months for readability
  const step = maxMonths > 60 ? 6 : maxMonths > 24 ? 3 : 1;

  for (let i = 0; i <= maxMonths; i += step) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

    const outstanding = activeEMIs.reduce((sum, emi) => {
      const rem = Math.max(0, (emi.remainingMonths || 0) - i);
      return sum + rem * emi.emiAmount;
    }, 0);

    points.push({ month: label, Outstanding: Math.round(outstanding) });
    if (outstanding === 0) break;
  }

  // Always include final 0 point
  if (points[points.length - 1]?.Outstanding > 0) {
    points.push({ month: "Paid Off", Outstanding: 0 });
  }

  return points;
};

const PayoffTimelineChart = ({ emis }) => {
  const data = buildPayoffData(emis);

  if (!data.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", color: "var(--text-secondary)", fontSize: "14px" }}>
        No active EMIs to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
          interval={Math.floor(data.length / 6)} />
        <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="Outstanding"
          stroke="#ef4444"
          strokeWidth={2.5}
          fill="url(#outstandingGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "#ef4444", stroke: "var(--bg-card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PayoffTimelineChart;
