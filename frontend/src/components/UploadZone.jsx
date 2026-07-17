import React, { useState, useRef } from "react";
import bannerImg from "../assets/banner.png";
import api from "../services/api";
import BreedSelector from "./BreedSelector";

export function UploadZone({ onUploadStart, onUploadComplete }) {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [breed, setBreed] = useState("Unknown");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile && !audioFile) {
      alert("Please upload at least one video or audio file.");
      return;
    }

    setLoading(true);
    setUploadPercent(10);
    onUploadStart();

    try {
      const interval = setInterval(() => {
        setUploadPercent((prev) => {
          if (prev >= 80) { clearInterval(interval); return 80; }
          return prev + 20;
        });
      }, 300);

      // Upload real files via api service (tries backend, falls back to local URL)
      let videoUrl = null;
      let audioUrl = null;

      if (videoFile) {
        const result = await api.uploadFile(videoFile);
        videoUrl = result.url;
      }
      if (audioFile) {
        const result = await api.uploadFile(audioFile);
        audioUrl = result.url;
      }

      clearInterval(interval);
      setUploadPercent(100);
      onUploadComplete(videoUrl, audioUrl, { breed, age: age ? parseInt(age) : null });
    } catch (err) {
      alert(err.message || "Upload process failed.");
    } finally {
      setLoading(false);
      setUploadPercent(0);
    }
  };

  // Helper shortcuts for testing behaviors
  const handleQuickTest = (type) => {
    setLoading(true);
    onUploadStart();
    setTimeout(() => {
      let videoUrl = null;
      let audioUrl = null;
      if (type === "happy") {
        videoUrl = "https://mock.storage/uploads/happy_dog_play_bow.mp4";
        audioUrl = "https://mock.storage/uploads/happy_dog_bark.wav";
      } else if (type === "angry") {
        videoUrl = "https://mock.storage/uploads/stiff_dog_warning.mp4";
        audioUrl = "https://mock.storage/uploads/growling_dog.wav";
      } else if (type === "scared") {
        videoUrl = "https://mock.storage/uploads/scared_cowering_dog.mp4";
        audioUrl = "https://mock.storage/uploads/whining_dog.wav";
      } else {
        videoUrl = "https://mock.storage/uploads/relaxed_dog_lounge.mp4";
        audioUrl = "https://mock.storage/uploads/silent_breathing.wav";
      }
      onUploadComplete(videoUrl, audioUrl, { breed: breed || "Golden Retriever", age: age ? parseInt(age) : 3 });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ width: "100%", height: "220px", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "4px" }}>
        <img src={bannerImg} alt="Talking Dog Banner" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
      </div>
      <div>
        <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Upload Dog Clip</h3>

        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Upload a video showing posture/tail movements, or a clear audio recording of vocalizations.
        </p>
      </div>

      <form onSubmit={handlePredictSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Upload grids */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* Video Dropzone */}
          <div 
            onClick={() => videoInputRef.current?.click()}
            style={{
              border: `2px dashed ${videoFile ? "var(--accent)" : "var(--border-color)"}`,
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "rgba(0,0,0,0.15)",
              transition: "all 0.2s ease"
            }}
          >
            <input 
              type="file" 
              ref={videoInputRef} 
              onChange={handleVideoChange} 
              accept="video/*" 
              style={{ display: "none" }} 
            />
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📹</span>
            <span style={{ fontSize: "14px", fontWeight: "600", display: "block" }}>
              {videoFile ? "Video Selected" : "Upload Video"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              {videoFile ? videoFile.name : "Formats: MP4, MOV"}
            </span>
          </div>

          {/* Audio Dropzone */}
          <div 
            onClick={() => audioInputRef.current?.click()}
            style={{
              border: `2px dashed ${audioFile ? "var(--accent)" : "var(--border-color)"}`,
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "rgba(0,0,0,0.15)",
              transition: "all 0.2s ease"
            }}
          >
            <input 
              type="file" 
              ref={audioInputRef} 
              onChange={handleAudioChange} 
              accept="audio/*" 
              style={{ display: "none" }} 
            />
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>🎙️</span>
            <span style={{ fontSize: "14px", fontWeight: "600", display: "block" }}>
              {audioFile ? "Audio Selected" : "Upload Audio"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              {audioFile ? audioFile.name : "Formats: WAV, MP3"}
            </span>
          </div>
        </div>

        {/* Metadata section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase" }}>Dog Breed</label>
            <BreedSelector
              value={breed}
              onChange={(name) => setBreed(name)}
              placeholder="Search 400+ breeds..."
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase" }}>Dog Age (Years)</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              placeholder="e.g. 2"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none", fontSize: "13px" }}
            />
          </div>
        </div>

        {loading && uploadPercent > 0 && (
          <div style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", height: "8px", overflow: "hidden", marginTop: "10px" }}>
            <div style={{ width: `${uploadPercent}%`, backgroundColor: "var(--accent)", height: "100%", transition: "width 0.3s ease" }}></div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading || (!videoFile && !audioFile)}
          style={{ width: "100%", padding: "14px" }}
        >
          {loading ? "Uploading & Classifying..." : "Start Intent Translation"}
        </button>
      </form>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: "500" }}>
          ⚡ Quick Simulation Tools (Preset Behaviors)
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { label: "Active/Playful Dog", type: "happy", icon: "🎾" },
            { label: "Alert/Warning Dog", type: "angry", icon: "⚠️" },
            { label: "Anxious/Scared Dog", type: "scared", icon: "🥺" },
            { label: "Relaxed/Neutral Dog", type: "relaxed", icon: "💤" }
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleQuickTest(item.type)}
              className="btn-secondary"
              disabled={loading}
              style={{ fontSize: "12px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UploadZone;
