import React, { createContext, useContext, useState, useCallback } from "react";
import { emiAPI } from "../services/api";
import toast from "react-hot-toast";

const EMIContext = createContext(null);

export const EMIProvider = ({ children }) => {
  const [emis, setEmis]         = useState([]);
  const [summary, setSummary]   = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading]   = useState(false);

  // ── Fetch all EMIs ─────────────────────────────────────────────────────────
  const fetchEMIs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await emiAPI.getAll(params);
      setEmis(data.data);
    } catch (err) {
      toast.error("Failed to load EMIs");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch summary ──────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await emiAPI.getSummary();
      setSummary(data.data);
    } catch (err) {
      toast.error("Failed to load summary");
    }
  }, []);

  // ── Fetch upcoming ─────────────────────────────────────────────────────────
  const fetchUpcoming = useCallback(async (days = 7) => {
    try {
      const { data } = await emiAPI.getUpcoming(days);
      setUpcoming(data.data);
    } catch (err) {
      console.error("Failed to load upcoming EMIs");
    }
  }, []);

  // ── Create EMI ─────────────────────────────────────────────────────────────
  const createEMI = useCallback(async (formData) => {
    const { data } = await emiAPI.create(formData);
    setEmis((prev) => [data.data, ...prev]);
    toast.success("EMI added successfully! 🎉");
    return data;
  }, []);

  // ── Update EMI ─────────────────────────────────────────────────────────────
  const updateEMI = useCallback(async (id, formData) => {
    const { data } = await emiAPI.update(id, formData);
    setEmis((prev) => prev.map((e) => (e._id === id ? data.data : e)));
    toast.success("EMI updated successfully.");
    return data;
  }, []);

  // ── Delete EMI ─────────────────────────────────────────────────────────────
  const deleteEMI = useCallback(async (id) => {
    await emiAPI.delete(id);
    setEmis((prev) => prev.filter((e) => e._id !== id));
    toast.success("EMI deleted.");
  }, []);

  // ── Mark payment ───────────────────────────────────────────────────────────
  const markPayment = useCallback(async (id) => {
    const { data } = await emiAPI.markPaid(id);
    setEmis((prev) => prev.map((e) => (e._id === id ? data.data : e)));
    toast.success(data.message);
    return data;
  }, []);

  return (
    <EMIContext.Provider value={{
      emis, summary, upcoming, loading,
      fetchEMIs, fetchSummary, fetchUpcoming,
      createEMI, updateEMI, deleteEMI, markPayment,
    }}>
      {children}
    </EMIContext.Provider>
  );
};

export const useEMI = () => {
  const ctx = useContext(EMIContext);
  if (!ctx) throw new Error("useEMI must be used within EMIProvider");
  return ctx;
};
