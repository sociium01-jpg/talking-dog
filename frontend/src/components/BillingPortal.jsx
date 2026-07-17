import React, { useState } from "react";
import api from "../services/api";

export function BillingPortal({ user, onBillingUpdate }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isPremium = user?.billing_status === "active";

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage("");
    try {
      const sub = await api.subscribe("plan_dog_premium_monthly");
      
      // In production, Razorpay SDK is launched:
      // var options = {
      //   "key": "RAZORPAY_KEY_ID",
      //   "subscription_id": sub.subscription_id,
      //   "handler": function (response) { ... }
      // };
      // var rzp = new window.Razorpay(options);
      // rzp.open();

      setMessage(`Order created: ${sub.subscription_id}. Click below to simulate Razorpay payment callback webhook.`);
    } catch (err) {
      setMessage(`Error initiating checkout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      // Calls our simulated webhook in endpoints.py via api.js
      const updatedUser = await api.simulateWebhookSuccess("sub_mock123", "order_mock123");
      onBillingUpdate(updatedUser);
      setMessage("SUCCESS: Razorpay webhook simulated! Your profile billing_status is now ACTIVE.");
    } catch (err) {
      setMessage(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "22px", marginBottom: "6px" }}>Premium Translators</h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Unlock custom models and unlimited translations</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Free Plan */}
        <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "380px" }}>
          <div>
            <h4 style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "12px" }}>Free Core</h4>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800" }}>₹0</span>
              <span style={{ color: "var(--text-muted)" }}>/ month</span>
            </div>
            <ul style={{ listStyleType: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <li>✅ Basic body posture outputs</li>
              <li>✅ Basic bark vocalization labels</li>
              <li>❌ Fused LLM narratives</li>
              <li>❌ Model history logs</li>
            </ul>
          </div>
          <button className="btn-secondary" disabled style={{ width: "100%" }}>
            Current Active Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-panel" style={{
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          justify: "space-between",
          height: "380px",
          border: isPremium ? "2px solid var(--green-neon)" : "1px solid var(--accent)",
          position: "relative"
        }}>
          {isPremium && (
            <span style={{
              position: "absolute",
              top: "-12px",
              right: "24px",
              backgroundColor: "var(--green-neon)",
              color: "#000",
              fontSize: "10px",
              fontWeight: "800",
              padding: "4px 10px",
              borderRadius: "10px",
              textTransform: "uppercase"
            }}>
              Active Pro
            </span>
          )}
          
          <div>
            <h4 style={{ fontSize: "18px", color: "var(--accent)", marginBottom: "12px" }}>Premium Pro</h4>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800" }}>₹499</span>
              <span style={{ color: "var(--text-muted)" }}>/ month</span>
            </div>
            <ul style={{ listStyleType: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", marginBottom: "24px" }}>
              <li>✅ Detailed YOLOv8 pose extraction</li>
              <li>✅ Complete bark arousal/valence indexes</li>
              <li>✅ **Grounded LLM Fusion Narratives**</li>
              <li>✅ Unlimited persistent logs</li>
              <li>✅ Priority Vertex AI compute endpoints</li>
            </ul>
          </div>

          <button 
            onClick={handleSubscribe} 
            className="btn-primary" 
            disabled={isPremium || loading} 
            style={{ width: "100%" }}
          >
            {isPremium ? "Active Premium Plan" : "Upgrade to Premium"}
          </button>
        </div>
      </div>

      {message && (
        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", backgroundColor: "rgba(255,255,255,0.03)", border: "1px dashed var(--border-color)", fontSize: "13px" }}>
          <p style={{ marginBottom: "12px" }}>{message}</p>
          {!isPremium && (
            <button 
              onClick={handleSimulatePayment} 
              className="btn-primary" 
              style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--green-neon)", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" }}
            >
              🛠️ Simulate Webhook Payment Activation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BillingPortal;
