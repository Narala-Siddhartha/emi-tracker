import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.email) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    if (form.phone && !/^\+?[0-9]{10,14}$/.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid phone number (e.g. +919876543210)";
    if (!form.password || form.password.length < 6) errs.password = "Min 6 characters required";
    else if (!/\d/.test(form.password)) errs.password = "Must contain at least one number";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone || null, password: form.password });
      toast.success("Account created! Welcome 🎉");
      navigate("/dashboard");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || "Registration failed.");
      }
    } finally { setLoading(false); }
  };

  const getStrength = () => {
    const p = form.password; if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++; if (p.length >= 10) s++;
    if (/\d/.test(p)) s++; if (/[A-Z]/.test(p)) s++; if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  };
  const sColors = ["", "#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"];
  const sLabels = ["", "Weak", "Fair", "Fair", "Strong", "Very Strong"];
  const strength = getStrength();

  const L = ({ children }) => (
    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>
  );
  const Err = ({ msg }) => msg ? <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>{msg}</p> : null;

  return (
    <div className="mesh-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="animate-slide-up" style={{ width: "100%", maxWidth: "460px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "10px", background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px" }}>💳</div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>EMI Tracker</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Start tracking your loans today</p>
        </div>

        <div className="glass-card glow" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Create account</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "24px" }}>Manage all your EMIs in one place</p>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: "14px" }}>
              <L>Full Name</L>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Siddharth" className="input-field" style={errors.name ? { borderColor: "var(--danger)" } : {}} />
              <Err msg={errors.name} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: "14px" }}>
              <L>Email</L>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field" style={errors.email ? { borderColor: "var(--danger)" } : {}} />
              <Err msg={errors.email} />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: "14px" }}>
              <L>Phone Number <span style={{ color: "var(--text-secondary)", fontWeight: 400, textTransform: "none", fontSize: "11px" }}>(Optional — for future WhatsApp reminders)</span></L>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+919876543210" className="input-field" style={errors.phone ? { borderColor: "var(--danger)" } : {}} />
              <Err msg={errors.phone} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "14px" }}>
              <L>Password</L>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 chars with a number" className="input-field"
                  style={{ ...(errors.password ? { borderColor: "var(--danger)" } : {}), paddingRight: "44px" }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "16px" }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              <Err msg={errors.password} />
              {form.password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "3px" }}>
                    {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength ? sColors[strength] : "var(--border)", transition: "all 0.2s" }} />)}
                  </div>
                  <p style={{ fontSize: "11px", marginTop: "3px", color: sColors[strength] }}>{sLabels[strength]}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: "22px" }}>
              <L>Confirm Password</L>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className="input-field" style={errors.confirmPassword ? { borderColor: "var(--danger)" } : {}} />
              <Err msg={errors.confirmPassword} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
