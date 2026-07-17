// ==============================================================================
// AdminConsole.jsx — Internal Portal View for Billing & Subscriber Logs
// Lists mock users, Razorpay payment statuses, and messaging schedules.
// ==============================================================================

import React, { useState } from "react";

const INITIAL_SUBSCRIBERS = [
  { id: 1, email: "premium@example.com", name: "Premium Tester", status: "Active (Razorpay)", renewal: "2026-08-17", plan: "Premium Pro" },
  { id: 2, email: "demo@example.com", name: "Standard Demo", status: "Active (Trial)", renewal: "2026-07-24", plan: "Standard Plan" },
  { id: 3, email: "john.dog@gmail.com", name: "John Barker", status: "Past Due", renewal: "2026-07-10", plan: "Premium Pro" },
];

export default function AdminConsole() {
  const [subscribers, setSubscribers] = useState(INITIAL_SUBSCRIBERS);
  const [notifSent, setNotifSent] = useState(false);

  const triggerMockReminder = () => {
    setNotifSent(true);
    setTimeout(() => setNotifSent(false), 3000);
  };

  return (
    <div className="glass-panel" style={{ padding: "32px", borderRadius: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "28px" }}>⚙️</span>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Admin Console</h2>
          <p style={{ margin: 0, opacity: 0.6, fontSize: "0.85rem" }}>
            Monitor billing states and trigger check-in schedules
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button className="btn-secondary" onClick={triggerMockReminder} style={{ flex: 1, fontSize: "13px" }}>
          💬 Trigger Scheduled WhatsApp Check-ins
        </button>
      </div>

      {notifSent && (
        <p style={{
          color: "var(--green-neon)", fontSize: "13px", padding: "10px",
          backgroundColor: "rgba(16,185,129,0.1)", borderRadius: "6px", marginBottom: "20px", textAlign: "center"
        }}>
          ✅ Mock WhatsApp notification triggers dispatched via Asha scheduler stack!
        </p>
      )}

      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
          Razorpay Webhook Subscription Logs
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {subscribers.map((sub) => (
            <div key={sub.id} style={{
              padding: "16px", backgroundColor: "rgba(255,255,255,0.02)",
              borderRadius: "8px", border: "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "14px", color: "#eee" }}>{sub.name}</strong>
                <span style={{
                  fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
                  color: sub.status.includes("Active") ? "var(--green-neon)" : "var(--red-neon)",
                  background: sub.status.includes("Active") ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)"
                }}>
                  {sub.status}
                </span>
              </div>
              <p style={{ margin: "2px 0", fontSize: "12px", opacity: 0.6 }}>Email: {sub.email}</p>
              <p style={{ margin: "2px 0", fontSize: "12px", opacity: 0.6 }}>Plan type: {sub.plan}</p>
              <p style={{ margin: "2px 0", fontSize: "12px", color: "var(--teal-neon)" }}>Next renewal: {sub.renewal}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
