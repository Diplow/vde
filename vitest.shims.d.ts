/// <reference types="@vitest/browser/providers/playwright" />

// View Transition API declarations
declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => {
      finished: Promise<void>;
      ready: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
}

export {};
