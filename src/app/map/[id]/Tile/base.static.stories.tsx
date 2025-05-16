import type { Meta, StoryObj } from "@storybook/react";
import { StaticBaseTileLayout } from "./base.static";
import React from "react";
import "src/styles/globals.css";

const meta: Meta<typeof StaticBaseTileLayout> = {
  title: "Map/Tile/StaticBaseTileLayout",
  component: StaticBaseTileLayout,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    coordId: { control: "text" },
    scale: { control: { type: "range", min: -2, max: 3, step: 1 } },
    color: { control: "object" },
    stroke: { control: "object" },
    cursor: {
      control: { type: "select" },
      options: [
        "cursor-pointer",
        "cursor-grab",
        "cursor-grabbing",
        "cursor-crosshair",
        "cursor-not-allowed",
        "cursor-zoom-in",
        "cursor-zoom-out",
      ],
    },
    children: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof StaticBaseTileLayout>;

// Base story with default props
export const Default: Story = {
  args: {
    coordId: "0,0",
    scale: 1,
    color: { color: "zinc", tint: "300" },
    stroke: { color: "transparent", width: 1 },
    cursor: "cursor-pointer",
    children: "Default",
  },
};

// Story with different color
export const AmberColor: Story = {
  args: {
    ...Default.args,
    color: { color: "amber", tint: "500" },
    children: "Amber",
  },
};

// Story with different scale
export const LargeScale: Story = {
  args: {
    ...Default.args,
    scale: 2,
    children: "Scale 2",
  },
};

// Story with stroke
export const WithStroke: Story = {
  args: {
    ...Default.args,
    stroke: { color: "zinc-950", width: 3 },
    children: "Stroke",
  },
};

// Story with grab cursor
export const GrabCursor: Story = {
  args: {
    ...Default.args,
    cursor: "cursor-grab",
    children: "Grab Me",
  },
};

// Story with custom children content
export const CustomContent: Story = {
  args: {
    ...Default.args,
    children: (
      <div className="pointer-events-none flex flex-col items-center text-xs">
        <span>Custom</span>
        <strong>Content</strong>
      </div>
    ),
  },
};

// Story demonstrating scale 3
export const MaxScale: Story = {
  args: {
    ...Default.args,
    scale: 3,
    children: "Scale 3",
  },
};

// Story demonstrating different color and tint
export const FuchsiaColor: Story = {
  args: {
    ...Default.args,
    color: { color: "fuchsia", tint: "700" },
    children: "Fuchsia",
  },
};

// Story demonstrating 'not-allowed' cursor
export const NotAllowed: Story = {
  args: {
    ...Default.args,
    cursor: "cursor-not-allowed",
    children: "Locked",
  },
};
