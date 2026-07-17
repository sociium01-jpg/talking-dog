const API_BASE_URL = "https://talkingdog-backend.onrender.com/api/v1";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("auth_token") || "mock-token-developer-bypass";
    this.user = JSON.parse(localStorage.getItem("user_profile")) || {
      id: "test-user-guid-12345",
      email: "developer@example.com",
      full_name: "Developer Bypass User",
      billing_status: "inactive"
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
      ...(this.token ? { "Authorization": `Bearer ${this.token}` } : {})
    };
  }

  async login(email, _password) {
    // For local dev sandbox, we simulate Supabase login
    const fakeToken = `mock-token-${email.split('@')[0]}-${Date.now()}`;
    const fakeUser = {
      id: email === "premium@example.com" ? "premium-user-id" : "test-user-guid-12345",
      email,
      full_name: email.split('@')[0].toUpperCase(),
      billing_status: email === "premium@example.com" ? "active" : "inactive"
    };
    this.setToken(fakeToken);
    this.setUser(fakeUser);
    return { user: fakeUser, token: fakeToken };
  }

  async signup(email, password, fullName) {
    const fakeToken = `mock-token-${email.split('@')[0]}-${Date.now()}`;
    const fakeUser = {
      id: "test-user-guid-12345",
      email,
      full_name: fullName,
      billing_status: "inactive"
    };
    this.setToken(fakeToken);
    this.setUser(fakeUser);
    return { user: fakeUser, token: fakeToken };
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        ...(this.token ? { "Authorization": `Bearer ${this.token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    return response.json();
  }

  async predictIntent(videoUrl, audioUrl, breedMetadata = {}) {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        video_url: videoUrl,
        audio_url: audioUrl,
        metadata: breedMetadata
      })
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.statusText}`);
    }
    return response.json();
  }

  async getHistory() {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: "GET",
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`History fetch failed: ${response.statusText}`);
    }
    return response.json();
  }

  async subscribe(planId) {
    const response = await fetch(`${API_BASE_URL}/billing/subscribe`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ plan_id: planId })
    });

    if (!response.ok) {
      throw new Error(`Subscription creation failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Debug callback to simulate Razorpay payment callback triggers
  async simulateWebhookSuccess(subscriptionId, _orderId) {
    const response = await fetch(`${API_BASE_URL}/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": "dev-sig-bypass"
      },
      body: JSON.stringify({
        event: "subscription.activated",
        payload: {
          subscription: {
            entity: {
              id: subscriptionId,
              notes: {
                user_id: this.user.id
              }
            }
          }
        }
      })
    });
    
    if (response.ok) {
      // Update local profile state
      const updatedUser = { ...this.user, billing_status: "active" };
      this.setUser(updatedUser);
      return updatedUser;
    }
    throw new Error("Simulating webhook activation failed.");
  }
}

export const api = new ApiService();
export default api;
