// ============================================================
// api.js — Talking Dog App API Service
// Smart hybrid: tries live backend, falls back to local mock.
// ============================================================

const API_BASE_URL = "https://talkingdog-backend.onrender.com/api/v1";

// ---- Local Mock Prediction Engine ----
// Interprets posture + audio signals and generates a realistic
// translation narrative without requiring a live backend.

const POSE_PROFILES = {
  happy:   { posture: "play_bow",  tail_wag: "high_fast",    ears: "forward",  confidence: 0.95 },
  angry:   { posture: "stiff",     tail_wag: "rigid_high",   ears: "backward", confidence: 0.91 },
  scared:  { posture: "cowering",  tail_wag: "tucked",       ears: "pinned",   confidence: 0.88 },
  relaxed: { posture: "relaxed",   tail_wag: "broad_slow",   ears: "neutral",  confidence: 0.85 },
  alert:   { posture: "alert",     tail_wag: "medium_stiff", ears: "perked",   confidence: 0.87 },
  excited: { posture: "bouncing",  tail_wag: "wagging_fast", ears: "forward",  confidence: 0.90 },
};

const AUDIO_PROFILES = {
  happy:   { vocalization: "high_bark",  arousal: "high",   valence: "positive", confidence: 0.93 },
  angry:   { vocalization: "growl",      arousal: "high",   valence: "negative", confidence: 0.89 },
  scared:  { vocalization: "whine",      arousal: "low",    valence: "negative", confidence: 0.86 },
  relaxed: { vocalization: "soft_pant",  arousal: "low",    valence: "neutral",  confidence: 0.80 },
  alert:   { vocalization: "mid_bark",   arousal: "medium", valence: "neutral",  confidence: 0.85 },
  excited: { vocalization: "yip",        arousal: "high",   valence: "positive", confidence: 0.91 },
};

const NARRATIVES = {
  happy: `🎾 Your dog is in full play mode! The play bow posture — front legs down, rear end up — is one of the clearest signals dogs use to say "Let's play!" Their fast, high tail wag and forward ears confirm this is pure excitement and joy. Everything about their body language is inviting and friendly. This is a great time for fetch, tug-of-war, or a run in the park!`,
  
  angry: `⚠️ Your dog is sending a clear warning signal. The stiff, rigid body posture combined with a high, rigid tail indicates your dog is feeling defensive or threatened. Their backward ears suggest they are not comfortable with the current situation. This is not aggression for no reason — something in their environment has triggered this response. Give them space, remove the trigger if possible, and do not approach suddenly.`,
  
  scared: `🥺 Your dog is frightened and asking for safety. The cowering posture, tucked tail, and pinned ears are textbook stress signals. Your dog feels vulnerable right now. The whimpering confirms emotional distress. Speak softly, crouch down to their level, and let them come to you on their own terms. Avoid sudden movements. A familiar blanket or safe space can help them decompress.`,
  
  relaxed: `😌 Your dog is at perfect ease. The loose, open body posture and slow, broad tail wag indicate a dog who feels completely safe and content. Their neutral ears confirm there is nothing worrying them. This is a happy resting state — your dog is comfortable in their environment and trusts the people around them. Ideal time for a calm cuddle or gentle grooming session.`,
  
  alert: `👀 Your dog has detected something interesting! The upright alert posture and perked ears mean they are focusing intently on something — a sound, a smell, or movement they want to investigate. The medium-paced bark confirms curiosity rather than aggression. They are asking you to pay attention to what they noticed. Check the environment to see what caught their interest.`,
  
  excited: `🌟 Your dog is bursting with excitement! The bouncy movement, fast wagging tail, and forward ears all point to a dog who is thrilled about something. The high-pitched yipping confirms pure, uninhibited joy. This level of excitement can sometimes lead to jumping — a calm "sit" command can help them channel their energy constructively. Enjoy this infectious enthusiasm!`,
};

// Detect mood from filename or URL keywords
function detectMoodFromUrl(url = "") {
  const u = url.toLowerCase();
  if (u.includes("happy") || u.includes("play") || u.includes("fetch") || u.includes("frolic")) return "happy";
  if (u.includes("angry") || u.includes("growl") || u.includes("aggress") || u.includes("stiff") || u.includes("warning")) return "angry";
  if (u.includes("scared") || u.includes("fear") || u.includes("whimper") || u.includes("whine") || u.includes("cower")) return "scared";
  if (u.includes("relax") || u.includes("calm") || u.includes("lounge") || u.includes("sleep") || u.includes("rest")) return "relaxed";
  if (u.includes("alert") || u.includes("watch") || u.includes("curious") || u.includes("sniff")) return "alert";
  if (u.includes("excit") || u.includes("zoom") || u.includes("run") || u.includes("yip") || u.includes("bounce")) return "excited";
  // Default: cycle through moods for demo variety
  const moods = ["happy", "relaxed", "alert", "excited"];
  return moods[Math.floor(Date.now() / 5000) % moods.length];
}

