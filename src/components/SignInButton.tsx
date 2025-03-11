"use client";

import {
  useAuth,
  SignInButton as ClerkSignInButton,
  SignOutButton,
} from "@clerk/nextjs";

export function SignInButton() {
  const { isSignedIn } = useAuth();

  return (
    <div className="fixed right-4 top-4 z-50">
      {isSignedIn ? (
        <SignOutButton>
          <button className="rounded-lg bg-slate-700/20 px-4 py-2 font-bold text-slate-50 backdrop-blur-sm transition-colors hover:bg-slate-700/30">
            Sign Out
          </button>
        </SignOutButton>
      ) : (
        <ClerkSignInButton mode="modal">
          <button className="rounded-lg bg-slate-700/20 px-4 py-2 font-bold text-slate-50 backdrop-blur-sm transition-colors hover:bg-slate-700/30">
            Sign In
          </button>
        </ClerkSignInButton>
      )}
    </div>
  );
}
