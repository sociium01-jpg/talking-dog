import React from "react";

export function Navbar({ activeTab, setActiveTab, user, onLogout, onReonboard }) {
  const isPremium = user?.billing_status === "active";

  const navItems = [
    { id: "dashboard", label: "Upload", icon: "📤" },
    { id: "live", label: "Live", icon: "🔴" },
    { id: "vets", label: "Vets", icon: "🏥" },
    { id: "diet", label: "Diet", icon: "🥗" },
    { id: "history", label: "History", icon: "🕓" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "admin", label: "Admin", icon: "⚙️" }
  ];

  return (
    <>
      {/* Simple TOP HEADER Bar */}
      <header className="glass-panel" style={{
        padding: "16px 20px",
        borderRadius: "0 0 16px 16px",
        borderTop: "none",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px" }}>🐕</span>
          <div>
            <h1 style={{ fontSize: "16px", margin: 0, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Talking Dog
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={onReonboard}
            className="btn-secondary"
            style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <span>⚙️</span> Calibrate
          </button>
          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "6px" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Sticky BOTTOM TAB BAR */}
      <nav className="glass-panel" style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "450px", // align with smartphone mockup width
        borderRadius: "16px 16px 0 0",
        borderBottom: "none",
        padding: "10px 4px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)"
      }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                padding: "4px",
                color: isActive ? "var(--text-active)" : "var(--text-muted)",
                transition: "all 0.2s ease",
                flex: 1
              }}
            >
              <span style={{ fontSize: "20px", filter: isActive ? "grayscale(0%)" : "grayscale(80%) opacity(70%)" }}>
                {item.icon}
              </span>
              <span style={{ fontSize: "9px", fontWeight: isActive ? "700" : "500", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default Navbar;
