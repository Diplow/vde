import React, { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { api } from "~/commons/trpc/react"; // For tRPC utils for cache invalidation
// import { useRouter } from "next/navigation"; // No longer needed here

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const trpcUtils = api.useUtils();
  // const router = useRouter(); // No longer needed here
  // Remove userMapQuery initialization as it's not used here anymore
  // const userMapQuery = api.map.getUserMap.useQuery(undefined, {
  // enabled: false,
  // retry: false,
  // });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            // Invalidate session to trigger AuthContext update
            // LoginPage will handle fetching map and redirection
            trpcUtils.auth.getSession.invalidate();
          },
          onError: (ctx) => {
            console.error("Sign in error callback:", ctx.error);
            setError(
              ctx.error.message ||
                "Failed to login. Please check your credentials.",
            );
          },
        },
      );

      // Handle error from authClient.signIn.email if it's returned in the result
      if (result && result.error) {
        setError(
          result.error.message || "An unexpected error occurred during login.",
        );
      } else if (result && !result.error) {
        // Login was successful according to authClient.
        // Auth state will update, and LoginPage will handle next steps.
        // No explicit success message here unless desired, as page will react.
      } else {
        // Fallback if result is not as expected but no error was thrown or caught by onError
        if (!error) {
          // Avoid overwriting a more specific error from onError
          setError("Login process did not complete as expected.");
        }
      }
    } catch (err: any) {
      // Catches errors from authClient.signIn.email itself if it throws
      console.error("handleSubmit main error:", err);
      setError(err.message || "An unexpected server error occurred.");
    } finally {
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
