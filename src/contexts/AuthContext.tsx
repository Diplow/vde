"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
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

interface SessionState {
  data: { user: User | null; session: any | null } | null;
  isPending: boolean;
  error: any | null; // You might want to type this error more specifically if possible
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state with the current synchronous value from the Atom
  const [authState, setAuthState] = useState<SessionState>(() =>
    authClient.useSession.get(),
  );

  useEffect(() => {
    // Define the callback to update React state when the Atom changes
    const handleAuthChange = (newState: SessionState) => {
      setAuthState(newState);
      // console.log("Auth state updated via subscribe:", newState);
    };

    // Subscribe to the Atom
    const unsubscribe = authClient.useSession.subscribe(handleAuthChange);

    // It's good practice to re-fetch/re-set the state immediately after subscribing
    // in case the Atom updated between the initial .get() and the .subscribe() call.
    // This ensures the component has the latest state.
    setAuthState(authClient.useSession.get());

    // Return the unsubscribe function to be called on component unmount
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and unmount

  // Log errors if any during session fetching
  if (authState.error) {
    console.error("Error fetching session for AuthProvider:", authState.error);
  }

  // The user object is typically at authState.data.user
  const user = authState.data?.user as User | null | undefined;
  const isLoading = authState.isPending;

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
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
