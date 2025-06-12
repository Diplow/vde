import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState, MapCreationError, MapFetchError } from "./error-states";

const meta = {
  title: "HomePage/ErrorStates",
  component: ErrorState,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  },
};

export const WithRetry: Story = {
  args: {
    title: "Connection Error",
    message: "Unable to connect to the server",
    onRetry: () => console.log("Retry clicked"),
  },
};

export const WithTimestamp: Story = {
  args: {
    title: "Critical Error",
    message: "A critical error has occurred",
    showTimestamp: true,
  },
};

export const MapCreationFailed: Story = {
  render: () => (
    <MapCreationError 
      message="Failed to create your workspace. Please contact an administrator for assistance." 
    />
  ),
};

export const MapFetchFailed: Story = {
  render: () => (
    <MapFetchError 
      message="Network error accessing your map data"
      onRetry={() => console.log("Retry map fetch")}
    />
  ),
};

export const GenericMapError: Story = {
  render: () => (
    <MapFetchError 
      message="Failed to retrieve your map details"
      onRetry={() => console.log("Retry map fetch")}
    />
  ),
};