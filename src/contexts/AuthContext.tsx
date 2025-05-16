import React, { createContext, useContext, ReactNode } from "react";
import { authClient } from "~/lib/auth/auth-client"; // Your auth client
// import { api } from '~/commons/trpc/react'; // Your tRPC API client for logout mutation if needed via tRPC

// Define User type based on what better-auth session returns
// This should align with better-auth's User type or the user object shape it provides.
interface User {
  id: string; // or number, adjust based on better-auth's actual user ID type
  email: string;
  name?: string | null; // better-auth might type name as string | null
  image?: string | null; // better-auth might type image as string | null
  // Potentially other fields from better-auth session user object like emailVerified, etc.
  // emailVerified: boolean;
}

interface AuthContextType {
  user: User | null | undefined; // undefined during loading, null if not logged in
  isLoading: boolean;
  // Optional: A function to explicitly trigger re-fetching session or handling logout
  // if more complex logic than just invalidating tRPC query is needed client-side.
  // signOut?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // useSession from better-auth client provides the session state.
  const { data: sessionInfo, isPending, error } = authClient.useSession();

  // Log errors if any during session fetching
  if (error) {
    console.error("Error fetching session for AuthProvider:", error);
  }

  // The user object is typically at sessionInfo.user
  const user = sessionInfo?.user as User | null | undefined;

  return (
    <AuthContext.Provider value={{ user, isLoading: isPending }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
