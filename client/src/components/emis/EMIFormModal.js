import React, { useState, useEffect, useCallback, memo } from "react";
import { useEMI } from "../../context/EMIContext";
import toast from "react-hot-toast";

const CATEGORIES = ["Home","Car","Personal","Education","Business","Other"];

const calcEMI = (p, r, t) => {
  const principal = parseFloat(p);
  const rate      = parseFloat(r) / 100 / 12;
  const tenure    = parseInt(t);
  if (!principal || !rate || !tenure || principal <= 0 || tenure <= 0) return null;
  const emi = (principal * rate * Math.pow(1+rate, tenure)) / (Math.pow(1+rate, tenure) - 1);
  return isFinite(emi) && emi > 0 ? Math.round(emi) : null;
};

const F = memo(({ label, error, children, optional }) => (
  <div style={{ marginBottom:"14px" }}>
    <label style={{ display:"block", fontSize:"12px", fontWeight:600, color:"var(--text-secondary)", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.05em" }}>
      {label}{optional && <span style={{ fontWeight:400, textTransform:"none", fontSize:"11px" }}> (optional)</span>}
    </label>
    {children}
    {error && <p style={{ color:"var(--danger)", fontSize:"11px", marginTop:"3px" }}>{error}</p>}
  </div>
));

const EMIFormModal = memo(({ emi, onClose }) => {
  const { createEMI, updateEMI } = useEMI();
  const isEdit = !!emi;

  const [loanName,        setLoanName]        = useState(emi?.loanName        || "");
  const [lenderName,      setLenderName]      = useState(emi?.lenderName      || "");
  const [category,        setCategory]        = useState(emi?.category        || "Personal");
  const [status,          setStatus]          = useState(emi?.status          || "Active");
  const [principalAmount, setPrincipalAmount] = useState(emi?.principalAmount?.toString() || "");
  const [interestRate,    setInterestRate]    = useState(emi?.interestRate?.toString()    || "");
  const [tenureMonths,    setTenureMonths]    = useState(emi?.tenureMonths?.toString()    || "");
  const [startDate,       setStartDate]       = useState(emi?.startDate ? emi.startDate.split("T")[0] : "");
  const [notes,           setNotes]           = useState(emi?.notes           || "");
  const [manualEMI,       setManualEMI]       = useState(emi?.emiAmount?.toString()       || "");
  const [userEditedEMI,   setUserEditedEMI]   = useState(!!emi);
  const [errors,          setErrors]          = useState({});
  const [loading,         setLoading]         = useState(false);

  // Derived — never stored in state, recalculated every render instantly
  const autoEMI      = calcEMI(principalAmount, interestRate, tenureMonths);
  const displayedEMI = userEditedEMI ? manualEMI : (autoEMI?.toString() || "");
  const effectiveEMI = parseFloat(displayedEMI) || 0;
  const totalPayable  = effectiveEMI * parseInt(tenureMonths || 0);
  const totalInterest = Math.max(0, totalPayable - parseFloat(principalAmount || 0));

  const clearErr = useCallback((field) => {
    setErrors(e => ({ ...e, [field]: "" }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!loanName.trim())                               errs.loanName        = "Required";
    if (!lenderName.trim())                             errs.lenderName      = "Required";
    if (!principalAmount || parseFloat(principalAmount) <= 0) errs.principalAmount = "Enter valid amount";
    if (!effectiveEMI || effectiveEMI <= 0)             errs.emiAmount       = "Enter valid EMI";
    if (interestRate === "" || parseFloat(interestRate) < 0)  errs.interestRate    = "Enter valid rate";
    if (!tenureMonths || parseInt(tenureMonths) < 1)    errs.tenureMonths    = "Enter valid tenure";
    if (!startDate)                                     errs.startDate       = "Required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        loanName, lenderName, category, status, notes, startDate,
        principalAmount: parseFloat(principalAmount),
        emiAmount:       effectiveEMI,
        interestRate:    parseFloat(interestRate),
        tenureMonths:    parseInt(tenureMonths),
      };
      if (isEdit) await updateEMI(emi._id, payload);
      else        await createEMI(payload);
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const m = {};
        apiErrors.forEach(({ field, message }) => { m[field] = message; });
        setErrors(m);
      } else {
        toast.error(err.response?.data?.message || "Something went wrong.");
      }
    } finally { setLoading(false); }
  };

  const inp = (hasErr) => ({ className:"input-field", style: hasErr ? { borderColor:"var(--danger)" } : {} });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="glass-card animate-slide-up" style={{ width:"100%", maxWidth:"560px", maxHeight:"92vh", overflowY:"auto", padding:"24px", borderRadius:"20px 20px 0 0" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <div>
            <h2 style={{ fontSize:"18px", fontWeight:700 }}>{isEdit ? "Edit EMI" : "Add New EMI"}</h2>
            <p style={{ color:"var(--text-secondary)", fontSize:"12px", marginTop:"2px" }}>{isEdit ? "Update loan details" : "Track a new loan"}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-secondary)", cursor:"pointer", fontSize:"22px" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <F label="Loan Name *" error={errors.loanName}>
              <input value={loanName} onChange={e => { setLoanName(e.target.value); clearErr("loanName"); }}
                placeholder="e.g. Home Loan" {...inp(errors.loanName)} />
            </F>
            <F label="Lender / Bank *" error={errors.lenderName}>
              <input value={lenderName} onChange={e => { setLenderName(e.target.value); clearErr("lenderName"); }}
                placeholder="e.g. SBI Bank" {...inp(errors.lenderName)} />
            </F>
          </div>

          <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <F label="Category *">
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
                {["Active","Paused","Completed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
          </div>

          <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <F label="Principal (₹) *" error={errors.principalAmount}>
              <input type="number" value={principalAmount}
                onChange={e => { setPrincipalAmount(e.target.value); clearErr("principalAmount"); }}
                placeholder="e.g. 2000000" {...inp(errors.principalAmount)} />
            </F>
            <F label="Interest Rate (%) *" error={errors.interestRate}>
              <input type="number" step="0.1" value={interestRate}
                onChange={e => { setInterestRate(e.target.value); clearErr("interestRate"); }}
                placeholder="e.g. 8.5" {...inp(errors.interestRate)} />
            </F>
          </div>

          <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <F label="Tenure (Months) *" error={errors.tenureMonths}>
              <input type="number" value={tenureMonths}
                onChange={e => { setTenureMonths(e.target.value); clearErr("tenureMonths"); }}
                placeholder="e.g. 240" {...inp(errors.tenureMonths)} />
            </F>
            <F label={`EMI/month (₹) *${!userEditedEMI && !isEdit ? " — Auto" : ""}`} error={errors.emiAmount}>
              <input type="number" value={displayedEMI}
                onChange={e => { setManualEMI(e.target.value); setUserEditedEMI(true); clearErr("emiAmount"); }}
                placeholder={!userEditedEMI ? "Auto-calculated" : "Enter EMI"}
                className="input-field"
                style={{
                  ...(!userEditedEMI && autoEMI ? { borderColor:"var(--accent)" } : {}),
                  ...(errors.emiAmount ? { borderColor:"var(--danger)" } : {}),
                }}
              />
              {userEditedEMI && !isEdit && (
                <button type="button" onClick={() => { setUserEditedEMI(false); setManualEMI(""); }}
                  style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:"11px", marginTop:"3px", textDecoration:"underline", padding:0 }}>
                  ↩ Reset to auto-calculate
                </button>
              )}
            </F>
          </div>

          {!isEdit && !userEditedEMI && (
            <p style={{ fontSize:"12px", color:"var(--accent)", marginTop:"-8px", marginBottom:"14px" }}>
              ✨ Fill Principal, Rate & Tenure — EMI calculates automatically
            </p>
          )}

          <F label="Start Date *" error={errors.startDate}>
            <input type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); clearErr("startDate"); }}
              className="input-field" style={errors.startDate ? { borderColor:"var(--danger)" } : {}} />
          </F>

          <F label="Notes" optional>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any notes..." className="input-field"
              style={{ resize:"vertical", minHeight:"64px" }} />
          </F>

          {totalPayable > 0 && (
            <div style={{ background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.15)", borderRadius:"10px", padding:"12px 16px", marginBottom:"18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
              {[
                { label:"Total Payable",  value:`₹${Math.round(totalPayable).toLocaleString("en-IN")}` },
                { label:"Total Interest", value:`₹${Math.round(totalInterest).toLocaleString("en-IN")}` },
                { label:"Tenure",         value:`${tenureMonths || 0} months` },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign:"center" }}>
                  <p style={{ fontSize:"10px", color:"var(--text-secondary)", marginBottom:"2px" }}>{label}</p>
                  <p style={{ fontSize:"13px", fontWeight:700, color:"var(--accent)" }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:"10px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex:2 }}>
              {loading ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update EMI" : "Add EMI →")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EMIFormModal;
