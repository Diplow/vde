/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";

describe("DOM Environment Test", () => {
  test("basic React component renders", () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>;

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId("test")).toHaveTextContent("Hello World");
  });

  test("document is available", () => {
    expect(document).toBeDefined();
    expect(document.createElement).toBeDefined();
  });

  test("window is available", () => {
    expect(window).toBeDefined();
    expect(window.document).toBeDefined();
  });
});
