import React from "react";

export function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isPremium = user?.billing_status === "active";

  return (
    <header className="glass-panel" style={{ padding: "16px 32px", marginBottom: "40px", borderRadius: "0 0 16px 16px", borderTop: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>🐕</span>
          <div>
            <h1 style={{ fontSize: "20px", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Talking Dog
            </h1>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Body Language & Bark Translator</p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "24px" }}>
          {["dashboard", "history", "billing"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                color: activeTab === tab ? "var(--text-active)" : "var(--text-muted)",
                fontWeight: activeTab === tab ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: activeTab === tab ? "rgba(255,255,255,0.05)" : "transparent",
                transition: "all 0.2s ease"
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: "500" }}>{user?.full_name || user?.email}</p>
            <span
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "20px",
                fontWeight: "700",
                textTransform: "uppercase",
                backgroundColor: isPremium ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                color: isPremium ? "var(--green-neon)" : "var(--accent)",
                border: `1px solid ${isPremium ? "rgba(16, 185, 129, 0.3)" : "rgba(99, 102, 241, 0.3)"}`
              }}
            >
              {isPremium ? "Premium Pro" : "Free Plan"}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
