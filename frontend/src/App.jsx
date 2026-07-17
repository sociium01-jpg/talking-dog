import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AuthScreen from "./components/AuthScreen";
import UploadZone from "./components/UploadZone";
import ResultsPanel from "./components/ResultsPanel";
import HistoryList from "./components/HistoryList";
import BillingPortal from "./components/BillingPortal";
import LiveCapture from "./components/LiveCapture";
import api from "./services/api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [predictionResults, setPredictionResults] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  useEffect(() => {
    // Check local storage for active session
    const activeUser = localStorage.getItem("user_profile");
    const activeToken = localStorage.getItem("auth_token");
    if (activeUser && activeToken) {
      setUser(JSON.parse(activeUser));
    }
  }, []);

  const handleLoginSuccess = (profile) => {
    setUser(profile);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setPredictionResults(null);
  };

  const handleUploadStart = () => {
    setPredictionResults(null);
    setPredictLoading(true);
  };

  const handleUploadComplete = async (videoUrl, audioUrl, metadata) => {
    try {
      const response = await api.predictIntent(videoUrl, audioUrl, metadata);
      setPredictionResults(response);
      // Save to local history so the History tab always shows results
      api.saveToLocalHistory(response, metadata);
    } catch (err) {
      setPredictionResults({
        _error: true,
        fusion_narrative: `Something went wrong: ${err.message}. Please try again.`,
        confidence: 0,
        pose_results: {},
        audio_results: {},
      });
    } finally {
      setPredictLoading(false);
    }
  };

  const handleBillingUpdate = (updatedProfile) => {
    setUser(updatedProfile);
  };

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="page-container">
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <UploadZone
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
            />
            
            {(predictLoading || predictionResults) && (
              <ResultsPanel
                results={predictionResults}
                loading={predictLoading}
              />
            )}
          </div>
        )}

        {activeTab === "live" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <LiveCapture
              onResult={(result) => {
                setPredictionResults(result);
                setActiveTab("dashboard");
              }}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <HistoryList
              onSelectResult={(item) => {
                setPredictionResults(item);
                setActiveTab("dashboard");
              }}
            />
          </div>
        )}

        {activeTab === "billing" && (
          <BillingPortal
            user={user}
            onBillingUpdate={handleBillingUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
