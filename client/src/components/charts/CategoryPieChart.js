import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = {
  Home:      "#0ea5e9",
  Car:       "#a855f7",
  Personal:  "#f97316",
  Education: "#10b981",
  Business:  "#f59e0b",
  Other:     "#94a3b8",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 16px" }}>
      <p style={{ fontWeight: 700, color: d.payload.fill, marginBottom: "4px" }}>{d.name}</p>
      <p style={{ color: "var(--text-primary)", fontSize: "14px" }}>{fmt(d.value)}<span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>/month</span></p>
      <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{d.payload.percent}% of total</p>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "8px" }}>
    {payload.map(({ value, color }) => (
      <div key={value} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{value}</span>
      </div>
    ))}
  </div>
);

const CategoryPieChart = ({ emis }) => {
  const activeEMIs = emis.filter(e => e.status === "Active");

  // Build data grouped by category
  const raw = activeEMIs.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.emiAmount;
    return acc;
  }, {});

  const total = Object.values(raw).reduce((s, v) => s + v, 0);

  const data = Object.entries(raw).map(([name, value]) => ({
    name,
    value,
    fill: COLORS[name] || "#94a3b8",
    percent: total ? Math.round((value / total) * 100) : 0,
  }));

  if (data.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", color: "var(--text-secondary)", fontSize: "14px" }}>
        No active EMIs to display
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Category breakdown list */}
      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.sort((a, b) => b.value - a.value).map(({ name, value, fill, percent }) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: fill, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", flex: 1 }}>{name}</span>
            <div style={{ flex: 2, height: "4px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${percent}%`, height: "100%", background: fill, borderRadius: "4px" }} />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", minWidth: "80px", textAlign: "right" }}>{fmt(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart;
