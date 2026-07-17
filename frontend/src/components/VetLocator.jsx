// ==============================================================================
// VetLocator.jsx — 24/7 Emergency Vet & Animal Hospital Locator
// Queries location services with static offline emergency lists for safety.
// ==============================================================================

import React, { useState } from "react";

const EMERGENCY_CHAINS = [
  { name: "BluePearl Specialty & Emergency Pet Hospital", phone: "1-800-482-1594", hours: "24/7", address: "National Network" },
  { name: "VCA Animal Hospitals Emergency Service", phone: "1-800-822-7387", hours: "24/7", address: "National Network" },
  { name: "Banfield Pet Hospital (Emergency Care)", phone: "1-870-226-3435", hours: "Varies", address: "National Network" },
];

export default function VetLocator() {
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGetCurrentLocation = () => {
    setLoading(true);
    setErrorMsg("");
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Simulate Nearby Places API fetch using geo-coordinates
        setTimeout(() => {
          setResults([
            { name: "Local Metro Emergency Animal Hospital", phone: "555-0192", distance: "1.4 miles", hours: "24/7 Open", address: "782 Medical Center Dr" },
            { name: "Canine Care & Specialty Clinic", phone: "555-3841", distance: "3.2 miles", hours: "8:00 AM - 10:00 PM", address: "914 Oakwood Ave" },
            { name: "Valley Veterinary Urgent Care", phone: "555-9012", distance: "4.8 miles", hours: "24/7 Open", address: "102 Industrial Pkwy" }
          ]);
          setLoading(false);
        }, 1200);
      },
      (err) => {
        setErrorMsg("Failed to retrieve location. Please input postal code manually.");
        setLoading(false);
      }
    );
  };

  const handleSearchByCode = (e) => {
    e.preventDefault();
    if (!postalCode) return;
    setLoading(true);
    setErrorMsg("");
    setTimeout(() => {
      setResults([
        { name: "Metro Veterinary Clinic", phone: "555-4819", distance: "2.1 miles", hours: "24/7 Open", address: `501 Main St, Area ${postalCode}` },
        { name: "Sunset Pet Urgent Care", phone: "555-3921", distance: "3.9 miles", hours: "8:00 AM - Midnight", address: `89 Broadway Rd, Area ${postalCode}` }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="glass-panel" style={{ padding: "32px", borderRadius: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "28px" }}>🏥</span>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Vet & Urgent Care Locator</h2>
          <p style={{ margin: 0, opacity: 0.6, fontSize: "0.85rem" }}>
            Find 24/7 emergency veterinary clinics nearby
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
        <button className="btn-primary" onClick={handleGetCurrentLocation} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Locating Vets..." : "📍 Find Vets Near Me"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "12px", opacity: 0.4 }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />
        </div>

        <form onSubmit={handleSearchByCode} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Enter Postal/Zip Code..."
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            style={{
              flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)",
              backgroundColor: "rgba(0,0,0,0.2)", color: "white", fontSize: "14px"
            }}
          />
          <button type="submit" className="btn-secondary" style={{ padding: "12px 20px" }}>Search</button>
        </form>
      </div>

      {errorMsg && (
        <p style={{ color: "var(--red-neon)", fontSize: "13px", padding: "10px", backgroundColor: "rgba(244,63,94,0.1)", borderRadius: "6px", marginBottom: "20px" }}>
          {errorMsg}
        </p>
      )}

      {/* SEARCH RESULTS */}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Nearby Emergency Care</h3>
          {results.map((vet, idx) => (
            <div key={idx} style={{ padding: "16px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <strong style={{ fontSize: "14px", color: "#f8fafc" }}>{vet.name}</strong>
                <span style={{ fontSize: "11px", color: "var(--green-neon)", background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: "10px", fontWeight: 600 }}>
                  {vet.distance}
                </span>
              </div>
              <p style={{ margin: "2px 0", fontSize: "12px", opacity: 0.6 }}>{vet.address}</p>
              <p style={{ margin: "2px 0", fontSize: "12px", color: "var(--teal-neon)" }}>🕒 {vet.hours}</p>
              <a href={`tel:${vet.phone}`} style={{
                display: "inline-block", marginTop: "10px", fontSize: "13px", color: "var(--accent)",
                textDecoration: "none", fontWeight: 600
              }}>
                📞 Call Hospital: {vet.phone}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* STATIC OFFLINE EMERGENCY CHAINS */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--red-neon)", textTransform: "uppercase", marginBottom: "12px" }}>
          🚨 24/7 National Emergency Helplines
        </h3>
        <p style={{ fontSize: "12px", opacity: 0.5, marginBottom: "16px" }}>
          Always call ahead to confirm immediate doctor availability before driving.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {EMERGENCY_CHAINS.map((chain, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "rgba(244,63,94,0.03)", borderRadius: "8px", border: "1px solid rgba(244,63,94,0.15)" }}>
              <div>
                <strong style={{ fontSize: "13px", color: "#eee" }}>{chain.name}</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>{chain.address} • {chain.hours}</span>
              </div>
              <a href={`tel:${chain.phone}`} style={{
                fontSize: "12px", backgroundColor: "#f43f5e", color: "white", padding: "6px 12px",
                borderRadius: "6px", textDecoration: "none", fontWeight: 700
              }}>
                Call Now
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
