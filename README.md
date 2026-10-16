# agentic-ds

Proof of concept for a design system with layered tokens and two independent theming axes (brand and mode).

- **Tokens** in JSON, [DTCG format](https://www.designtokens.org/)
- **Style Dictionary** as the translation layer (CSS, SCSS, JS/TS, JSON, Swift, Android XML, Compose)
- **Storybook** for components and token docs, with a brand switch and a mode switch in the toolbar

## Getting started

```bash
npm install
npm run storybook        # validates + builds tokens, then opens Storybook on :6006
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run tokens:validate` | Checks the layer rules (see below) |
| `npm run tokens:build` | Builds every platform output into `dist/` (see below) |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |

## Using it in your projects

The package ships tokens only, so it works with any framework or language. Components in `src/` are Storybook documentation, not part of the package.

```bash
npm install @rikardlundinjander/agentic-ds
```

| Platform | Import / copy | Switching brand and mode |
| --- | --- | --- |
| Web (any framework) | `@rikardlundinjander/agentic-ds/css` | At runtime, `data-brand` and `data-mode` on `<html>` |
| SCSS | `@rikardlundinjander/agentic-ds/scss/brand-x-light` | One file per combination |
| JS / TS | `import * as t from '@rikardlundinjander/agentic-ds/js/brand-x-light'` | One module per combination, with types |
| JSON | `@rikardlundinjander/agentic-ds/json/brand-x-light` (no file extension) | One file per combination |
| iOS | `dist/ios/BrandXLight.swift` | One Swift class per combination |
| Android (XML) | `dist/android/brand-x-light/{colors,dimens}.xml` | Pick the folder at build time |
| Android (Compose) | `dist/compose/BrandXLight.kt` | One Kotlin object per combination |

Only mode and semantic tokens are emitted for non-CSS platforms. Primitives and brand palettes are inputs, not API. Native outputs use the first font in a stack, so the font has to be bundled with the app, and text sizes become `sp` on Android.

### Automatic updates

1. Release: `npm version minor && git push --follow-tags`. The `Publish` workflow builds all outputs and publishes to npm (needs an `NPM_TOKEN` repository secret).
2. In each consuming project, enable Renovate or Dependabot. Copy [renovate.example.json](renovate.example.json) to `renovate.json` as a starting point. A new token version then arrives as a pull request, the project's CI builds against it, and it can auto-merge.

## Token layers

```
tokens/
  primitives/   raw values, no meaning        color.blue.600, space.4, radius.md
  brand/        one file per brand            palette.accent.*, palette.neutral.*, brand.font.family
  mode/         one file per mode             color.bg.action -> {palette.accent.600}
  semantic/     theme-independent intent      space.inset.md, text.size.body, shape.radius.control
```

| Layer | May reference | Used by components |
| --- | --- | --- |
| primitives | nothing | no |
| brand | primitives | no |
| mode | brand (`palette.*`) | **yes** |
| semantic | primitives, brand | **yes** |

Why mode only references `palette.*`: that is what keeps the axes independent. Mode decides *which step* (light uses `accent.600`, dark uses `accent.400`), brand decides *which ramp* (`accent` is blue for brand X, green for brand Y). Any brand works with any mode, and you write N + M files instead of N × M.

## Theming

All brands and modes live in one CSS file. Each has its own selector and references are kept as `var(--...)`, so switching happens at runtime:

```html
<html data-brand="brand-y" data-mode="dark">
```

- Set both attributes on the **same element** (normally `<html>`). Custom properties resolve where they are declared, so a mode set above a brand would not pick up that brand's palette.
- With no attributes, the defaults apply (first brand alphabetically, and `light`).

### Adding a brand or a mode

1. Copy `tokens/brand/brand-x.json` (or `tokens/mode/light.json`) to a new file.
2. Change the values.
3. `npm run storybook`. The new option shows up in the toolbar automatically.

Validation fails if the new file is missing a token the others in the same axis define.

## Validation rules

`scripts/validate-tokens.mjs` fails the build when:

1. A reference points to a token that does not exist.
2. A layer references a layer it is not allowed to (table above).
3. Files in the same axis define different token paths.
4. The same path is defined in two layers.
5. CSS in `src/components` uses a primitive or brand token, or an unknown token.

These run in CI on every push and pull request (`.github/workflows/ci.yml`).

## Not in the PoC yet

- Figma sync (JSON stays the source of truth; Tokens Studio or the Figma Variables API can read from it).
- Component tokens (`button.bg.primary`), only if a real need shows up.
- Visual regression testing (Chromatic or Playwright).
- Publishing `dist/` as an npm package with versioning (Changesets).
