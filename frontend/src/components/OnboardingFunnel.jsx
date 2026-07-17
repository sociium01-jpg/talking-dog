import React, { useState, useEffect } from "react";
import ThreeDog from "./ThreeDog";
import BreedSelector from "./BreedSelector";
import AuthScreen from "./AuthScreen";

export default function OnboardingFunnel({ onOnboardingComplete, onCancel }) {
  const [step, setStep] = useState(1);
  
  // Dog profile state
  const [dogName, setDogName] = useState("Buddy");
  const [dogAge, setDogAge] = useState("2");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState("Medium");
  const [earType, setEarType] = useState("Pointy");
  const [tailType, setTailType] = useState("Long");
  const [color, setColor] = useState("Tan");

  // Sensor calibration states
  const [camStatus, setCamStatus] = useState("pending"); // pending, scanning, success
  const [micStatus, setMicStatus] = useState("pending"); // pending, scanning, success

  // Demo simulation states
  const [demoMood, setDemoMood] = useState("happy");
  const [isDemoScanning, setIsDemoScanning] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoResult, setDemoResult] = useState(null);

  // Auto-set traits based on breed selection
  const handleBreedChange = (name, info) => {
    setBreed(name);
    if (!info) return;

    // Auto-map size
    if (info.size.toLowerCase().includes("giant") || info.size.toLowerCase().includes("huge")) {
      setSize("Giant");
    } else if (info.size.toLowerCase().includes("large")) {
      setSize("Large");
    } else if (info.size.toLowerCase().includes("small")) {
      setSize("Small");
    } else if (info.size.toLowerCase().includes("tiny") || info.size.toLowerCase().includes("toy")) {
      setSize("Tiny");
    } else {
      setSize("Medium");
    }

    // Auto-map ears & colors based on common breed names
    const breedLower = name.toLowerCase();
    if (breedLower.includes("retriever") || breedLower.includes("hound") || breedLower.includes("spaniel") || breedLower.includes("pug") || breedLower.includes("mastiff") || breedLower.includes("bulldog")) {
      setEarType("Floppy");
    } else {
      setEarType("Pointy");
    }

    if (breedLower.includes("golden")) {
      setColor("Golden");
    } else if (breedLower.includes("samoyed") || breedLower.includes("rajapalayam") || breedLower.includes("spitz") || breedLower.includes("white")) {
      setColor("White");
    } else if (breedLower.includes("rottweiler") || breedLower.includes("black") || breedLower.includes("doberman")) {
      setColor("Black");
    } else if (breedLower.includes("shepherd") || breedLower.includes("boxer") || breedLower.includes("pariah")) {
      setColor("Tan");
    } else if (breedLower.includes("grey") || breedLower.includes("weimaraner") || breedLower.includes("whippet")) {
      setColor("Grey");
    } else if (breedLower.includes("chocolate") || breedLower.includes("brown")) {
      setColor("Brown");
    }

    // Auto-map tail
    if (breedLower.includes("spitz") || breedLower.includes("pug") || breedLower.includes("basenji") || breedLower.includes("samoyed")) {
      setTailType("Curled");
    } else if (breedLower.includes("corgi") || breedLower.includes("rottweiler") || breedLower.includes("boxer") || breedLower.includes("jack russell")) {
      setTailType("Short");
    } else {
      setTailType("Long");
    }
  };

  // Simulate sensor calibration
  useEffect(() => {
    if (step === 3) {
      setCamStatus("scanning");
      const camTimeout = setTimeout(() => {
        setCamStatus("success");
        setMicStatus("scanning");
      }, 1500);

      const micTimeout = setTimeout(() => {
        setMicStatus("success");
      }, 3000);

      return () => {
        clearTimeout(camTimeout);
        clearTimeout(micTimeout);
      };
    }
  }, [step]);

  // Run mock demo translation sequence
  const startDemoTranslation = (mood) => {
    setDemoMood(mood);
    setIsDemoScanning(true);
    setDemoProgress(0);
    setDemoResult(null);

    const interval = setInterval(() => {
      setDemoProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsDemoScanning(false);
          
          // Generate customized translation based on mood & calibration
          if (mood === "happy") {
            setDemoResult({
              intent: "Playful / Highly Social",
              translation: `${dogName} is feeling safe, happy, and inviting you to play! The rapid tail wag and relaxed face indicate high positive arousal.`,
              confidence: "95%",
              pose: "Tail wagging wide (symmetric), erect head, slight play-bow stance.",
              vocalization: "Short, high-pitched vocal chirp (Arousal level: Medium-High)"
            });
          } else if (mood === "alert") {
            setDemoResult({
              intent: "Alert / Territory Defense",
              translation: `${dogName} detected an unfamiliar stimulus and is scanning. The high, stiff tail and forward-facing ears indicate vigilant assessment.`,
              confidence: "88%",
              pose: "Tail held high/stiff, leaning forward, weight on front paws.",
              vocalization: "Low-frequency warning growl (Valence: Guarded)"
            });
          } else { // submissive/scared
            setDemoResult({
              intent: "Anxious / Submissive",
              translation: `${dogName} is showing signs of moderate apprehension or submissive greeting. Tucking the tail in and lowering the posture are markers of self-soothing.`,
              confidence: "91%",
              pose: "Tucked tail, head lowered, ears retracted backward.",
              vocalization: "Soft whining/sigh (Valence: Negative, Arousal: Low)"
            });
          }
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleFinishOnboarding = (profile) => {
    // Save calibrated dog profile to local storage
    localStorage.setItem("calibrated_dog", JSON.stringify({
      name: dogName,
      age: dogAge,
      breed,
      size,
      earType,
      tailType,
      color
    }));
    
    // Complete onboarding pass back to App
    onOnboardingComplete(profile);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100%",
      padding: "24px 20px 40px 20px",
      width: "100%",
      boxSizing: "border-box",
      overflowY: "auto"
    }}>
      {/* Header navigation bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: "16px"
      }}>
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "20px",
            cursor: "pointer"
          }}
        >
          ←
        </button>
        {/* Progress indicator */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              style={{
                width: "16px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: s === step 
                  ? "var(--accent)" 
                  : s < step 
                    ? "var(--teal-neon)" 
                    : "rgba(255,255,255,0.1)",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
          Step {step}/5
        </span>
      </div>

      {/* STEP 1: WELCOME & GENERAL INTRO */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", textAlign: "center", marginTop: "20px" }}>
          <div style={{ fontSize: "64px", filter: "drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))" }}>🚀</div>
          <div>
            <h2 style={{ fontSize: "24px", color: "white", marginBottom: "8px" }}>Interactive Calibration</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
              To translate behaviors accurately, we calibrate the translation matrix based on your dog's specific anatomy and vocal profile.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", fontSize: "13px" }}>
              <span>📐</span>
              <div>
                <strong>Anatomical Offsets</strong>: Floppy vs pointy ears shift pose classification thresholds by 12 degrees.
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", fontSize: "13px" }}>
              <span>🔊</span>
              <div>
                <strong>Acoustic Resonance</strong>: Dog size (Giant to Tiny) recalibrates formants and bark pitch frequencies.
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="btn-primary"
            style={{ width: "100%", marginTop: "12px" }}
          >
            Let's Calibrate
          </button>
        </div>
      )}

      {/* STEP 2: PROFILE CALIBRATION & LIVE 3D MORPHING */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Mini 3D Dog Viewport */}
          <div className="glass-panel" style={{
            position: "relative",
            width: "100%",
            height: "180px",
            overflow: "hidden",
            borderColor: "rgba(99, 102, 241, 0.25)"
          }}>
            <div style={{
              position: "absolute",
              top: "10px",
              left: "12px",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--teal-neon)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              zIndex: 10
            }}>
              Live 3D Specimen Calibration
            </div>
            <ThreeDog
              size={size}
              earType={earType}
              tailType={tailType}
              color={color}
            />
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="grid-cols-2" style={{ gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Dog Name</label>
                <input
                  type="text"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-color)", color: "white", outline: "none", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Age (years)</label>
                <input
                  type="number"
                  value={dogAge}
                  onChange={(e) => setDogAge(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-color)", color: "white", outline: "none", fontSize: "13px" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Search Breed</label>
              <BreedSelector value={breed} onChange={handleBreedChange} />
            </div>

            <div className="grid-cols-2" style={{ gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Size Class</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--border-color)", color: "white", outline: "none", fontSize: "13px" }}
                >
                  <option value="Tiny">Tiny (e.g. Chihuahua)</option>
                  <option value="Small">Small (e.g. Shiba)</option>
                  <option value="Medium">Medium (e.g. Pariah)</option>
                  <option value="Large">Large (e.g. Golden)</option>
                  <option value="Giant">Giant (e.g. Mastiff)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Coat Color</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--border-color)", color: "white", outline: "none", fontSize: "13px" }}
                >
                  <option value="Tan">Tan / Fawn</option>
                  <option value="Golden">Golden / Yellow</option>
                  <option value="White">White / Cream</option>
                  <option value="Black">Black / Dark</option>
                  <option value="Brown">Brown / Chocolate</option>
                  <option value="Grey">Grey / Silver</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Ears Shape</label>
                <select
                  value={earType}
                  onChange={(e) => setEarType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--border-color)", color: "white", outline: "none", fontSize: "13px" }}
                >
                  <option value="Pointy">Pointy / Erect</option>
                  <option value="Floppy">Floppy / Folded</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Tail Carriage</label>
                <select
                  value={tailType}
                  onChange={(e) => setTailType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--border-color)", color: "white", outline: "none", fontSize: "13px" }}
                >
                  <option value="Long">Long / Curved</option>
                  <option value="Short">Short / Docked</option>
                  <option value="Curled">Curled / Ring</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            className="btn-primary"
            style={{ width: "100%", marginTop: "10px" }}
          >
            Apply & Calibrate Specs
          </button>
        </div>
      )}

      {/* STEP 3: SENSORS CALIBRATION */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", textAlign: "center", marginTop: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", color: "white", marginBottom: "8px" }}>Hardware Check</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Initializing optical pose tracking and acoustic sensors.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "20px 0" }}>
            {/* Camera Check */}
            <div className="glass-panel" style={{
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderLeft: camStatus === "success" ? "4px solid var(--green-neon)" : "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left" }}>
                <span style={{ fontSize: "24px" }}>📷</span>
                <div>
                  <h4 style={{ fontSize: "14px", color: "white" }}>Optical Lens Mapping</h4>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {camStatus === "pending" && "Idle"}
                    {camStatus === "scanning" && "Opening camera viewport..."}
                    {camStatus === "success" && "Lens confirmed. 3D Keypoint mesh ready."}
                  </p>
                </div>
              </div>
              <div>
                {camStatus === "scanning" && (
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: "2px solid var(--accent)", borderTopColor: "transparent",
                    animation: "spin 1s linear infinite"
                  }} />
                )}
                {camStatus === "success" && <span style={{ color: "var(--green-neon)", fontWeight: "bold" }}>✓</span>}
              </div>
            </div>

            {/* Mic Check */}
            <div className="glass-panel" style={{
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderLeft: micStatus === "success" ? "4px solid var(--green-neon)" : "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left" }}>
                <span style={{ fontSize: "24px" }}>🎙️</span>
                <div>
                  <h4 style={{ fontSize: "14px", color: "white" }}>Acoustic Audio Deck</h4>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {micStatus === "pending" && "Waiting for camera..."}
                    {micStatus === "scanning" && "Testing decibels and pitch range..."}
                    {micStatus === "success" && "Audio deck validated. Harmonics tracker OK."}
                  </p>
                </div>
              </div>
              <div>
                {micStatus === "scanning" && (
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: "2px solid var(--accent)", borderTopColor: "transparent",
                    animation: "spin 1s linear infinite"
                  }} />
                )}
                {micStatus === "success" && <span style={{ color: "var(--green-neon)", fontWeight: "bold" }}>✓</span>}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(4)}
            className="btn-primary"
            disabled={micStatus !== "success"}
            style={{
              width: "100%",
              opacity: micStatus === "success" ? 1 : 0.6,
              cursor: micStatus === "success" ? "pointer" : "not-allowed"
            }}
          >
            {micStatus === "success" ? "Test Calibration Demo" : "Validating Sensors..."}
          </button>
        </div>
      )}

      {/* STEP 4: INTERACTIVE MOCK SCAN DEMO */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "22px", color: "white", marginBottom: "4px" }}>Simulation Playground</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Test how the AI maps {dogName}'s posture and barks.
            </p>
          </div>

          {/* Interactive Dog Frame */}
          <div className="glass-panel" style={{
            position: "relative",
            width: "100%",
            height: "200px",
            overflow: "hidden",
            borderColor: isDemoScanning ? "var(--teal-neon)" : "var(--border-color)",
            transition: "all 0.3s"
          }}>
            {/* Skeletal tracking simulator overlays */}
            {isDemoScanning && (
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: "radial-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                zIndex: 5,
                pointerEvents: "none"
              }} />
            )}

            {isDemoScanning && (
              <div style={{
                position: "absolute",
                top: `${demoProgress}%`,
                left: 0,
                width: "100%",
                height: "2px",
                background: "linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.8) 50%, rgba(6,182,212,0) 100%)",
                boxShadow: "0 0 10px rgba(6, 182, 212, 0.6)",
                zIndex: 6,
                pointerEvents: "none"
              }} />
            )}

            <ThreeDog
              size={size}
              earType={earType}
              tailType={tailType}
              color={color}
              isPlayingDemo={isDemoScanning || !!demoResult}
              demoMood={demoMood}
            />

            {/* Tracking coordinates HUD overlay */}
            {isDemoScanning && (
              <div style={{
                position: "absolute",
                top: "10px",
                right: "12px",
                fontFamily: "monospace",
                fontSize: "9px",
                color: "var(--teal-neon)",
                lineHeight: "1.3",
                zIndex: 10,
                pointerEvents: "none"
              }}>
                <div>T_WAG: 22.4Hz</div>
                <div>EAR_P: [45.1, 46.8]</div>
                <div>ACC: VAL_AROUSAL</div>
                <div>DECIBEL: 72dB</div>
              </div>
            )}
          </div>

          {/* Trigger controls */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px", textAlign: "center" }}>
              Trigger behavior to scan:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button
                onClick={() => startDemoTranslation("happy")}
                disabled={isDemoScanning}
                style={{
                  padding: "10px 4px", fontSize: "12px", borderRadius: "8px", cursor: "pointer",
                  background: demoMood === "happy" && demoResult ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${demoMood === "happy" && demoResult ? "var(--green-neon)" : "var(--border-color)"}`,
                  color: demoMood === "happy" && demoResult ? "var(--green-neon)" : "white",
                  outline: "none", transition: "all 0.2s"
                }}
              >
                🐕 Wag & Bark
              </button>
              <button
                onClick={() => startDemoTranslation("alert")}
                disabled={isDemoScanning}
                style={{
                  padding: "10px 4px", fontSize: "12px", borderRadius: "8px", cursor: "pointer",
                  background: demoMood === "alert" && demoResult ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${demoMood === "alert" && demoResult ? "var(--yellow-neon)" : "var(--border-color)"}`,
                  color: demoMood === "alert" && demoResult ? "var(--yellow-neon)" : "white",
                  outline: "none", transition: "all 0.2s"
                }}
              >
                👀 Alert Growl
              </button>
              <button
                onClick={() => startDemoTranslation("scared")}
                disabled={isDemoScanning}
                style={{
                  padding: "10px 4px", fontSize: "12px", borderRadius: "8px", cursor: "pointer",
                  background: demoMood === "scared" && demoResult ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${demoMood === "scared" && demoResult ? "var(--red-neon)" : "var(--border-color)"}`,
                  color: demoMood === "scared" && demoResult ? "var(--red-neon)" : "white",
                  outline: "none", transition: "all 0.2s"
                }}
              >
                🥺 Anxious Whine
              </button>
            </div>
          </div>

          {/* Results Board */}
          {isDemoScanning && (
            <div className="glass-panel animate-slide" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--teal-neon)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700" }}>Running Fusion Layer Mapping</div>
              <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${demoProgress}%`, height: "100%", backgroundColor: "var(--teal-neon)", transition: "width 0.2s" }} />
              </div>
            </div>
          )}

          {demoResult && (
            <div className="glass-panel animate-slide" style={{
              padding: "16px",
              borderColor: "rgba(99, 102, 241, 0.35)",
              boxShadow: "var(--shadow-glow), var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--teal-neon)", textTransform: "uppercase" }}>Translation Analysis</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--green-neon)", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>Confidence: {demoResult.confidence}</span>
              </div>
              
              <h3 style={{ fontSize: "16px", color: "white" }}>{demoResult.intent}</h3>
              
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: "1.4" }}>
                {demoResult.translation}
              </p>
              
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
                <div>📐 <strong>Keypoint Map</strong>: {demoResult.pose}</div>
                <div>🎙️ <strong>Acoustics Map</strong>: {demoResult.vocalization}</div>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(5)}
            className="btn-primary animate-slide"
            disabled={!demoResult || isDemoScanning}
            style={{
              width: "100%",
              marginTop: "8px",
              opacity: demoResult ? 1 : 0.6,
              cursor: demoResult ? "pointer" : "not-allowed"
            }}
          >
            Create Profile & Begin Scanning
          </button>
        </div>
      )}

      {/* STEP 5: AUTHENTICATION ENTRANCE */}
      {step === 5 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "20px", color: "white", marginBottom: "4px" }}>Profile Synced!</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Create an account to register {dogName}'s calibrated model and start scanning.
            </p>
          </div>

          <AuthScreen onLoginSuccess={handleFinishOnboarding} />
        </div>
      )}
    </div>
  );
}
