import React, { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { api } from "~/commons/trpc/react"; // For tRPC utils if needed for cache invalidation
import { useRouter } from "next/navigation"; // If manual redirection is needed
import { StaticRegisterForm } from "./register-form.static";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Optional name field
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const trpcUtils = api.useUtils();
  const router = useRouter();
  const createMapMutation =
    api.map.createDefaultMapForCurrentUser.useMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const signUpData: {
        email: string;
        password: string;
        name: string;
        callbackURL?: string;
      } = {
        email,
        password,
        name: name || "",
        // callbackURL: '/map',
      };

      await authClient.signUp.email(signUpData, {
        onSuccess: async (ctx) => {
          try {
            await trpcUtils.auth.getSession.invalidate();

            const mapCreationResult = await createMapMutation.mutateAsync();

            if (mapCreationResult.success && mapCreationResult.mapId) {
              router.push(`/map/${mapCreationResult.mapId}`);
            } else {
              console.error(
                "Map creation failed after signup:",
                mapCreationResult.success === false
                  ? mapCreationResult.error
                  : "Unknown error",
              );
              setError(
                (mapCreationResult.success === false
                  ? mapCreationResult.error
                  : null) ||
                  "Signup successful, but failed to create your map. Please try logging in or contact support.",
              );
              setIsLoading(false);
            }
          } catch (mutationError: any) {
            console.error(
              "Error during createDefaultMapForCurrentUser mutation:",
              mutationError,
            );
            setError(
              mutationError.message ||
                "An error occurred while setting up your map.",
            );
            setIsLoading(false);
          }
        },
        onError: (ctx) => {
          console.error("Sign up error:", ctx.error);
          setError(
            ctx.error.message || "Failed to register. Please try again.",
          );
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <StaticRegisterForm
      nameValue={name}
      emailValue={email}
      passwordValue={password}
      error={error}
      isLoading={isLoading}
      onNameChange={(e) => setName(e.target.value)}
      onEmailChange={(e) => setEmail(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onSubmit={handleSubmit}
      // formAction can be set here for non-JS fallback
      // e.g., formAction="/api/auth/register-action"
    />
  );
}
