import React, { useEffect } from "react";
import { useEMI } from "../../context/EMIContext";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", transition: "transform 0.2s" }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
    <div style={{ width: 44, height: 44, borderRadius: "12px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p className="stat-value" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Clash Display',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "1px" }}>{sub}</p>}
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { summary, upcoming, fetchSummary, fetchUpcoming } = useEMI();

  useEffect(() => { fetchSummary(); fetchUpcoming(7); }, [fetchSummary, fetchUpcoming]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Your loan overview at a glance</p>
      </div>

      {/* Stat Cards */}
      {summary ? (
        <div className="grid-4col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
          <StatCard icon="💸" label="Monthly EMI"      value={fmt(summary.financials.totalMonthlyEMI)} color="#0ea5e9" sub={`${summary.counts.active} active loans`} />
          <StatCard icon="📉" label="Outstanding"       value={fmt(summary.financials.totalOutstanding)} color="#ef4444" sub="Remaining balance" />
          <StatCard icon="✅" label="Total Paid"        value={fmt(summary.financials.totalPaid)}        color="#10b981" sub="All time" />
          <StatCard icon="🏦" label="Total Principal"   value={fmt(summary.financials.totalPrincipal)}   color="#a855f7" sub="Loan amount" />
        </div>
      ) : (
        <div className="grid-4col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
          {[1,2,3,4].map(i => <div key={i} className="glass-card" style={{ height: "86px", opacity: 0.4 }} />)}
        </div>
      )}

      {/* Two column layout */}
      <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Upcoming Dues */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              🔔 Upcoming Dues
              {upcoming.length > 0 && <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>{upcoming.length}</span>}
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Next 7 days</span>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎉</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No dues in next 7 days!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {upcoming.map(emi => (
                <div key={emi._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(239,68,68,0.05)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "13px" }}>{emi.loanName}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{new Date(emi.nextDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <p style={{ fontWeight: 700, color: "#ef4444", fontSize: "15px" }}>{fmt(emi.emiAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Status counts */}
          {summary && (
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>📋 Loan Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Active",    count: summary.counts.active,    color: "#10b981", icon: "🟢" },
                  { label: "Completed", count: summary.counts.completed, color: "#0ea5e9", icon: "✅" },
                  { label: "Paused",    count: summary.counts.paused,    color: "#f59e0b", icon: "⏸️" },
                ].map(({ label, count, color, icon }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(15,23,42,0.4)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{icon}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 700, color, fontFamily: "'Clash Display',sans-serif" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category breakdown */}
          {summary && Object.keys(summary.categoryBreakdown).length > 0 && (
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>💳 By Category</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(summary.categoryBreakdown).map(([cat, amount]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className={`badge cat-${cat}`}>{cat}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{fmt(amount)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick action */}
          <Link to="/emis" style={{ textDecoration: "none" }}>
            <div className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s", border: "1px solid rgba(14,165,233,0.2)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>➕</span>
                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--accent)" }}>Add New EMI</span>
              </div>
              <span style={{ color: "var(--accent)", fontSize: "18px" }}>→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
