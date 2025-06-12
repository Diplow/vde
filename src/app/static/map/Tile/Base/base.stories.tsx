import type { Meta, StoryObj } from "@storybook/react";
import { StaticBaseTileLayout } from "./base";
import React from "react";
import "~/styles/globals.css";

const meta: Meta<typeof StaticBaseTileLayout> = {
  title: "Map/Tile/StaticBaseTileLayout",
  component: StaticBaseTileLayout,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `StaticBaseTileLayout renders the fundamental hexagonal shape for map tiles. It handles scaling, colors, strokes, and can contain any child content. The color prop uses a structured object with color and tint properties for consistent theming.`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    coordId: { control: "text" },
    scale: { control: { type: "range", min: -2, max: 6, step: 1 } },
    color: {
      control: false, // Disable control for complex object
      description:
        "Color object with 'color' and 'tint' properties (e.g., { color: 'zinc', tint: '300' })",
    },
    stroke: {
      control: false, // Disable control for complex object
      description: "Stroke object with 'color' and 'width' properties",
    },
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
    isFocusable: { control: "boolean" },
    baseHexSize: { control: { type: "range", min: 30, max: 100, step: 5 } },
    _shallow: { control: "boolean" },
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
    baseHexSize: 50,
  },
  parameters: {
    docs: {
      description: {
        story: "Basic hexagonal tile with zinc-300 color and default settings.",
      },
    },
  },
};

// Story with different color
export const AmberColor: Story = {
  args: {
    ...Default.args,
    color: { color: "amber", tint: "500" },
    children: "Amber",
  },
  parameters: {
    docs: {
      description: {
        story: "Hexagonal tile with amber-500 color showing color variation.",
      },
    },
  },
};

// Story with different scale
export const LargeScale: Story = {
  args: {
    ...Default.args,
    scale: 2,
    children: "Scale 2",
  },
  parameters: {
    docs: {
      description: {
        story: "Larger hexagonal tile at scale 2 showing size scaling.",
      },
    },
  },
};

// Story with stroke
export const WithStroke: Story = {
  args: {
    ...Default.args,
    stroke: { color: "zinc-950", width: 3 },
    children: "Stroke",
  },
  parameters: {
    docs: {
      description: {
        story: "Hexagonal tile with visible stroke border.",
      },
    },
  },
};

// Story with grab cursor
export const GrabCursor: Story = {
  args: {
    ...Default.args,
    cursor: "cursor-grab",
    children: "Grab Me",
  },
  parameters: {
    docs: {
      description: {
        story: "Hexagonal tile with grab cursor for draggable interactions.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: "Hexagonal tile with custom React component content.",
      },
    },
  },
};

// Story demonstrating scale 3
export const MaxScale: Story = {
  args: {
    ...Default.args,
    scale: 3,
    children: "Scale 3",
  },
  parameters: {
    docs: {
      description: {
        story: "Maximum scale hexagonal tile showing largest size.",
      },
    },
  },
};

// Story demonstrating different color and tint
export const FuchsiaColor: Story = {
  args: {
    ...Default.args,
    color: { color: "fuchsia", tint: "700" },
    children: "Fuchsia",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hexagonal tile with fuchsia-700 color showing deep color tints.",
      },
    },
  },
};

// Story demonstrating 'not-allowed' cursor
export const NotAllowed: Story = {
  args: {
    ...Default.args,
    cursor: "cursor-not-allowed",
    children: "Locked",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hexagonal tile with not-allowed cursor for locked interactions.",
      },
    },
  },
};
