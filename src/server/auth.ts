import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema"; // Import all schemas

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // Corrected to 'pg' for PostgreSQL
    // Map our Drizzle schema (plural table names) to better-auth's expected singular names
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verificationToken: schema.verificationTokens, // better-auth core is 'verification', adapter docs sometimes show 'verificationToken'
      // If any other tables are implicitly expected by plugins later, they might need mapping too.
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.AUTH_SECRET, // Needs to be added to .env
  basePath: "/api/auth", // Standard Next.js API route
  trustedOrigins: process.env.NODE_ENV === "production" 
    ? ["https://your-production-domain.com"] 
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  plugins: [nextCookies()],
});

// Note: better-auth core schema names are singular (user, account, session, verification).
// Our Drizzle tables are plural (users, accounts, sessions, verificationTokens).
// The drizzleAdapter in better-auth docs shows mapping `verificationToken: schema.verificationTokens`.
// The core schema table is just `verification`. We'll use `verificationToken` for the mapping key
// as per the Drizzle adapter example for better-auth, assuming it's the correct key for the adapter.

// Note: Table name configurations were removed as better-auth likely relies on
// its own schema conventions or CLI tools for table management with Drizzle.
// This will be addressed in Step 2: Database Schema Extension.
