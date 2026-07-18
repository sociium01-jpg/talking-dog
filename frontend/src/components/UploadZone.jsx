// ==============================================================================
// UploadZone.jsx — Upload video/audio for dog behavior analysis
// Sends real file bytes to Gemini Flash Vision via backend for interpretation.
// ==============================================================================
import React, { useState, useRef } from "react";
import api from "../services/api";
import BreedSelector from "./BreedSelector";

export function UploadZone({ onUploadStart, onUploadComplete }) {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [breed, setBreed] = useState(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("dog_profile") || "{}");
      return profile.breed || "";
    } catch { return ""; }
  });
  const [age, setAge] = useState(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("dog_profile") || "{}");
      return profile.age || "";
    } catch { return ""; }
  });
  const [loading, setLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [dragOver, setDragOver] = useState(null);

  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) setVideoFile(e.target.files[0]);
  };
  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) setAudioFile(e.target.files[0]);
  };

  const handleDrop = (type, e) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (type === "video" && file.type.startsWith("video/")) setVideoFile(file);
    if (type === "audio" && file.type.startsWith("audio/")) setAudioFile(file);
  };

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile && !audioFile) {
      alert("Please upload at least one video or audio file.");
      return;
    }

    setLoading(true);
    setUploadPercent(0);
    onUploadStart();

    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 8, 85);
      setUploadPercent(progress);
    }, 300);

    try {
      // Send actual file bytes directly to Gemini Flash Vision via backend
      const result = await api.predictIntent(videoFile, audioFile, {
        breed: breed || "Unknown",
        age: age ? parseInt(age) : null,
      });

      clearInterval(progressInterval);
      setUploadPercent(100);

      // Save to local history
      api.saveToLocalHistory(result, { breed: breed || "Unknown" });

      // Pass result to parent (shows ResultsPanel)
      onUploadComplete(result);
    } catch (err) {
      clearInterval(progressInterval);
      alert(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadPercent(0), 800);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    backgroundColor: "rgba(0,0,0,0.2)",
    border: "1px solid var(--border-color)",
    color: "var(--text-main)",
    outline: "none",
    fontSize: "13px"
  };

  const dropZoneStyle = (file, over) => ({
    border: `2px dashed ${file ? "var(--accent)" : over ? "var(--teal-neon)" : "var(--border-color)"}`,
    borderRadius: "12px",
    padding: "20px 16px",
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: file ? "rgba(99,102,241,0.06)" : over ? "rgba(6,182,212,0.05)" : "rgba(0,0,0,0.15)",
    transition: "all 0.2s ease"
  });

  return (
    <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div>
        <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>🐕 Analyze Dog Behavior</h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
          Upload a video clip of your dog or a bark/growl recording. Our AI will translate their body language and sounds into plain English.
        </p>
      </div>

      <form onSubmit={handlePredictSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Drop zones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          {/* Video */}
          <div
            onClick={() => videoInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver("video"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop("video", e)}
            style={dropZoneStyle(videoFile, dragOver === "video")}
          >
            <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/*" style={{ display: "none" }} />
            <span style={{ fontSize: "26px", display: "block", marginBottom: "6px" }}>📹</span>
            <span style={{ fontSize: "13px", fontWeight: "600", display: "block" }}>
              {videoFile ? "✓ Video Ready" : "Upload Video"}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
              {videoFile ? videoFile.name.slice(0, 22) + (videoFile.name.length > 22 ? "…" : "") : "MP4, MOV, WEBM"}
            </span>
          </div>

          {/* Audio */}
          <div
            onClick={() => audioInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver("audio"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop("audio", e)}
            style={dropZoneStyle(audioFile, dragOver === "audio")}
          >
            <input type="file" ref={audioInputRef} onChange={handleAudioChange} accept="audio/*" style={{ display: "none" }} />
            <span style={{ fontSize: "26px", display: "block", marginBottom: "6px" }}>🎙️</span>
            <span style={{ fontSize: "13px", fontWeight: "600", display: "block" }}>
              {audioFile ? "✓ Audio Ready" : "Upload Audio"}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
              {audioFile ? audioFile.name.slice(0, 22) + (audioFile.name.length > 22 ? "…" : "") : "WAV, MP3, M4A"}
            </span>
          </div>
        </div>

        {/* Dog details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase" }}>
              Breed <span style={{ opacity: 0.5 }}>(optional)</span>
            </label>
            <BreedSelector
              value={breed}
              onChange={(name) => setBreed(name)}
              placeholder="Search breeds..."
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase" }}>
              Age in Years <span style={{ opacity: 0.5 }}>(optional)</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 3"
              min="0" max="25"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Progress bar */}
        {loading && uploadPercent > 0 && (
          <div style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
            <div style={{
              width: `${uploadPercent}%`,
              background: "var(--accent-gradient)",
              height: "100%",
              transition: "width 0.3s ease",
              borderRadius: "10px"
            }} />
          </div>
        )}

        {loading && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
            {uploadPercent < 50 ? "Uploading media..." : uploadPercent < 90 ? "Gemini is analyzing your dog..." : "Generating translation..."}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || (!videoFile && !audioFile)}
          style={{ width: "100%", padding: "14px", fontSize: "15px" }}
        >
          {loading ? "Analyzing…" : "🔍 Translate Dog Behavior"}
        </button>
      </form>
    </div>
  );
}

export default UploadZone;
