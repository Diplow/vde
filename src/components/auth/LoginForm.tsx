import React, { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { api } from "~/commons/trpc/react"; // For tRPC utils for cache invalidation
// import { useRouter } from 'next/navigation'; // If manual redirection is needed

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const trpcUtils = api.useUtils();
  // const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email(
        {
          email,
          password,
          // callbackURL: '/map', // Optional redirect after successful login
          // rememberMe: true, // Optional
        },
        {
          onSuccess: (ctx) => {
            console.log("Signed in successfully:", ctx.data);
            // Invalidate session query to update AuthContext or other user state
            trpcUtils.auth.getSession.invalidate();
            // better-auth might auto-redirect based on callbackURL or server settings.
            // router.push('/map'); // Or rely on callbackURL / better-auth default
          },
          onError: (ctx) => {
            console.error("Sign in error:", ctx.error);
            setError(
              ctx.error.message ||
                "Failed to login. Please check your credentials.",
            );
          },
          onSettled: () => {
            setIsLoading(false);
          },
        },
      );

      if (result && result.error) {
        // This secondary check might be redundant if onError callback handles it well
        setError(
          result.error.message || "An unexpected error occurred during login.",
        );
        setIsLoading(false);
      }
      // If direct result handling is needed beyond callbacks:
      // if (result.data) { /* ... */ }
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email-login"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <input
          id="email-login"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="password-login"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password-login"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>
    </form>
  );
}
