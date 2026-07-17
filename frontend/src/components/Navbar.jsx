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

        <nav style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "dashboard", label: "📤 Upload" },
            { id: "live", label: "🔴 Live" },
            { id: "history", label: "🕓 History" },
            { id: "billing", label: "💳 Billing" }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                background: "none",
                border: "none",
                color: activeTab === id ? "var(--text-active)" : "var(--text-muted)",
                fontWeight: activeTab === id ? "600" : "500",
                fontSize: "13px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: activeTab === id ? "rgba(255,255,255,0.05)" : "transparent",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
            >
              {label}
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
