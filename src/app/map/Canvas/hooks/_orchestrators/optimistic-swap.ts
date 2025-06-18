// This file re-exports the refactored optimistic swap implementation
// The implementation has been broken down into focused modules following the Rule of 6

export { performOptimisticSwap } from "./optimistic-swap/index";
export type { OptimisticSwapConfig } from "./optimistic-swap/types";