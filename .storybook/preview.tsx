import type { Preview } from '@storybook/react-vite';
import tokens from '../dist/json/tokens.json';
import '../dist/css/tokens.css';
import './preview.css';

// Two independent toolbar switches, one per theming axis.
// Options come from the generated tokens.json, so a new file in
// tokens/brand or tokens/mode shows up here automatically.
const preview: Preview = {
  globalTypes: {
    brand: {
      description: 'Brand',
      toolbar: { title: 'Brand', icon: 'paintbrush', items: tokens.axes.brand, dynamicTitle: true },
    },
    mode: {
      description: 'Mode',
      toolbar: { title: 'Mode', icon: 'mirror', items: tokens.axes.mode, dynamicTitle: true },
    },
  },
  initialGlobals: { brand: tokens.defaults.brand, mode: tokens.defaults.mode },
  decorators: [
    (Story, context) => {
      // Both attributes on <html>, so brand and mode resolve on the same element.
      const root = document.documentElement;
      root.dataset.brand = context.globals.brand;
      root.dataset.mode = context.globals.mode;
      return <Story />;
    },
  ],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
  },
};

export default preview;
