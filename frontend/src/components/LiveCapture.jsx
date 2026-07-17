import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api";

const DURATIONS = [5, 10, 15, 30];

export default function LiveCapture({ onResult }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // back camera by default
  const [duration, setDuration] = useState(15);
  const [countdown, setCountdown] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | streaming | recording | uploading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraSupported, setCameraSupported] = useState(true);

  // Start camera stream
  const startStream = useCallback(async () => {
    setErrorMsg("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Audio analyser for level meter
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsStreaming(true);
      setStatus("streaming");
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setErrorMsg("Camera/microphone permission denied. Please allow access and try again.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("No camera or microphone found on this device.");
        setCameraSupported(false);
      } else {
        setErrorMsg(`Could not access camera: ${err.message}`);
      }
      setStatus("error");
    }
  }, [facingMode]);

  // Animate audio level bar
  useEffect(() => {
    const tick = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, (avg / 128) * 100));
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    if (isStreaming) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isStreaming]);

  // Flip camera
  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  // Re-start stream when facingMode changes
  useEffect(() => {
    if (isStreaming) startStream();
  }, [facingMode]); // eslint-disable-line

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = handleRecordingStop;
    recorder.start(100);
    mediaRecorderRef.current = recorder;

    setIsRecording(true);
    setCountdown(duration);
    setStatus("recording");

    // Countdown timer
    let remaining = duration;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        stopRecording();
      }
    }, 1000);
  }, [duration]); // eslint-disable-line

  // Stop recording manually
  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setCountdown(null);
  }, []);

  // Handle recording blob — upload and predict
  const handleRecordingStop = useCallback(async () => {
    setStatus("uploading");
    try {
      const mimeType = chunksRef.current[0]?.type || "video/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], `live_capture_${Date.now()}.${ext}`, { type: mimeType });

      // Upload video file
      const uploadResult = await api.uploadFile(file);
      const videoUrl = uploadResult.url;

      // Run prediction using the uploaded video URL
      const result = await api.predictIntent(videoUrl, null, { source: "live_capture" });
      setStatus("done");
      if (onResult) onResult(result);
    } catch (err) {
      setStatus("error");
      setErrorMsg(`Processing failed: ${err.message}`);
    }
  }, [onResult]);

  // Stop stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 54;
  const dashOffset = countdown != null
    ? circumference * (1 - countdown / duration)
    : circumference;

  return (
    <div className="glass-panel" style={{ padding: "32px", borderRadius: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "linear-gradient(135deg, #f43f5e, #e11d48)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px"
        }}>🎥</div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Live Capture</h2>
          <p style={{ margin: 0, opacity: 0.6, fontSize: "0.85rem" }}>
            Record your dog and get instant translation
          </p>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden",
        background: "#0a0a0a", aspectRatio: "16/9", marginBottom: "20px",
        border: isRecording ? "2px solid #f43f5e" : "2px solid rgba(255,255,255,0.08)"
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover",
            transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
        />

        {/* Recording indicator */}
        {isRecording && (
          <div style={{ position: "absolute", top: "16px", left: "16px",
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(0,0,0,0.6)", borderRadius: "20px",
            padding: "6px 12px", backdropFilter: "blur(8px)"
          }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%",
              background: "#f43f5e", animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f43f5e" }}>REC</span>
          </div>
        )}

        {/* Countdown ring */}
        {isRecording && countdown != null && (
          <div style={{ position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", opacity: 0.9 }}>
            <svg width="120" height="120">
              <circle cx="60" cy="60" r="54" fill="none"
                stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none"
                stroke="#f43f5e" strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center",
                  transition: "stroke-dashoffset 1s linear" }}
              />
              <text x="60" y="68" textAnchor="middle"
                fill="white" fontSize="28" fontWeight="700">{countdown}</text>
            </svg>
          </div>
        )}

        {/* Camera flip button */}
        {isStreaming && (
          <button
            onClick={flipCamera}
            style={{ position: "absolute", top: "16px", right: "16px",
              background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
              width: "40px", height: "40px", cursor: "pointer", fontSize: "18px",
              backdropFilter: "blur(8px)", color: "white", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}
            title="Flip camera"
          >🔄</button>
        )}

        {/* Idle overlay */}
        {!isStreaming && status !== "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "12px", color: "rgba(255,255,255,0.5)"
          }}>
            <div style={{ fontSize: "48px" }}>📷</div>
            <p style={{ margin: 0 }}>Camera not started</p>
          </div>
        )}

        {/* Upload overlay */}
        {status === "uploading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "12px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)"
          }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid rgba(255,255,255,0.2)",
              borderTop: "4px solid #f43f5e", borderRadius: "50%",
              animation: "spin 1s linear infinite" }} />
            <p style={{ margin: 0, color: "white", fontWeight: 600 }}>Analysing your dog...</p>
          </div>
        )}
      </div>

      {/* Audio level meter */}
      {isStreaming && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>🎙 Microphone level</span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              width: `${audioLevel}%`,
              background: audioLevel > 70
                ? "linear-gradient(90deg, #22c55e, #f43f5e)"
                : "linear-gradient(90deg, #22c55e, #84cc16)",
              transition: "width 0.05s ease"
            }} />
          </div>
        </div>
      )}

      {/* Duration selector */}
      {!isRecording && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <span style={{ opacity: 0.6, fontSize: "0.85rem", alignSelf: "center" }}>Duration:</span>
          {DURATIONS.map((d) => (
            <button key={d}
              onClick={() => setDuration(d)}
              style={{
                padding: "6px 14px", borderRadius: "20px", border: "none",
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                background: duration === d
                  ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                  : "rgba(255,255,255,0.08)",
                color: duration === d ? "white" : "rgba(255,255,255,0.7)",
                transition: "all 0.2s"
              }}
            >{d}s</button>
          ))}
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)",
          borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
          color: "#f43f5e", fontSize: "0.9rem"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Success message */}
      {status === "done" && (
        <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
          color: "#22c55e", fontSize: "0.9rem"
        }}>
          ✅ Translation complete! Scroll down to see the results.
        </div>
      )}

      {/* Control buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {!isStreaming ? (
          <button
            onClick={startStream}
            id="start-camera-btn"
            style={{
              flex: 1, padding: "14px 24px", borderRadius: "12px", border: "none",
              cursor: "pointer", fontWeight: 700, fontSize: "1rem",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px"
            }}
          >📷 Start Camera</button>
        ) : !isRecording ? (
          <>
            <button
              onClick={startRecording}
              id="start-recording-btn"
              style={{
                flex: 1, padding: "14px 24px", borderRadius: "12px", border: "none",
                cursor: "pointer", fontWeight: 700, fontSize: "1rem",
                background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                color: "white", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
                animation: "pulse 2s ease-in-out infinite"
              }}
            >🔴 Start Recording ({duration}s)</button>
            <button
              onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setIsStreaming(false); setStatus("idle"); }}
              style={{
                padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                background: "transparent", color: "rgba(255,255,255,0.7)"
              }}
            >✕ Stop Camera</button>
          </>
        ) : (
          <button
            onClick={stopRecording}
            id="stop-recording-btn"
            style={{
              flex: 1, padding: "14px 24px", borderRadius: "12px", border: "none",
              cursor: "pointer", fontWeight: 700, fontSize: "1rem",
              background: "rgba(255,255,255,0.1)",
              color: "white", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px"
            }}
          >⏹ Stop Early</button>
        )}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
