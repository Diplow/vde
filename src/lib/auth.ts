import { betterAuth } from "better-auth";
import { env } from "~/env"; // For accessing environment variables

// Initialize Better Auth
export const auth = betterAuth({
  // Configure Email and Password authentication
  emailAndPassword: {
    enabled: true,
    // autoSignIn: false, // Default is true, uncomment to change
  },

  // Configure Social Providers (example for GitHub)
  // Ensure you have GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file
  // socialProviders: {
  //   github: {
  //     clientId: env.GITHUB_CLIENT_ID, // Add to env.ts and .env if you use GitHub
  //     clientSecret: env.GITHUB_CLIENT_SECRET, // Add to env.ts and .env if you use GitHub
  //     // redirectProxyUrl: env.AUTH_REDIRECT_PROXY_URL, // If needed for Vercel/serverless
  //   },
  //   // Add other providers here as needed, e.g., Google:
  //   // google: {
  //   //   clientId: env.GOOGLE_CLIENT_ID,
  //   //   clientSecret: env.GOOGLE_CLIENT_SECRET,
  //   // },
  // },

  // Database configuration:
  // The better-auth documentation doesn't explicitly show Drizzle adapter setup
  // in the "Basic Usage" section for the main `betterAuth` call.
  // It's possible that:
  // 1. better-auth auto-detects Drizzle via environment variables or installed packages.
  // 2. A specific Drizzle adapter/plugin needs to be passed here (e.g., in a `database` or `adapter` key).
  // 3. The `npx @better-auth/cli generate/migrate` commands handle schema and expect certain env vars for DB connection.
  // For now, I'm omitting explicit DB adapter config here, assuming better-auth handles it
  // through its CLI setup and env vars, or it's configured elsewhere in its plugins/system.
  // If errors occur related to database connectivity, this section might need adjustment
  // based on more detailed database integration docs for better-auth.

  // You might also need to specify the app's base URL for email links, etc.
  // appUrl: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // If better-auth has specific hooks or event listeners:
  // events: {
  //   onUserSignedUp: async (data) => {
  //     console.log("User signed up:", data.user);
  //   },
  //   onSessionCreated: async (data) => {
  //     console.log("Session created for user:", data.session.userId);
  //   }
  // }
});

// Further configuration might involve plugins as shown in the docs:
// import { twoFactor } from "better-auth/plugins";
// export const authWithPlugins = betterAuth({
//   ... (above config)
//   plugins: [
//     twoFactor() // Example two-factor plugin
//   ]
// });
// If using plugins, export the auth instance that includes them.
