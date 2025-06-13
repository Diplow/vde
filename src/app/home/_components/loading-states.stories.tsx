import type { Meta, StoryObj } from "@storybook/react";
import {
  LoadingState,
  CreatingWorkspaceState,
  RedirectingState,
  FetchingMapState,
} from "./loading-states";

const meta = {
  title: "HomePage/LoadingStates",
  component: LoadingState,
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
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: "Loading...",
  },
};

export const CustomMessage: Story = {
  args: {
    message: "Please wait while we process your request...",
  },
};

export const CreatingWorkspace: Story = {
  render: () => <CreatingWorkspaceState />,
};

export const Redirecting: Story = {
  render: () => <RedirectingState />,
};

export const FetchingMap: Story = {
  render: () => <FetchingMapState />,
};