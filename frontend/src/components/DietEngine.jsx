// ==============================================================================
// DietEngine.jsx — Weight Tracking & Vet Escalation Safety Engine
// Monitions clinical signs to trigger mandatory veterinary emergency alerts.
// ==============================================================================

import React, { useState } from "react";

const SYMPTOMS_LIST = [
  { id: "lethargy", label: "Severe Lethargy / Unresponsiveness" },
  { id: "vomiting", label: "Vomiting or diarrhea > 24 hours" },
  { id: "blood", label: "Blood in stool or vomit" },
  { id: "breathing", label: "Difficulty breathing / Heavy panting while resting" },
];

export default function DietEngine() {
  const [weightLogs, setWeightLogs] = useState([
    { date: "2026-07-01", weight: 32.5 },
    { date: "2026-07-08", weight: 31.8 }
  ]);
  const [newWeight, setNewWeight] = useState("");
  const [bcs, setBcs] = useState(5); // WSAVA scale 1-9 (5 is ideal)
  const [selectedSymptoms, setSelectedSymptoms] = useState({});

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newWeight) return;
    const log = {
      date: new Date().toISOString().split("T")[0],
      weight: parseFloat(newWeight)
    };
    setWeightLogs([log, ...weightLogs]);
    setNewWeight("");
  };

  const handleSymptomToggle = (id) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [id]: !selectedSymptoms[id]
    });
  };

  // Determine if weight loss > 10% occurred over last 2 logs
  let weightEscalation = false;
  if (weightLogs.length >= 2) {
    const latest = weightLogs[0].weight;
    const previous = weightLogs[1].weight;
    if (previous > latest) {
      const dropPercent = ((previous - latest) / previous) * 100;
      if (dropPercent >= 10.0) {
        weightEscalation = true;
      }
    }
  }

  // Determine if any critical symptom is checked
  const criticalSymptomChecked = Object.values(selectedSymptoms).some(v => v === true);
  const triggerEscalation = weightEscalation || criticalSymptomChecked;

  return (
    <div className="glass-panel" style={{ padding: "32px", borderRadius: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "28px" }}>🥗</span>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Weight & Diet Engine</h2>
          <p style={{ margin: 0, opacity: 0.6, fontSize: "0.85rem" }}>
            Track weight patterns and evaluate body condition
          </p>
        </div>
      </div>

      {/* EMERGENCY ESCALATION INTERSTITIAL */}
      {triggerEscalation && (
        <div style={{
          backgroundColor: "rgba(244,63,94,0.12)", border: "2px solid #f43f5e",
          borderRadius: "12px", padding: "20px", marginBottom: "28px",
          boxShadow: "0 0 16px rgba(244,63,94,0.3)"
        }}>
          <h3 style={{ margin: 0, color: "#f43f5e", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            🚨 CRITICAL MEDICAL ALERT
          </h3>
          <p style={{ margin: "10px 0", fontSize: "13px", color: "#fda4af", lineHeight: "1.4" }}>
            Your dog is showing warning signs (either rapid weight loss &gt;10% or critical clinical symptoms). 
            Please immediately seek veterinary attention. Do not attempt to self-diagnose or modify diet plans locally.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <a href="tel:1-800-482-1594" style={{
              flex: 1, backgroundColor: "#f43f5e", color: "white", padding: "10px", borderRadius: "6px",
              textAlign: "center", fontWeight: "700", textDecoration: "none", fontSize: "13px"
            }}>
              📞 Call VCA Hotline
            </a>
          </div>
        </div>
      )}

      {/* WSAVA BODY CONDITION SCORE (BCS) */}
      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
          WSAVA Body Condition Score: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{bcs} / 9</span>
        </label>
        <input
          type="range"
          min="1"
          max="9"
          value={bcs}
          onChange={(e) => setBcs(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", opacity: 0.5, marginTop: "4px" }}>
          <span>1 (Very Thin)</span>
          <span>5 (Ideal)</span>
          <span>9 (Obese)</span>
        </div>
      </div>

      {/* CRITICAL SYMPTOMS CHECKER */}
      <div style={{ marginBottom: "28px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
          Clinical Symptom Tracker
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {SYMPTOMS_LIST.map((sym) => (
            <label key={sym.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!selectedSymptoms[sym.id]}
                onChange={() => handleSymptomToggle(sym.id)}
                style={{ accentColor: "#f43f5e" }}
              />
              <span style={{ opacity: selectedSymptoms[sym.id] ? 1 : 0.6 }}>{sym.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* WEIGHT LOGGER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
          Weight Logs
        </h3>
        <form onSubmit={handleAddLog} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <input
            type="number"
            step="0.1"
            placeholder="Log weight in kg..."
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            style={{
              flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)",
              backgroundColor: "rgba(0,0,0,0.2)", color: "white", fontSize: "13px"
            }}
          />
          <button type="submit" className="btn-secondary" style={{ padding: "10px 16px" }}>Log</button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {weightLogs.map((log, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "13px" }}>
              <span style={{ opacity: 0.6 }}>{log.date}</span>
              <strong style={{ color: "#eee" }}>{log.weight} kg</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
