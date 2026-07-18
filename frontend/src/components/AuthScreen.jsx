import React, { useState } from "react";
import api from "../services/api";

export function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onLoginSuccess(data.user);
      } else {
        const data = await api.signup(email, password, fullName);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "40px", border: "1px solid var(--border-color)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "48px" }}>🐕</span>
          <h2 style={{ fontSize: "24px", marginTop: "12px", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {isLogin ? "Sign in to translate your dog's behaviors" : "Get started with body language & vocalization translations"}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--red-neon)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isLogin && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none", fontSize: "14px" }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dogowner@example.com"
              required
              style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none", fontSize: "14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none", fontSize: "14px" }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "12px" }}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "24px" }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: "500" }}
          >
            {isLogin ? "Need an account? Sign Up" : "Have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AuthScreen;
