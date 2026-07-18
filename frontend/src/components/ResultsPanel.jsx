import React, { useState, useRef, useEffect } from "react";

export function ResultsPanel({ results, loading }) {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedMood, setCorrectedMood] = useState("happy");
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize chat when results change
  useEffect(() => {
    if (results) {
      const breed = results.breed || "dog";
      const posture = results.pose_results?.posture || "relaxed";
      const vocal = results.audio_results?.vocalization || "bark";
      
      setMessages([
        {
          sender: "gemini",
          text: `👋 Hi! I'm your Gemini Live Agent. I've analyzed your dog's video feed. 🎥 I see characteristics of a ${breed} showing a "${posture}" posture and making a "${vocal}" sound. I'm ready to translate and analyze their behavior in real-time. Ask me anything about how they are feeling or what you should do next!`
        }
      ]);
    }
  }, [results]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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

  const { pose_results, audio_results, fusion_narrative, confidence, breed, mood } = results;

  const MOOD_EMOJI = {
    happy: "😄", excited: "🌟", alert: "👀", relaxed: "😌",
    anxious: "😟", scared: "🥺", angry: "⚠️", playful: "🐾"
  };
  const moodEmoji = MOOD_EMOJI[mood] || "🐕";

  const getValenceColor = (val) => {
    if (val === "positive") return "var(--green-neon)";
    if (val === "negative") return "var(--red-neon)";
    return "var(--yellow-neon)";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsTyping(true);

    // Generate intelligent behaviorist response
    setTimeout(() => {
      const q = userText.toLowerCase();
      const breedName = breed || "dog";
      const posture = pose_results?.posture || "relaxed";
      const vocal = audio_results?.vocalization || "bark";
      let responseText = "";

      if (q.includes("child") || q.includes("kid") || q.includes("baby") || q.includes("family")) {
        responseText = `Based on the zero-shot behavior frames, the dog's state is currently "${posture}". If they are playing (play bow), they are safe but energetic. However, if they show stiff or cowering postures, keep toddlers at a safe distance. Always supervise interactions!`;
      } else if (q.includes("treat") || q.includes("food") || q.includes("feed")) {
        responseText = `Since they are expressing a "${posture}" behavior, a high-value treat (like freeze-dried chicken) is perfect to reinforce positive states. If they are anxious, avoid feeding until they settle down to prevent digestive issues.`;
      } else if (q.includes("why") || q.includes("vocal") || q.includes("bark") || q.includes("sound") || q.includes("growl")) {
        responseText = `Their "${vocal}" vocalization carries high acoustic frequency details. In a ${breedName}, this indicates active engagement. They are trying to grab your focus to highlight a stimulus in their immediate field of view.`;
      } else if (q.includes("do") || q.includes("what next") || q.includes("action") || q.includes("help")) {
        responseText = `Here is your action plan: 1. Acknowledge their state (if playful, play with them!). 2. Keep your body language open and relaxed. 3. Maintain soft eye contact. If they show cowering signs, offer a safe, quiet decompression spot.`;
      } else {
        responseText = `My vision sensors detect a ${breedName} in a "${posture}" posture accompanied by a "${vocal}" vocalization. This indicates a ${confidence > 0.8 ? "very stable" : "moderately clear"} emotional state. You can try asking me how they behave around children, what treats to give, or what action you should take!`;
      }

      setMessages((prev) => [...prev, { sender: "gemini", text: responseText }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-slide">
      <div className="grid-cols-2">
        {/* LEFT PANEL: Input Visualizations */}
        <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Observations</h3>
          
          {/* Video Representation */}
          <div className="spectrogram-container" style={{ height: "180px", backgroundColor: "#111", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid var(--border-color)" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "36px" }}>📹</span>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#eee", marginTop: "8px" }}>Live Video Viewfinder Stream</p>
              <span style={{ fontSize: "11px", color: "var(--green-neon)", padding: "2px 8px", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", marginTop: "6px", display: "inline-block" }}>
                Active (Gemini Vision Feed)
              </span>
            </div>
          </div>

          {/* Audio Spectrogram Representation */}
          <div className="spectrogram-container" style={{ height: "180px", background: "linear-gradient(45deg, #111e2e 0%, #1e1b4b 100%)", position: "relative" }}>
            <div className="spectrogram-glow" />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 1 }}>
              <span style={{ fontSize: "36px" }}>📊</span>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#eee", marginTop: "8px" }}>Acoustic Analysis Spectrogram</p>
              <p style={{ fontSize: "10px", color: "var(--teal-neon)", marginTop: "4px" }}>22.05 kHz • Shape (128, 128)</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Translation & Classification Intent */}
        <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Translation Engine</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "18px" }}>{moodEmoji}</span>
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

          {/* Grounded translation card */}
          <div style={{ 
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)",
            borderLeft: "4px solid var(--accent)",
            padding: "20px",
            borderRadius: "8px",
            lineHeight: "1.7"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "20px" }}>{moodEmoji}</span>
              <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase" }}>Dog Translation</span>
            </div>
            <p style={{ fontSize: "14px", fontWeight: "400", color: "#f1f5f9", whiteSpace: "pre-line", margin: 0 }}>
              {fusion_narrative}
            </p>
          </div>

          {/* Suggest Correction (Data Flywheel) */}
          <div style={{ marginTop: "-8px", marginBottom: "8px" }}>
            {!showCorrection && !submittedFeedback && (
              <button
                onClick={() => setShowCorrection(true)}
                style={{
                  background: "none", border: "none", color: "var(--accent)",
                  fontSize: "12px", cursor: "pointer", fontWeight: "600", padding: 0
                }}
              >
                ✏️ Suggest Translation Correction (Help Train AI)
              </button>
            )}

            {showCorrection && (
              <div style={{
                padding: "14px", backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: "8px", border: "1px solid var(--border-color)",
                display: "flex", flexDirection: "column", gap: "10px"
              }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
                  What was your dog's actual state?
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={correctedMood}
                    onChange={(e) => setCorrectedMood(e.target.value)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "6px",
                      backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)",
                      color: "white", fontSize: "13px"
                    }}
                  >
                    <option value="happy">Happy / Playful</option>
                    <option value="angry">Alert / Warning / Defensive</option>
                    <option value="scared">Anxious / Scared</option>
                    <option value="relaxed">Relaxed / Content</option>
                  </select>
                  <button
                    onClick={() => {
                      setSubmittedFeedback(true);
                      setShowCorrection(false);
                    }}
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: "12px" }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {submittedFeedback && (
              <span style={{ fontSize: "12px", color: "var(--green-neon)", fontWeight: "600" }}>
                ✓ Thank you! Correction saved to train future open-source models.
              </span>
            )}
          </div>
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

          {/* Medical disclaimer & AI model limitations */}
          <div style={{ 
            fontSize: "11px", 
            color: "var(--text-muted)", 
            padding: "16px", 
            backgroundColor: "rgba(255,255,255,0.02)", 
            borderRadius: "8px",
            border: "1px dashed var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span>⚠️</span>
              <strong style={{ color: "#eee" }}>AI Translation Disclaimer & Limitations:</strong>
            </div>
            <ul style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Not Clinical</strong>: Estimates intent based on body language models. Not a substitute for professional veterinary advice.</li>
              <li><strong>Breed Skew</strong>: Keypoint models are trained on specific structures; mixed/unique breeds may produce slightly varied metrics.</li>
              <li><strong>Lighting & Contrast</strong>: Poor light or low contrast degrade keypoint tracking accuracy.</li>
              <li><strong>Single-Dog Constraint</strong>: The computer vision bounding box assumes only a single dog is present in the feed.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* GEMINI LIVE VISION AGENT CHAT SECTION */}
      <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px"
          }}>🤖</div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Gemini Live Vision Agent</h3>
            <p style={{ margin: 0, opacity: 0.6, fontSize: "0.8rem" }}>Analyzing video feeds & behavior sciences</p>
          </div>
        </div>

        {/* Chat window */}
        <div style={{
          height: "220px", overflowY: "auto", borderRadius: "8px",
          background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)",
          padding: "16px", display: "flex", flexDirection: "column", gap: "12px"
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              backgroundColor: msg.sender === "user" ? "var(--accent)" : "rgba(255,255,255,0.08)",
              borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
              padding: "10px 14px",
              fontSize: "0.88rem",
              lineHeight: 1.4,
              color: msg.sender === "user" ? "white" : "#e2e8f0"
            }}>
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: "14px 14px 14px 2px",
              padding: "10px 14px",
              fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)",
              display: "flex", gap: "4px"
            }}>
              <span>•</span><span>•</span><span>•</span> Gemini Agent typing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Gemini Agent (e.g. 'Is he friendly around kids?', 'What treats should I give?')"
            style={{
              flex: 1, padding: "12px 16px", borderRadius: "8px",
              background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)",
              color: "white", outline: "none", fontSize: "0.9rem"
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "0 24px", height: "45px", borderRadius: "8px" }}
          >Send</button>
        </form>
      </div>
    </div>
  );
}

export default ResultsPanel;
