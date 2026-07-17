import React from "react";

export function ResultsPanel({ results, loading }) {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px" }}>
        <div style={{
          border: "4px solid rgba(255,255,255,0.05)",
          borderTop: "4px solid var(--accent)",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          animation: "spin 1s linear infinite",
          marginBottom: "16px"
        }} />
        <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>Analyzing Dog Intent...</h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Running body language and vocalization classifiers on Vertex AI</p>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!results) return null;

  const { pose_results, audio_results, fusion_narrative, confidence } = results;

  // Determine colors based on valence
  const getValenceColor = (val) => {
    if (val === "positive") return "var(--green-neon)";
    if (val === "negative") return "var(--red-neon)";
    return "var(--yellow-neon)";
  };

  return (
    <div className="grid-cols-2 animate-slide">
      
      {/* LEFT PANEL: Input Visualizations */}
      <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={{ fontSize: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Observations</h3>
        
        {/* Video Card Representation */}
        <div className="spectrogram-container" style={{ height: "180px", backgroundColor: "#111", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid var(--border-color)" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "36px" }}>📹</span>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#eee", marginTop: "8px" }}>Pose Video Frame Stream</p>
            <span style={{ fontSize: "11px", color: "var(--green-neon)", padding: "2px 8px", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", marginTop: "6px", display: "inline-block" }}>
              Active (YOLOv8 Pose Tracker)
            </span>
          </div>
        </div>

        {/* Audio Spectrogram Representation */}
        <div className="spectrogram-container" style={{ height: "180px", background: "linear-gradient(45deg, #111e2e 0%, #1e1b4b 100%)", position: "relative" }}>
          <div className="spectrogram-glow" />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 1 }}>
            <span style={{ fontSize: "36px" }}>📊</span>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#eee", marginTop: "8px" }}>Log-Mel Audio Spectrogram</p>
            <p style={{ fontSize: "10px", color: "var(--teal-neon)", marginTop: "4px" }}>22.05 kHz • Shape (128, 128)</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Translation & Classification Intent */}
      <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Translation Engine</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Confidence:</span>
            <span style={{
              fontSize: "12px",
              fontWeight: "700",
              color: confidence > 0.8 ? "var(--green-neon)" : "var(--yellow-neon)",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "rgba(255,255,255,0.05)"
            }}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Narrator translation card */}
        <div style={{ 
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)",
          borderLeft: "4px solid var(--accent)",
          padding: "20px",
          borderRadius: "8px",
          lineHeight: "1.6"
        }}>
          <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "700", display: "block", textTransform: "uppercase", marginBottom: "6px" }}>Grounded Translation</span>
          <p style={{ fontSize: "15px", fontWeight: "500", color: "#f8fafc" }}>
            "{fusion_narrative}"
          </p>
        </div>

        {/* Feature details grids */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          
          {/* Pose outputs */}
          <div style={{ padding: "14px", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>POSE CLASSIFIER</span>
            <p style={{ fontSize: "13px", margin: "4px 0" }}>Posture: <strong style={{ color: "#eee" }}>{pose_results?.posture}</strong></p>
            <p style={{ fontSize: "13px", margin: "4px 0" }}>Tail Wag: <strong style={{ color: "#eee" }}>{pose_results?.tail_wag}</strong></p>
            <p style={{ fontSize: "13px", margin: "4px 0" }}>Ears: <strong style={{ color: "#eee" }}>{pose_results?.ears}</strong></p>
          </div>

          {/* Audio outputs */}
          <div style={{ padding: "14px", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>AUDIO CLASSIFIER</span>
            <p style={{ fontSize: "13px", margin: "4px 0" }}>Vocal: <strong style={{ color: "#eee" }}>{audio_results?.vocalization}</strong></p>
            <p style={{ fontSize: "13px", margin: "4px 0" }}>Arousal: <strong style={{ color: "#eee" }}>{audio_results?.arousal}</strong></p>
            <p style={{ fontSize: "13px", margin: "4px 0" }}>Valence: <strong style={{ color: getValenceColor(audio_results?.valence) }}>{audio_results?.valence}</strong></p>
          </div>
        </div>

        {/* Medical disclaimer */}
        <div style={{ 
          fontSize: "11px", 
          color: "var(--text-muted)", 
          padding: "12px", 
          backgroundColor: "rgba(255,255,255,0.02)", 
          borderRadius: "6px",
          border: "1px dashed var(--border-color)",
          display: "flex",
          gap: "8px",
          alignItems: "flex-start"
        }}>
          <span>⚠️</span>
          <span>
            <strong>Disclaimer:</strong> Translations are best-guess intent estimations based on human-perceived body language datasets. They do not constitute veterinary or clinical diagnosis.
          </span>
        </div>
      </div>
    </div>
  );
}

export default ResultsPanel;
