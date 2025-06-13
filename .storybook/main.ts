import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test"
  ],
  "framework": {
    "name": "@storybook/experimental-nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  "viteFinal": async (config) => {
    // Fix Vite optimization issues
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include || []),
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@storybook/experimental-nextjs-vite",
        "@storybook/test",
        "next/link",
        "lucide-react",
        "@radix-ui/react-slot",
        "class-variance-authority",
        "clsx",
        "tailwind-merge"
      ],
      exclude: [
        ...(config.optimizeDeps?.exclude || []),
        "util"
      ]
    };
    
    // Fix module externalization
    config.ssr = {
      ...config.ssr,
      noExternal: ["util"]
    };
    
    return config;
  }
};
export default config;