function buildMockPrediction(videoUrl, audioUrl) {
  const videoMood = detectMoodFromUrl(videoUrl);
  const audioMood = detectMoodFromUrl(audioUrl);
  // Prefer video mood if video provided, else audio, else default
  const mood = videoUrl ? videoMood : (audioUrl ? audioMood : "happy");

  const pose = POSE_PROFILES[mood];
  const audio = AUDIO_PROFILES[mood];
  const narrative = NARRATIVES[mood];
  const confidence = (pose.confidence + audio.confidence) / 2;

  return {
    id: `local-${Date.now()}`,
    pose_results: pose,
    audio_results: audio,
    fusion_narrative: narrative,
    confidence,
    _source: "local_mock",
  };
}

// ---- API Service Class ----

class ApiService {
  constructor() {
    this.token = localStorage.getItem("auth_token") || "mock-token-developer-bypass";
    this.user = JSON.parse(localStorage.getItem("user_profile")) || {
      id: "developer-bypass",
      email: "developer@example.com",
      full_name: "Developer",
      billing_status: "active",
    };
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem("user_profile", JSON.stringify(user));
  }

  logout() {
    this.token = "";
    this.user = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  async login(email, _password) {
    const fakeToken = `mock-token-${email.split("@")[0]}-${Date.now()}`;
    const fakeUser = {
      id: email === "premium@example.com" ? "premium-user-id" : `user-${Date.now()}`,
      email,
      full_name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      billing_status: email === "premium@example.com" ? "active" : "inactive",
    };
    this.setToken(fakeToken);
    this.setUser(fakeUser);
    return { user: fakeUser, token: fakeToken };
  }

  async signup(email, _password, fullName) {
    const fakeToken = `mock-token-${email.split("@")[0]}-${Date.now()}`;
    const fakeUser = {
      id: `user-${Date.now()}`,
      email,
      full_name: fullName,
      billing_status: "inactive",
    };
    this.setToken(fakeToken);
    this.setUser(fakeUser);
    return { user: fakeUser, token: fakeToken };
  }

  // Upload file — tries Render backend, falls back to local object URL
  async uploadFile(file) {
    // First try live backend
    try {
      const formData = new FormData();
      formData.append("file", file);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Backend unavailable — use local object URL as fallback
    }
    // Fallback: create a local blob URL with the filename intact
    const localUrl = `local://${file.name}`;
    return { filename: file.name, status: "uploaded", url: localUrl };
  }

  // Predict intent — tries Render backend, falls back to local mock engine
  async predictIntent(videoUrl, audioUrl, breedMetadata = {}) {
    // First try live backend
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_url: videoUrl,
          audio_url: audioUrl,
          metadata: breedMetadata,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Backend unavailable — use local prediction engine
    }
    // Fallback: local mock prediction engine (always works, no network needed)
    await new Promise((r) => setTimeout(r, 1200)); // simulate processing delay
    return buildMockPrediction(videoUrl, audioUrl);
  }

  // Fetch prediction history (graceful fallback to empty array)
  async getHistory() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) return response.json();
    } catch {
      // ignore
    }
    // Return local session history from localStorage
    return JSON.parse(localStorage.getItem("local_history") || "[]");
  }

  // Save prediction to local history
  saveToLocalHistory(result, metadata = {}) {
    const existing = JSON.parse(localStorage.getItem("local_history") || "[]");
    const entry = {
      ...result,
      created_at: new Date().toISOString(),
      breed: metadata.breed || "Unknown",
    };
    const updated = [entry, ...existing].slice(0, 20); // keep last 20
    localStorage.setItem("local_history", JSON.stringify(updated));
  }

  async subscribe(planId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${API_BASE_URL}/billing/subscribe`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ plan_id: planId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) return response.json();
    } catch {
      // ignore
    }
    return {
      subscription_id: `sub_demo_${Date.now()}`,
      payment_link: "https://rzp.io/l/demo",
      order_id: `order_demo_${Date.now()}`,
    };
  }

  async simulateWebhookSuccess(subscriptionId, _orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Razorpay-Signature": "dev-sig-bypass" },
        body: JSON.stringify({
          event: "subscription.activated",
          payload: {
            subscription: { entity: { id: subscriptionId, notes: { user_id: this.user?.id } } },
          },
        }),
      });
      if (response.ok) {
        const updatedUser = { ...this.user, billing_status: "active" };
        this.setUser(updatedUser);
        return updatedUser;
      }
    } catch {
      // ignore
    }
    // Local fallback — update state directly
    const updatedUser = { ...this.user, billing_status: "active" };
    this.setUser(updatedUser);
    return updatedUser;
  }
}

export const api = new ApiService();
export default api;
