# Authentication System with `better-auth`

## Overview

This document outlines the authentication architecture implemented in this project. Authentication is primarily handled by the `better-auth` library, providing a flexible and robust solution for user management, session handling, and various authentication strategies.

The main goal for implementing authentication was to allow users to own their content within the application.

## Key Library: `better-auth`

`better-auth` was chosen for its comprehensive features, ease of integration with Next.js and tRPC, and its adapter system, particularly for Drizzle ORM. It provides both server-side and client-side utilities to manage the entire authentication lifecycle.

## Architecture Decisions & Implementation

The authentication system is built around `better-auth` and integrates with the existing Next.js, tRPC, and Drizzle stack.

### 1. Server-Side Configuration

- **Main Configuration (`src/server/auth.ts`):** This file initializes `better-auth` for the server.

  - It enables Email and Password authentication.
  - It configures the `drizzleAdapter` to connect `better-auth` with the PostgreSQL database via Drizzle ORM, mapping to our schema (e.g., `users`, `accounts`, `sessions`, `verificationTokens`).
  - An `AUTH_SECRET` environment variable is used for securing sessions.
  - The `basePath` for authentication API routes is set to `/api/auth`.

- **API Routes (`src/app/api/auth/[...all]/route.ts`):**

  - This Next.js dynamic API route exposes the `better-auth` request handlers (`GET`, `POST`). All authentication-related HTTP requests (e.g., login, logout, OAuth callbacks) are processed here. It uses the `auth` instance configured in `src/server/auth.ts`

- **Environment Setup (`src/lib/auth.ts`):**
  - This file also sets up a `betterAuth` instance, primarily configuring email/password auth and the Drizzle adapter. It seems to be the instance used by the Next.js API route handler. Social provider configurations are commented out but can be enabled here.

### 2. Client-Side Configuration

- **Auth Client (`src/lib/auth/auth-client.ts`):**
  - `createAuthClient` from `better-auth/client` is used to initialize the client-side module.
  - The `baseURL` for the auth server is configured, defaulting to the application's domain but explicitly set for clarity and different environments (e.g., Vercel deployments).

### 3. tRPC Integration

- **tRPC Context (`src/server/api/trpc.ts`):**

  - The `createContext` function for tRPC is augmented to include the user's session information.
  - `auth.api.getSession()` (from the `better-auth` instance in `src/server/auth.ts`) is called on every request to retrieve the current session using request headers.
  - The session data (including the `user` object) is then available in `ctx.session` and `ctx.user` within tRPC procedures.

- **Protected Procedures (`src/server/api/trpc.ts`):**

  - A `protectedProcedure` is defined, which checks for the presence of `ctx.session` and `ctx.user`. If a user is not authenticated, a `TRPCError` with code `UNAUTHORIZED` is thrown, effectively protecting backend procedures.

- **Auth Router (`src/server/api/routers/auth.ts`):**
  - This tRPC router provides specific endpoints related to authentication:
    - `login`: Handles user login by calling `auth.api.signInEmail`.
    - `logout`: Handles user logout by calling `auth.api.signOut`.
    - `getSession`: A public procedure to retrieve the current session, primarily for client-side consumption.
    - `register`: Currently throws a `NOT_IMPLEMENTED` error, as registration is intended to be handled client-side via `authClient.signUp.email`.
  - A helper `convertToHeaders` is used to adapt Next.js request headers for `better-auth` API calls.

### 4. Frontend State Management

- **Auth Context (`src/contexts/AuthContext.tsx`):**
  - An `AuthProvider` component wraps the application (or parts of it) to provide authentication state.
  - It uses `authClient.useSession()` from `better-auth/client` to get the current session information (user, loading state).
  - A `useAuth` hook is provided for easy access to the `user` object and `isLoading` state in any component.

### 5. UI Components

- **Login & Registration Forms (`src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`):**

  - These React components provide the user interface for signing in and signing up.
  - They use methods from the `authClient` (`authClient.signIn.email` and `authClient.signUp.email`) to interact with the `better-auth` backend.
  - After successful operations, they typically invalidate the `auth.getSession` tRPC query to refresh the `AuthContext`.

- **Auth Tile (`src/app/map/[id]/Tile/auth.dynamic.tsx`):**

  - A dynamically imported component that hosts the `LoginForm` and `RegisterForm`.
  - It allows users to switch between login and registration views.
  - This tile is likely intended to be displayed prominently when a user is not authenticated.

- **User Navigation (`src/components/layout/UserNav.tsx` - as per plan):**
  - This component would display user information and a logout button.
  - Logout is handled using `authClient.signOut()`.

### 6. Database Integration

- **Drizzle Schema (`src/server/db/schema/`):**
  - `better-auth` requires specific tables for its operation: `users`, `accounts`, `sessions`, and `verificationTokens` (or `verification`).
  - The `drizzleAdapter` in `src/server/auth.ts` maps `better-auth`'s expected schema names (singular) to our actual Drizzle table names (plural, e.g., `schema.users`, `schema.accounts`).
  - Existing tables like `hexMaps` have their `ownerId` field updated to reference the `users.id` table to associate data with authenticated users.

## Authentication Flow

1.  **Registration:**

    - The user fills out the `RegisterForm`.
    - `authClient.signUp.email` is called on the client-side.
    - `better-auth` handles user creation, password hashing, and potentially sends a verification email (depending on configuration).
    - The client's session is updated.

2.  **Login:**

    - The user fills out the `LoginForm`.
    - `authClient.signIn.email` is called on the client-side, which makes a request to the `/api/auth/signin/email` endpoint handled by `better-auth`.
    - Alternatively, the `authRouter.login` tRPC procedure can be used, which internally calls `auth.api.signInEmail`.
    - `better-auth` verifies credentials and creates a session, typically setting HTTP-only cookies.
    - The client's session is updated.

3.  **Session Management:**

    - `better-auth` manages sessions using cookies.
    - On the client, `authClient.useSession()` provides reactive access to the current session state.
    - On the server (tRPC), `auth.api.getSession()` in `createContext` makes the session available.

4.  **Logout:**
    - The user clicks a logout button.
    - `authClient.signOut()` is called on the client-side, which requests `/api/auth/signout`.
    - Alternatively, the `authRouter.logout` tRPC procedure calls `auth.api.signOut`.
    - `better-auth` invalidates the session and clears cookies.
    - The client's session is updated.

## Key Files

- **Core `better-auth` Server Config:** `src/server/auth.ts`
- **Next.js API Handler Config:** `src/lib/auth.ts`
- **`better-auth` Client Config:** `src/lib/auth/auth-client.ts`
- **API Route Handler:** `src/app/api/auth/[...all]/route.ts`
- **tRPC Auth Router:** `src/server/api/routers/auth.ts`
- **tRPC Context Enhancer:** `src/server/api/trpc.ts` (specifically `createContext`)
- **Frontend Auth Provider:** `src/contexts/AuthContext.tsx`
- **UI Forms:** `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`
- **Auth UI Tile:** `src/app/map/[id]/Tile/auth.dynamic.tsx`
- **Database Schema:** `src/server/db/schema/users.ts`, `accounts.ts`, etc.
- **Feature Plan:** `prompts/features/2025-05-16-better-auth.md` (for historical context and planning)

This setup provides a solid foundation for authentication, leveraging `better-auth` for core functionality while integrating smoothly with the project's tRPC and Next.js architecture.
