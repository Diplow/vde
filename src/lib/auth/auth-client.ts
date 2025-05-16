import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  /**
   * The base URL of the auth server.
   * This should match the BETTER_AUTH_URL environment variable used in the backend.
   * It's optional if the auth server is on the same domain as the client.
   * However, explicitly setting it is good practice.
   */
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000",
  // Client-side configuration if any based on better-auth documentation.
  // For example, if your backend is hosted on a different URL:
  // serverUrl: process.env.NEXT_PUBLIC_AUTH_SERVER_URL,
});

// Note: We use `process.env.NEXT_PUBLIC_BETTER_AUTH_URL` for the client-side baseURL.
// You'll need to ensure this environment variable is available to the client
// (prefixed with NEXT_PUBLIC_). If BETTER_AUTH_URL is already set in .env,
// you can create a corresponding NEXT_PUBLIC_BETTER_AUTH_URL or use NEXT_PUBLIC_VERCEL_URL if applicable.
// For local development, defaulting to "http://localhost:3000" is a fallback.
