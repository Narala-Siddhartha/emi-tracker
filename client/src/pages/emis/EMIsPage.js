import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useEMI } from "../../context/EMIContext";
import EMICard from "../../components/emis/EMICard";
import EMIFormModal from "../../components/emis/EMIFormModal";

const CATEGORIES = ["All","Home","Car","Personal","Education","Business","Other"];
const STATUSES   = ["All","Active","Completed","Paused"];
const fmt = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

const EMIsPage = () => {
  const { emis, loading, fetchEMIs } = useEMI();
  const [showModal, setShowModal]   = useState(false);
  const [editingEMI, setEditingEMI] = useState(null);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy]                 = useState("nextDueDate");
  const [showFilters, setShowFilters]       = useState(false);

  useEffect(() => { fetchEMIs(); }, [fetchEMIs]);

  const filtered = useMemo(() => {
    let list = [...emis];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.loanName.toLowerCase().includes(q) || e.lenderName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    if (filterStatus !== "All")   list = list.filter(e => e.status === filterStatus);
    if (filterCategory !== "All") list = list.filter(e => e.category === filterCategory);
    list.sort((a,b) => {
      if (sortBy==="emiAmount")       return b.emiAmount - a.emiAmount;
      if (sortBy==="nextDueDate")     return new Date(a.nextDueDate) - new Date(b.nextDueDate);
      if (sortBy==="remainingMonths") return a.remainingMonths - b.remainingMonths;
      if (sortBy==="principalAmount") return b.principalAmount - a.principalAmount;
      return 0;
    });
    return list;
  }, [emis, search, filterStatus, filterCategory, sortBy]);

  const activeEMIs       = emis.filter(e => e.status==="Active");
  const totalMonthly     = activeEMIs.reduce((s,e) => s+e.emiAmount,0);
  const totalOutstanding = activeEMIs.reduce((s,e) => s+(e.remainingMonths||0)*e.emiAmount,0);
  const hasFilters       = search || filterStatus!=="All" || filterCategory!=="All";

  const handleEdit  = useCallback((emi) => { setEditingEMI(emi); setShowModal(true); }, []);
  const handleClose = useCallback(() => { setShowModal(false); setEditingEMI(null); }, []);
  const handleAdd   = useCallback(() => { setEditingEMI(null); setShowModal(true); }, []);
  const clearFilters= () => { setSearch(""); setFilterStatus("All"); setFilterCategory("All"); };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:700, marginBottom:"3px" }}>My EMIs</h1>
          <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>{emis.length} loan{emis.length!==1?"s":""} · {activeEMIs.length} active</p>
        </div>
        <button onClick={handleAdd} className="btn-primary" style={{ width:"auto", padding:"10px 20px", fontSize:"14px" }}>+ Add EMI</button>
      </div>

      {/* Quick stats */}
      {emis.length > 0 && (
        <div className="grid-4col" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"16px" }}>
          {[
            { label:"Monthly",   value:fmt(totalMonthly),     color:"#0ea5e9" },
            { label:"Outstanding",value:fmt(totalOutstanding), color:"#ef4444" },
            { label:"Active",    value:activeEMIs.length,      color:"#10b981" },
            { label:"Completed", value:emis.filter(e=>e.status==="Completed").length, color:"#a855f7" },
          ].map(({label,value,color}) => (
            <div key={label} className="glass-card" style={{ padding:"12px 14px", borderLeft:`3px solid ${color}` }}>
              <p style={{ fontSize:"10px", color:"var(--text-secondary)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
              <p style={{ fontSize:"16px", fontWeight:700, color, fontFamily:"'Clash Display',sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter Toggle */}
      <div className="glass-card" style={{ padding:"12px 14px", marginBottom:"16px" }}>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1 }}>
            <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", fontSize:"13px" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search loans..."
              className="input-field" style={{ paddingLeft:"32px", padding:"8px 12px 8px 32px", fontSize:"14px" }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ padding:"8px 14px", borderRadius:"10px", background:showFilters?"rgba(14,165,233,0.15)":"rgba(30,41,59,0.6)", border:`1px solid ${showFilters?"var(--accent)":"var(--border)"}`, color:showFilters?"var(--accent)":"var(--text-secondary)", cursor:"pointer", fontSize:"13px", fontWeight:500, whiteSpace:"nowrap", flexShrink:0 }}>
            🔧 {hasFilters ? "●" : "Filters"}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding:"8px 12px", borderRadius:"10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", cursor:"pointer", fontSize:"13px", flexShrink:0 }}>✕</button>
          )}
        </div>

        {showFilters && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginTop:"10px", paddingTop:"10px", borderTop:"1px solid var(--border)" }}>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="input-field" style={{ width:"auto", padding:"7px 12px", fontSize:"13px" }}>
              {STATUSES.map(s => <option key={s} value={s}>{s==="All"?"All Status":s}</option>)}
            </select>
            <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="input-field" style={{ width:"auto", padding:"7px 12px", fontSize:"13px" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c==="All"?"All Categories":c}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="input-field" style={{ width:"auto", padding:"7px 12px", fontSize:"13px" }}>
              <option value="nextDueDate">Sort: Due Date</option>
              <option value="emiAmount">Sort: EMI Amount</option>
              <option value="principalAmount">Sort: Principal</option>
              <option value="remainingMonths">Sort: Remaining</option>
            </select>
          </div>
        )}
      </div>

      {hasFilters && <p style={{ color:"var(--text-secondary)", fontSize:"12px", marginBottom:"12px" }}>Showing {filtered.length} of {emis.length} loans</p>}

      {/* Grid */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"16px" }}>
          {[1,2,3].map(i => <div key={i} className="glass-card" style={{ height:"260px", opacity:0.4 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        emis.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:"56px", marginBottom:"14px" }}>💳</div>
            <h3 style={{ fontSize:"20px", fontWeight:700, marginBottom:"8px" }}>No EMIs yet</h3>
            <p style={{ color:"var(--text-secondary)", fontSize:"14px", marginBottom:"24px" }}>Add your first loan to start tracking</p>
            <button onClick={handleAdd} className="btn-primary" style={{ width:"auto", padding:"12px 32px" }}>+ Add Your First EMI</button>
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"48px 20px" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
            <h3 style={{ fontSize:"17px", fontWeight:600, marginBottom:"6px" }}>No results found</h3>
            <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Try adjusting your search or filters</p>
          </div>
        )
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"16px" }}>
          {filtered.map(emi => <EMICard key={emi._id} emi={emi} onEdit={handleEdit} />)}
        </div>
      )}

      {showModal && <EMIFormModal emi={editingEMI} onClose={handleClose} />}
    </div>
  );
};

export default EMIsPage;
