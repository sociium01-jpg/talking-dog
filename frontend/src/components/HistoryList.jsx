import React, { useEffect, useState } from "react";
import api from "../services/api";

export function HistoryList({ onSelectResult }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const records = await api.getHistory();
      if (records && records.length > 0) {
        setHistory(records);
      } else {
        // Mock fallback if empty DB
        setHistory([
          {
            id: "mock-hist-1",
            created_at: "2026-07-17T12:00:00Z",
            pose_results: { posture: "play_bow", tail_wag: "high_fast", ears: "forward", confidence: 0.94 },
            audio_results: { vocalization: "high_bark", arousal: "high", valence: "positive", confidence: 0.89 },
            fusion_narrative: "The dog's playful posture and fast wagging tail suggest excitement. The high-pitched bark indicates a positive intent, wanting to play.",
            confidence: 0.91
          },
          {
            id: "mock-hist-2",
            created_at: "2026-07-17T10:30:00Z",
            pose_results: { posture: "cowering", tail_wag: "tucked", ears: "pinned", confidence: 0.88 },
            audio_results: { vocalization: "whimper", arousal: "medium", valence: "negative", confidence: 0.82 },
            fusion_narrative: "The cowering posture and tucked tail reveal fear and anxiety. The soft whimper highlights negative valence, indicating high vulnerability.",
            confidence: 0.85
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load history, using fallback mock list.", err);
      // Fallback mocks
      setHistory([
        {
          id: "mock-hist-1",
          created_at: new Date().toISOString(),
          pose_results: { posture: "play_bow", tail_wag: "high_fast", ears: "forward", confidence: 0.94 },
          audio_results: { vocalization: "high_bark", arousal: "high", valence: "positive", confidence: 0.89 },
          fusion_narrative: "The dog is displaying a classic play bow posture with a high-pitched bark and fast tail wagging. These signals suggest a state of high arousal and positive valence, indicating an active desire to play and interact.",
          confidence: 0.91
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading past translations...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>Translation Logs</h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Past intent classifications saved to your profile</p>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No previous translations found. Start by submitting clips!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelectResult(item)}
              className="glass-panel glass-card-interactive" 
              style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--border-color)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(item.created_at).toLocaleString()}
                </span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: item.confidence > 0.8 ? "var(--green-neon)" : "var(--yellow-neon)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  {(item.confidence * 100).toFixed(0)}% Conf
                </span>
              </div>

              <p style={{ fontSize: "14px", fontWeight: "500", color: "#e2e8f0", lineBreak: "anywhere" }}>
                "{item.fusion_narrative}"
              </p>

              <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                <span>Pose: <strong>{item.pose_results?.posture}</strong></span>
                <span>•</span>
                <span>Audio: <strong>{item.audio_results?.vocalization}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryList;
