import React, { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { api } from "~/commons/trpc/react"; // For tRPC utils for cache invalidation
import { StaticLoginForm } from "./login-form.static";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const trpcUtils = api.useUtils();

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
    <StaticLoginForm
      emailValue={email}
      passwordValue={password}
      error={error}
      isLoading={isLoading}
      onEmailChange={(e) => setEmail(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onSubmit={handleSubmit}
      formAction="/api/auth/login-action"
    />
  );
}
