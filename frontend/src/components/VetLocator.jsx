// ==============================================================================
// VetLocator.jsx — 24/7 Emergency Vet & Animal Hospital Locator
// Queries location services with static offline emergency lists for safety.
// ==============================================================================

import React, { useState } from "react";
import api from "../services/api";

const EMERGENCY_CHAINS = [
  { name: "MaxPetz 24/7 Emergency Vet Clinic", phone: "+91 11 4041 4041", hours: "24/7 Open", address: "New Delhi, India" },
  { name: "Cessna Lifeline 24/7 Animal Hospital", phone: "+91 80 4821 3945", hours: "24/7 Open", address: "Bengaluru, India" },
  { name: "Crown Vet Emergency Care Center", phone: "+91 22 4893 9041", hours: "24/7 Open", address: "Mumbai, India" },
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
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const clinics = await api.searchVets(lat, lng);
          setResults(clinics);
        } catch (err) {
          setErrorMsg("Failed to query nearby vets. Falling back to default list.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setErrorMsg("Failed to retrieve location. Please input postal code manually.");
        setLoading(false);
      }
    );
  };

  const handleSearchByCode = async (e) => {
    e.preventDefault();
    if (!postalCode) return;
    setLoading(true);
    setErrorMsg("");
    
    try {
      // Geolocate postal code using free open-source Nominatim API
      const geoUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}&format=json&limit=1`;
      const response = await fetch(geoUrl, {
        headers: { "User-Agent": "TalkingDogApp/1.0" }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const clinics = await api.searchVets(lat, lng);
          setResults(clinics);
          setLoading(false);
          return;
        }
      }
      setErrorMsg("Postal code location not found. Try searching near you.");
    } catch (err) {
      setErrorMsg("Failed to query geolocation services.");
    } finally {
      setLoading(false);
    }
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
