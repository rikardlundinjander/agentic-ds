// Shared definition of the token layers and the two theming axes.
// Adding a brand or a mode = adding a JSON file in tokens/brand or tokens/mode.
import { readdirSync } from 'node:fs';
import { basename } from 'node:path';

const list = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => `${dir}/${f}`);

export const PRIMITIVES = list('tokens/primitives');
export const SEMANTIC = list('tokens/semantic');
export const BRANDS = list('tokens/brand');
export const MODES = list('tokens/mode');

// Defaults are applied when no data-brand / data-mode attribute is set.
// Brand: first file alphabetically. Mode: light.json if it exists.
export const DEFAULT_BRAND = BRANDS[0];
export const DEFAULT_MODE = MODES.find((m) => m.endsWith('/light.json')) ?? MODES[0];

export const nameOf = (file) => basename(file, '.json');

// Which layers each layer is allowed to reference.
// Components may only use tokens from `mode` and `semantic`.
export const RULES = {
  primitives: [],
  brand: ['primitives'],
  mode: ['brand'],
  semantic: ['primitives', 'brand'],
};

export const COMPONENT_LAYERS = ['mode', 'semantic'];
