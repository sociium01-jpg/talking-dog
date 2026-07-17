import React, { useState } from "react";
import ThreeDog from "./ThreeDog";

export default function LandingPage({ onStartOnboarding, onSkipToAuth }) {
  const [dogActionCount, setDogActionCount] = useState(0);
  const [lastAction, setLastAction] = useState("");

  const handleDogInteraction = (barkText) => {
    setDogActionCount((prev) => prev + 1);
    setLastAction(barkText);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100%",
      padding: "24px 20px 40px 20px",
      gap: "28px",
      overflowY: "auto",
      width: "100%",
      boxSizing: "border-box"
    }}>
      {/* App Logo & Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px", filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))" }}>🐕</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: "800",
            fontSize: "18px",
            letterSpacing: "0.05em",
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>TALKING DOG</span>
        </div>
        <button
          onClick={onSkipToAuth}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            fontSize: "11px",
            fontWeight: "600",
            padding: "6px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(255,255,255,0.08)";
            e.target.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255,255,255,0.04)";
            e.target.style.color = "var(--text-muted)";
          }}
        >
          Skip to Sign In
        </button>
      </div>

      {/* Hero Headings */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "800",
          lineHeight: "1.15",
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px"
        }}>
          Canine Intent,<br />
          <span style={{ color: "var(--teal-neon)", WebkitTextFillColor: "initial" }}>Decoded in Real-time.</span>
        </h1>
        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          lineHeight: "1.5",
          maxWidth: "340px",
          margin: "0 auto"
        }}>
          The first multi-modal AI translator combining dog body language and vocal pitch for precise emotional readings.
        </p>
      </div>

      {/* 3D Immersive Dog Display Container */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "250px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {/* Glow Ring backdrop */}
        <div style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          filter: "blur(20px)",
          zIndex: 0
        }} />
        
        {/* Futuristic Grid Circle */}
        <div style={{
          position: "absolute",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          border: "1px dashed rgba(6, 182, 212, 0.15)",
          animation: "spin 60s linear infinite",
          zIndex: 0
        }} />

        <div style={{
          width: "100%",
          height: "100%",
          zIndex: 1,
          position: "relative"
        }}>
          <ThreeDog
            size="Medium"
            earType="Pointy"
            tailType="Long"
            color="Tan"
            onInteraction={handleDogInteraction}
          />
        </div>

        {/* Action counter badge */}
        {dogActionCount > 0 && (
          <div style={{
            position: "absolute",
            bottom: "0px",
            right: "20px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "11px",
            color: "var(--teal-neon)",
            zIndex: 10,
            animation: "slideIn 0.3s ease forwards"
          }}>
            ⚡ Pet Count: {dogActionCount}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <button
          onClick={onStartOnboarding}
          className="btn-primary animate-slide"
          style={{
            width: "100%",
            maxWidth: "340px",
            padding: "16px",
            fontSize: "16px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.35)",
            border: "1px solid rgba(255,255,255,0.15)"
          }}
        >
          <span>Get Started</span>
          <span style={{ fontSize: "18px" }}>→</span>
        </button>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Calibrate breed specs & try translation demo · 2 min
        </span>
      </div>

      {/* Feature cards Grid */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        marginTop: "10px"
      }}>
        <h3 style={{
          fontSize: "14px",
          fontWeight: "700",
          color: "var(--text-main)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          opacity: 0.8,
          marginBottom: "2px"
        }}>Multi-Modal Analysis Engine</h3>

        {/* Feature 1 */}
        <div className="glass-panel" style={{
          padding: "16px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
          transition: "transform 0.2s"
        }}>
          <div style={{
            fontSize: "20px",
            background: "rgba(99, 102, 241, 0.15)",
            padding: "8px",
            borderRadius: "10px",
            color: "var(--accent)",
            lineHeight: 1
          }}>📐</div>
          <div>
            <h4 style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "4px" }}>Pose Keypoint Tracker</h4>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Identifies tail-wag frequency, ear angle deviation, and posture alignment metrics in 3D.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="glass-panel" style={{
          padding: "16px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start"
        }}>
          <div style={{
            fontSize: "20px",
            background: "rgba(6, 182, 212, 0.15)",
            padding: "8px",
            borderRadius: "10px",
            color: "var(--teal-neon)",
            lineHeight: 1
          }}>🔊</div>
          <div>
            <h4 style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "4px" }}>Bark Acoustic Classifier</h4>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Extracts pitch arousal, vocal harmonics, and spectrogram patterns to map vocal valence.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="glass-panel" style={{
          padding: "16px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start"
        }}>
          <div style={{
            fontSize: "20px",
            background: "rgba(16, 185, 129, 0.15)",
            padding: "8px",
            borderRadius: "10px",
            color: "var(--green-neon)",
            lineHeight: 1
          }}>🧠</div>
          <div>
            <h4 style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "4px" }}>AI Intent Fusion Layer</h4>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Merges pose and vocal indexes into a unified LLM translation, rendering natural explanations.
            </p>
          </div>
        </div>
      </div>

      {/* Inline styles for background animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
