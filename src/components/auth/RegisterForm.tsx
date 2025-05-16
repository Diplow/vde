import React, { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { api } from "~/commons/trpc/react"; // For tRPC utils if needed for cache invalidation
// import { useRouter } from 'next/navigation'; // If manual redirection is needed

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Optional name field
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const trpcUtils = api.useUtils();
  // const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const signUpData: {
        email: string;
        password: string;
        name?: string;
        callbackURL?: string;
      } = {
        email,
        password,
        // callbackURL: '/map',
      };

      if (name) {
        signUpData.name = name;
      }

      const result = await authClient.signUp.email(signUpData, {
        onSuccess: (ctx) => {
          console.log("Signed up successfully:", ctx.data);
          trpcUtils.auth.getSession.invalidate();
          // better-auth might auto-redirect based on callbackURL or server settings.
          // If manual redirect is needed after signup (e.g., to a /check-email page or /login):
          // router.push('/login');
        },
        onError: (ctx) => {
          console.error("Sign up error:", ctx.error);
          setError(
            ctx.error.message || "Failed to register. Please try again.",
          );
        },
        onSettled: () => {
          setIsLoading(false);
        },
      });

      if (result && result.error) {
        // This secondary check might be redundant if onError callback handles it well
        setError(
          result.error.message ||
            "An unexpected error occurred during registration.",
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
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name (Optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="email-register"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <input
          id="email-register"
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
          htmlFor="password-register"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password-register"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
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
          {isLoading ? "Registering..." : "Register"}
        </button>
      </div>
    </form>
  );
}
