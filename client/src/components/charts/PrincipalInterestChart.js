import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
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
  const principal = payload.find(p => p.dataKey === "Principal")?.value || 0;
  const interest  = payload.find(p => p.dataKey === "Interest")?.value || 0;
  const total = principal + interest;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 16px", minWidth: "180px" }}>
      <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px", fontSize: "13px" }}>{label}</p>
      {[
        { label: "Principal",    value: principal, color: "#0ea5e9" },
        { label: "Interest",     value: interest,  color: "#f97316" },
        { label: "Total Payable",value: total,      color: "var(--text-primary)" },
      ].map(({ label: l, value, color }) => (
        <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{l}</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color }}>{fmt(value)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "8px" }}>
    {payload.map(({ value, color }) => (
      <div key={value} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: 10, height: 10, borderRadius: "3px", background: color }} />
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{value}</span>
      </div>
    ))}
  </div>
);

const PrincipalInterestChart = ({ emis }) => {
  const data = emis.map((emi) => {
    const totalPayable = emi.emiAmount * emi.tenureMonths;
    const interest = Math.max(0, totalPayable - emi.principalAmount);
    return {
      name: emi.loanName.length > 12 ? emi.loanName.slice(0, 11) + "…" : emi.loanName,
      Principal: Math.round(emi.principalAmount),
      Interest:  Math.round(interest),
    };
  });

  if (!data.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", color: "var(--text-secondary)", fontSize: "14px" }}>
        No EMIs to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0369a1" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#c2410c" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend content={<CustomLegend />} />
        <Bar dataKey="Principal" stackId="a" fill="url(#principalGrad)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Interest"  stackId="a" fill="url(#interestGrad)"  radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PrincipalInterestChart;
