import type React from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';

// Custom render function that includes providers
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, {
    ...options,
  });
}

// Re-export everything
export * from '@testing-library/react';

// Override render export
export { customRender as render };