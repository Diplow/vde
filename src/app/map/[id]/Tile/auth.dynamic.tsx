"use client";

import React, { useState } from "react";
import { LoginForm } from "~/components/auth/LoginForm";
import { RegisterForm } from "~/components/auth/RegisterForm";

// This component will be dynamically imported
export default function AuthTile() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="mx-auto my-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-center text-2xl font-bold text-gray-800">
          {showLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {showLogin ? "Please login to continue." : "Sign up to get started."}
        </p>
      </div>

      {showLogin ? <LoginForm /> : <RegisterForm />}

      <div className="mt-6 text-center">
        <button
          onClick={() => setShowLogin(!showLogin)}
          className="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none"
        >
          {showLogin
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
