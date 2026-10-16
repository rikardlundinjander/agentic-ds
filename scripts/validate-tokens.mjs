// Validates the token architecture. Exits with code 1 on any violation.
//
// 1. Every reference resolves to an existing token.
// 2. Layers only reference the layers they are allowed to (see RULES).
// 3. Every file in an axis (brand/*, mode/*) defines exactly the same paths,
//    so any brand can be combined with any mode.
// 4. Token paths are unique across layers (no accidental overrides).
// 5. Component CSS only uses mode and semantic tokens.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRIMITIVES, SEMANTIC, BRANDS, MODES, RULES, COMPONENT_LAYERS, nameOf,
} from './layers.mjs';

const errors = [];
const fail = (msg) => errors.push(msg);

// Collect tokens (objects with $value) from a DTCG file.
function collect(file) {
  const out = [];
  const walk = (node, path) => {
    if (node && typeof node === 'object' && '$value' in node) {
      out.push({ path: path.join('.'), value: node.$value, file });
      return;
    }
    for (const [k, v] of Object.entries(node ?? {})) {
      if (!k.startsWith('$') && typeof v === 'object') walk(v, [...path, k]);
    }
  };
  walk(JSON.parse(readFileSync(file, 'utf8')), []);
  return out;
}

const refsIn = (value) =>
  [...JSON.stringify(value).matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]);

const layers = {
  primitives: PRIMITIVES.flatMap(collect),
  semantic: SEMANTIC.flatMap(collect),
  brand: Object.fromEntries(BRANDS.map((f) => [f, collect(f)])),
  mode: Object.fromEntries(MODES.map((f) => [f, collect(f)])),
};

// Path -> layer lookup (axis layers: paths of the first file, checked for equality below).
const layerOf = new Map();
const register = (tokens, layer) => {
  for (const t of tokens) {
    if (layerOf.has(t.path) && layerOf.get(t.path) !== layer) {
      fail(`Duplicate path "${t.path}" in ${layer} (already defined in ${layerOf.get(t.path)})`);
    } else if (layerOf.has(t.path) && layer !== 'brand' && layer !== 'mode') {
      fail(`Duplicate path "${t.path}" in ${t.file}`);
    }
    layerOf.set(t.path, layer);
  }
};
register(layers.primitives, 'primitives');
register(layers.semantic, 'semantic');
for (const f of BRANDS) register(layers.brand[f], 'brand');
for (const f of MODES) register(layers.mode[f], 'mode');

// Axis consistency.
for (const [axis, files] of [['brand', BRANDS], ['mode', MODES]]) {
  const sets = files.map((f) => new Set(layers[axis][f].map((t) => t.path)));
  const all = new Set(sets.flatMap((s) => [...s]));
  files.forEach((f, i) => {
    for (const p of all) {
      if (!sets[i].has(p)) fail(`${axis}/${nameOf(f)} is missing "${p}" (defined in another ${axis})`);
    }
  });
}

// Reference rules.
const check = (tokens, layer) => {
  for (const t of tokens) {
    for (const ref of refsIn(t.value)) {
      const target = layerOf.get(ref);
      if (!target) fail(`${t.file}: "${t.path}" references unknown token {${ref}}`);
      else if (!RULES[layer].includes(target)) {
        fail(`${t.file}: "${t.path}" (${layer}) may not reference ${target} token {${ref}}. Allowed: ${RULES[layer].join(', ') || 'none'}`);
      }
    }
  }
};
check(layers.primitives, 'primitives');
check(layers.semantic, 'semantic');
for (const f of BRANDS) check(layers.brand[f], 'brand');
for (const f of MODES) check(layers.mode[f], 'mode');

// Component CSS: only mode + semantic custom properties.
const cssVar = (path) => `--${path.replace(/\./g, '-')}`;
const varLayer = new Map([...layerOf].map(([p, l]) => [cssVar(p), l]));
const cssFiles = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? cssFiles(p) : p.endsWith('.css') ? [p] : [];
  });
for (const file of cssFiles('src/components')) {
  const css = readFileSync(file, 'utf8');
  for (const [, name] of css.matchAll(/var\((--[\w-]+)/g)) {
    const layer = varLayer.get(name);
    if (layer && !COMPONENT_LAYERS.includes(layer)) {
      fail(`${file}: uses ${name} (${layer} token). Components may only use ${COMPONENT_LAYERS.join(' and ')} tokens.`);
    } else if (!layer) {
      fail(`${file}: uses unknown token ${name}`);
    }
  }
}

if (errors.length) {
  console.error(`Token validation failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`Tokens valid: ${layerOf.size} paths, ${BRANDS.length} brands x ${MODES.length} modes.`);
