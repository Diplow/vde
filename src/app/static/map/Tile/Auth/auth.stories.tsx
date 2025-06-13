import type { Meta, StoryObj } from "@storybook/react";
import { StaticAuthTile } from "./auth";
import React from "react";
import "~/styles/globals.css"; // Ensure global styles are applied
import { fn } from "@storybook/test"; // For action logging
import { StaticLoginForm } from "~/components/auth/login-form.static";
import { StaticRegisterForm } from "~/components/auth/register-form.static";

const meta: Meta<typeof StaticAuthTile> = {
  title: "Map/Tile/StaticAuthTile",
  component: StaticAuthTile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    showLogin: { control: "boolean" },
    onToggleView: { action: "toggledView" }, // Logs the action in Storybook
    loginFormComponent: { control: false }, // Not directly controllable, passed as a node
    registerFormComponent: { control: false }, // Not directly controllable, passed as a node
  },
  args: {
    // Default args for all stories
    onToggleView: fn(),
    loginFormComponent: (
      <StaticLoginForm
        emailValue="test@example.com"
        passwordValue="password"
        isLoading={false}
        onEmailChange={fn()}
        onPasswordChange={fn()}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          fn()(e);
        }}
      />
    ),
    registerFormComponent: (
      <StaticRegisterForm
        nameValue="Test User"
        emailValue="test@example.com"
        passwordValue="password"
        isLoading={false}
        onNameChange={fn()}
        onEmailChange={fn()}
        onPasswordChange={fn()}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          fn()(e);
        }}
      />
    ),
  },
};

export default meta;
type Story = StoryObj<typeof StaticAuthTile>;

export const LoginView: Story = {
  args: {
    showLogin: true,
  },
};

export const RegisterView: Story = {
  args: {
    showLogin: false,
  },
};
