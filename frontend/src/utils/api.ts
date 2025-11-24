const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function fetchFromAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  // 1. Always include credentials (cookies)
  const config = {
    ...options,
    credentials: "include" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const res = await fetch(`${API_URL}${endpoint}`, config);

  // 2. Handle "Unauthorized" -> Redirect to Login
  if (res.status === 401) {
    // Only redirect if we are not already on the login or register page
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login") &&
      !window.location.pathname.includes("/register")
    ) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || "API request failed");
  }

  return res.json();
}
