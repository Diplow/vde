#!/usr/bin/env node

/**
 * Wrapper script for YouTube transcript and analysis commands
 *
 * Usage:
 *   pnpm youtube transcript <videoId>
 *   pnpm youtube analyze <videoId>
 *
 * Environment Variables:
 *   - YOUTUBE_API_KEY: Your YouTube Data API v3 key (required)
 *   - MISTRAL_API_KEY: Your Mistral AI API key (required for analysis)
 *
 * Example:
 *   YOUTUBE_API_KEY=your_api_key MISTRAL_API_KEY=your_mistral_key pnpm youtube analyze dQw4w9WgXcQ
 *
 * You can also set these in your .env file or export them in your shell:
 *   export YOUTUBE_API_KEY=your_api_key
 *   export MISTRAL_API_KEY=your_mistral_key
 *
 * Required packages:
 *   - @mistralai/mistralai: For Mistral AI API (install with 'pnpm add @mistralai/mistralai')
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

// Check dependencies
/**
 * Check if all required dependencies and environment variables are available
 * @param {string} command - The command to check dependencies for
 * @returns {boolean} - Whether all dependencies are available
 */
const checkDependency = (command) => {
  if (command === "analyze") {
    try {
      // Check package.json for @mistralai/mistralai
      const packageJsonPath = resolve(process.cwd(), "package.json");
      if (!existsSync(packageJsonPath)) {
        console.error("Error: package.json not found");
        return false;
      }

      const packageJson = JSON.parse(
        execSync(`cat ${packageJsonPath}`).toString(),
      );
      const hasMistral =
        packageJson.dependencies &&
        packageJson.dependencies["@mistralai/mistralai"];

      if (!hasMistral) {
        console.error("Error: @mistralai/mistralai package is not installed");
        console.error("Please run: pnpm add @mistralai/mistralai");
        return false;
      }

      // Check environment variables
      if (!process.env.MISTRAL_API_KEY) {
        console.error("Error: MISTRAL_API_KEY environment variable is not set");
        console.error("Please set it before running the command");
        return false;
      }
    } catch (error) {
      console.error("Error checking dependencies:", error);
      return false;
    }
  }

  // Check YouTube API key for all commands
  if (!process.env.YOUTUBE_API_KEY) {
    console.error("Error: YOUTUBE_API_KEY environment variable is not set");
    console.error("Please set it before running the command");
    return false;
  }

  return true;
};

const args = process.argv.slice(2);
const command = args[0];
const videoId = args[1];

if (!command || !videoId) {
  console.error("Error: Both command and videoId are required");
  console.log("Usage:");
  console.log("  pnpm youtube transcript <videoId>");
  console.log("  pnpm youtube analyze <videoId>");
  process.exit(1);
}

try {
  if (!["transcript", "analyze"].includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.log("Available commands: transcript, analyze");
    process.exit(1);
  }

  // Check dependencies before running commands
  if (!checkDependency(command)) {
    process.exit(1);
  }

  switch (command) {
    case "transcript":
      execSync(`pnpm youtube:transcript ${videoId}`, { stdio: "inherit" });
      break;
    case "analyze":
      execSync(`pnpm youtube:analyze ${videoId}`, { stdio: "inherit" });
      break;
  }
} catch (error) {
  console.error("Command execution failed");
  process.exit(1);
}
