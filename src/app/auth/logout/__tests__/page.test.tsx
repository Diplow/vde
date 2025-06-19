import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LogoutPage from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock authClient
vi.mock("~/lib/auth/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock tRPC
let mockMutate: any;
vi.mock("~/commons/trpc/react", () => ({
  api: {
    auth: {
      logout: {
        useMutation: (options: any) => {
          mockMutate = vi.fn(() => {
            // Store options to call them in tests
            if (window.__testOptions) {
              window.__testOptions = options;
            }
          });
          return { mutate: mockMutate };
        },
      },
    },
  },
}));

// Add type for window
declare global {
  interface Window {
    __testOptions?: any;
  }
}

describe("LogoutPage", () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate = undefined;
    window.__testOptions = undefined;
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders loading state", () => {
    render(<LogoutPage />);
    
    expect(screen.getByText("Logging out...")).toBeInTheDocument();
    expect(screen.getByText("Please wait while we sign you out.")).toBeInTheDocument();
  });

  it("calls logout mutation on mount", () => {
    render(<LogoutPage />);
    
    // Check that mutate was called
    expect(mockMutate).toBeDefined();
    expect(mockMutate).toHaveBeenCalled();
  });

  it("shows loading spinner", () => {
    const { container } = render(<LogoutPage />);
    
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
    expect(spinner?.classList.contains("border-indigo-600")).toBe(true);
  });

  // Note: Testing redirect behavior would require more complex setup
  // with React Testing Library's async utilities and proper hook mocking
});