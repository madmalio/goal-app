import { toast } from "react-toastify"; // Optional

// FIX: Change 'localhost' to '127.0.0.1' to prevent IPv6 resolution errors
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8081/api";

export async function fetchFromAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  // 1. Always include credentials (cookies) and merge headers
  const config = {
    ...options,
    credentials: "include" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);

    // 2. Handle "Unauthorized" -> Redirect to Login
    if (res.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/setup") &&
        !window.location.pathname.includes("/join") // Allow Join
      ) {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    // 3. Handle other server errors
    if (!res.ok) {
      const errorBody = await res.text();
      try {
        const jsonError = JSON.parse(errorBody);
        throw new Error(
          jsonError.message || jsonError.error || "API Request Failed"
        );
      } catch (e) {
        throw new Error(errorBody || `API Error: ${res.status}`);
      }
    }

    // 4. Return JSON
    return res.json();
  } catch (err: any) {
    // 5. Handle Network Errors
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      console.error(
        "Network Error: Could not connect to backend at " + API_URL
      );
      throw new Error("Cannot connect to server. Is the backend running?");
    }
    throw err;
  }
}
