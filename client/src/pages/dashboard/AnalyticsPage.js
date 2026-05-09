import React, { useEffect, useMemo } from "react";
import { useEMI } from "../../context/EMIContext";
import CategoryPieChart       from "../../components/charts/CategoryPieChart";
import MonthlyTrendChart      from "../../components/charts/MonthlyTrendChart";
import PayoffTimelineChart    from "../../components/charts/PayoffTimelineChart";
import PrincipalInterestChart from "../../components/charts/PrincipalInterestChart";
import EMIProgressChart       from "../../components/charts/EMIProgressChart";

const fmt = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="glass-card" style={{ padding:"20px", marginBottom:"16px" }}>
    <div style={{ marginBottom:"16px" }}>
      <h3 style={{ fontSize:"15px", fontWeight:700, color:"var(--text-primary)", marginBottom:"2px" }}>{title}</h3>
      {subtitle && <p style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const InsightCard = ({ icon, label, value, sub, color }) => (
  <div className="glass-card" style={{ padding:"16px", display:"flex", alignItems:"center", gap:"12px" }}>
    <div style={{ width:40, height:40, borderRadius:"11px", background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{icon}</div>
    <div style={{ minWidth:0 }}>
      <p style={{ fontSize:"10px", color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2px" }}>{label}</p>
      <p style={{ fontSize:"17px", fontWeight:700, color:"var(--text-primary)", fontFamily:"'Clash Display',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
      {sub && <p style={{ fontSize:"11px", color:"var(--text-secondary)", marginTop:"1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</p>}
    </div>
  </div>
);

const AnalyticsPage = () => {
  const { emis, fetchEMIs, fetchSummary } = useEMI();

  useEffect(() => { fetchEMIs(); fetchSummary(); }, [fetchEMIs, fetchSummary]);

  const insights = useMemo(() => {
    if (!emis.length) return null;
    const activeEMIs = emis.filter(e => e.status==="Active");
    const totalPrincipal  = emis.reduce((s,e)=>s+e.principalAmount,0);
    const totalPayable    = emis.reduce((s,e)=>s+e.emiAmount*e.tenureMonths,0);
    const totalInterest   = Math.max(0, totalPayable-totalPrincipal);
    const totalPaid       = emis.reduce((s,e)=>s+(e.tenureMonths-(e.remainingMonths||0))*e.emiAmount,0);
    const totalOutstanding= activeEMIs.reduce((s,e)=>s+(e.remainingMonths||0)*e.emiAmount,0);
    const avgRate         = activeEMIs.length?(activeEMIs.reduce((s,e)=>s+e.interestRate,0)/activeEMIs.length).toFixed(1):0;
    const highestEMI      = [...activeEMIs].sort((a,b)=>b.emiAmount-a.emiAmount)[0];
    const interestPct     = totalPayable?Math.round((totalInterest/totalPayable)*100):0;
    return { totalPrincipal, totalInterest, totalPaid, totalOutstanding, avgRate, highestEMI, interestPct };
  }, [emis]);

  if (!emis.length) return (
    <div style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ fontSize:"56px", marginBottom:"14px" }}>📈</div>
      <h2 style={{ fontSize:"22px", fontWeight:700, marginBottom:"8px" }}>No data yet</h2>
      <p style={{ color:"var(--text-secondary)" }}>Add some EMIs to see your analytics</p>
    </div>
  );

  return (
    <div className="animate-slide-up">
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:700, marginBottom:"4px" }}>Analytics</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Deep insights into your loan portfolio</p>
      </div>

      {/* Insight Cards */}
      {insights && (
        <div className="grid-3col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"20px" }}>
          <InsightCard icon="💰" label="Total Principal"  value={fmt(insights.totalPrincipal)}   color="#0ea5e9" />
          <InsightCard icon="📈" label="Total Interest"   value={fmt(insights.totalInterest)}    color="#f97316" sub={`${insights.interestPct}% of payable`} />
          <InsightCard icon="✅" label="Total Paid"       value={fmt(insights.totalPaid)}         color="#10b981" />
          <InsightCard icon="⏳" label="Outstanding"      value={fmt(insights.totalOutstanding)}  color="#ef4444" />
          <InsightCard icon="📊" label="Avg Interest"     value={`${insights.avgRate}%`}          color="#a855f7" sub="Active loans" />
          <InsightCard icon="🏆" label="Highest EMI"      value={insights.highestEMI?fmt(insights.highestEMI.emiAmount):"—"} color="#f59e0b" sub={insights.highestEMI?.loanName} />
        </div>
      )}

      {/* Charts — single column on mobile */}
      <ChartCard title="💳 Monthly Spend by Category" subtitle="Active EMIs breakdown">
        <CategoryPieChart emis={emis} />
      </ChartCard>

      <ChartCard title="🎯 Repayment Progress" subtitle="How far along each loan is">
        <EMIProgressChart emis={emis} />
      </ChartCard>

      <ChartCard title="📅 Monthly EMI Outflow" subtitle="Next 12 months projection">
        <MonthlyTrendChart emis={emis} />
      </ChartCard>

      <ChartCard title="📉 Outstanding Payoff Timeline" subtitle="How your debt reduces over time">
        <PayoffTimelineChart emis={emis} />
      </ChartCard>

      <ChartCard title="⚖️ Principal vs Interest" subtitle="True cost per loan">
        <PrincipalInterestChart emis={emis} />
      </ChartCard>

      {/* Summary Table */}
      <div className="glass-card" style={{ padding:"20px", overflowX:"auto" }}>
        <h3 style={{ fontSize:"15px", fontWeight:700, marginBottom:"16px" }}>📋 Loan Summary</h3>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px", minWidth:"600px" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Loan","Category","Principal","EMI/mo","Rate","Paid","Remaining","Status"].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:"var(--text-secondary)", fontWeight:600, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emis.map((emi,i) => (
              <tr key={emi._id} style={{ borderBottom:"1px solid rgba(148,163,184,0.06)", background:i%2===0?"transparent":"rgba(15,23,42,0.3)" }}>
                <td style={{ padding:"10px 12px", fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap" }}>{emi.loanName}</td>
                <td style={{ padding:"10px 12px" }}><span className={`badge cat-${emi.category}`}>{emi.category}</span></td>
                <td style={{ padding:"10px 12px", whiteSpace:"nowrap" }}>{fmt(emi.principalAmount)}</td>
                <td style={{ padding:"10px 12px", color:"var(--accent)", fontWeight:600, whiteSpace:"nowrap" }}>{fmt(emi.emiAmount)}</td>
                <td style={{ padding:"10px 12px", color:"var(--text-secondary)" }}>{emi.interestRate}%</td>
                <td style={{ padding:"10px 12px", color:"#10b981", fontWeight:600 }}>{emi.tenureMonths-(emi.remainingMonths||0)}m</td>
                <td style={{ padding:"10px 12px", color:"#ef4444", fontWeight:600 }}>{emi.remainingMonths||0}m</td>
                <td style={{ padding:"10px 12px" }}><span className={`badge badge-${emi.status}`}>{emi.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsPage;
