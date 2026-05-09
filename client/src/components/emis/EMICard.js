import React, { useState } from "react";
import { useEMI } from "../../context/EMIContext";
import toast from "react-hot-toast";

const fmt = (n) => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(n||0);

const catIcon = (cat) => ({ Home:"🏠", Car:"🚗", Education:"🎓", Business:"💼", Personal:"👤" }[cat] || "📋");

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
    <div className="glass-card animate-slide-up" style={{ padding:"24px", maxWidth:"320px", width:"100%", textAlign:"center" }}>
      <div style={{ fontSize:"36px", marginBottom:"10px" }}>⚠️</div>
      <h3 style={{ fontSize:"16px", fontWeight:600, marginBottom:"6px" }}>Are you sure?</h3>
      <p style={{ color:"var(--text-secondary)", fontSize:"13px", marginBottom:"20px" }}>{message}</p>
      <div style={{ display:"flex", gap:"10px" }}>
        <button onClick={onCancel} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex:1, background:"linear-gradient(135deg,#ef4444,#b91c1c)", color:"white", padding:"10px", borderRadius:"10px", fontWeight:600, fontSize:"14px", border:"none", cursor:"pointer" }}>Delete</button>
      </div>
    </div>
  </div>
);

const EMICard = ({ emi, onEdit }) => {
  const { deleteEMI, markPayment } = useEMI();
  const [showConfirm, setShowConfirm] = useState(false);
  const [paying, setPaying] = useState(false);

  const progress   = emi.progressPercent || 0;
  const monthsPaid = emi.tenureMonths - (emi.remainingMonths || 0);

  const handleDelete = async () => {
    try { await deleteEMI(emi._id); } catch { toast.error("Failed to delete."); }
    setShowConfirm(false);
  };

  const handlePay = async () => {
    setPaying(true);
    try { await markPayment(emi._id); }
    catch (err) { toast.error(err.response?.data?.message || "Payment failed."); }
    finally { setPaying(false); }
  };

  return (
    <>
      {showConfirm && <ConfirmDialog message={`Delete "${emi.loanName}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} />}

      <div className="glass-card" style={{ padding:"18px", transition:"transform 0.2s, box-shadow 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>

        {/* Top row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", minWidth:0 }}>
            <div style={{ width:40, height:40, borderRadius:"10px", background:"rgba(14,165,233,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
              {catIcon(emi.category)}
            </div>
            <div style={{ minWidth:0 }}>
              <h3 style={{ fontSize:"14px", fontWeight:700, color:"var(--text-primary)", marginBottom:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{emi.loanName}</h3>
              <p style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{emi.lenderName}</p>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px", flexShrink:0, marginLeft:"8px" }}>
            <span className={`badge badge-${emi.status}`}>{emi.status}</span>
            <span className={`badge cat-${emi.category}`}>{emi.category}</span>
          </div>
        </div>

        {/* EMI Amount */}
        <p style={{ fontSize:"24px", fontWeight:700, color:"var(--text-primary)", fontFamily:"'Clash Display',sans-serif", marginBottom:"12px" }}>
          {fmt(emi.emiAmount)}<span style={{ fontSize:"12px", color:"var(--text-secondary)", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:400 }}>/month</span>
        </p>

        {/* Details Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
          {[
            { label:"Principal",   value:fmt(emi.principalAmount) },
            { label:"Outstanding", value:fmt((emi.remainingMonths||0)*emi.emiAmount) },
            { label:"Rate",        value:`${emi.interestRate}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background:"rgba(15,23,42,0.5)", borderRadius:"8px", padding:"8px 10px" }}>
              <p style={{ fontSize:"10px", color:"var(--text-secondary)", marginBottom:"2px" }}>{label}</p>
              <p style={{ fontSize:"12px", fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:"12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
            <span style={{ fontSize:"11px", color:"var(--text-secondary)" }}>{monthsPaid}/{emi.tenureMonths} months paid</span>
            <span style={{ fontSize:"11px", fontWeight:600, color:emi.status==="Completed"?"var(--success)":"var(--accent)" }}>{progress}%</span>
          </div>
          <div style={{ height:"5px", background:"var(--border)", borderRadius:"10px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, borderRadius:"10px", background:emi.status==="Completed"?"var(--success)":"linear-gradient(90deg,#0ea5e9,#6366f1)", transition:"width 0.5s ease" }} />
          </div>
        </div>

        {/* Due date */}
        {emi.status==="Active" && emi.nextDueDate && (
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"12px", padding:"7px 10px", background:"rgba(245,158,11,0.08)", borderRadius:"8px", border:"1px solid rgba(245,158,11,0.12)" }}>
            <span style={{ fontSize:"13px" }}>📅</span>
            <span style={{ fontSize:"12px", color:"#f59e0b" }}>Due: <strong>{new Date(emi.nextDueDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</strong></span>
            <span style={{ fontSize:"11px", color:"var(--text-secondary)", marginLeft:"auto" }}>{emi.remainingMonths}m left</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:"6px" }}>
          {emi.status==="Active" && (
            <button onClick={handlePay} disabled={paying}
              style={{ flex:2, padding:"8px", borderRadius:"8px", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", color:"#10b981", fontSize:"12px", fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
              {paying?"...":"✅ Mark Paid"}
            </button>
          )}
          <button onClick={() => onEdit(emi)}
            style={{ flex:1, padding:"8px", borderRadius:"8px", background:"rgba(14,165,233,0.1)", border:"1px solid rgba(14,165,233,0.2)", color:"var(--accent)", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            ✏️
          </button>
          <button onClick={() => setShowConfirm(true)}
            style={{ flex:1, padding:"8px", borderRadius:"8px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", color:"#ef4444", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            🗑️
          </button>
        </div>
      </div>
    </>
  );
};

export default EMICard;
