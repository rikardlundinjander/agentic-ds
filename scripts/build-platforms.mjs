// Builds resolved token files for platforms without a CSS cascade (and for
// JS/SCSS consumers who want plain values). One output per brand x mode:
//
//   dist/js/<brand>-<mode>.js | .d.ts   ES module + types
//   dist/scss/<brand>-<mode>.scss        $variables
//   dist/ios/<Brand><Mode>.swift         Swift class with static lets
//   dist/android/<brand>-<mode>/*.xml    colors.xml, dimens.xml
//   dist/compose/<Brand><Mode>.kt        Kotlin object
//   dist/json/<brand>-<mode>.json        nested, resolved
//
// Only mode + semantic tokens are emitted: that is the public API.
// Primitives and brand palettes are inputs, not something to consume.
// Web with runtime switching should use dist/css/tokens.css instead.
import StyleDictionary from 'style-dictionary';
import {
  PRIMITIVES, SEMANTIC, BRANDS, MODES, nameOf,
} from './layers.mjs';

// Built-in native size transforms assume rem (x16). Our tokens are px, so
// convert px/rem to plain numbers with the right unit per platform.
const toPx = (v) => {
  const n = parseFloat(v);
  return String(v).trim().endsWith('rem') ? n * 16 : n;
};
const isDim = (t) => t.$type === 'dimension';
// Aliases are transformed on the token they point to, so match the primitive
// (font.size.*) as well as the semantic path (text.size.*).
const isText = (t) => isDim(t) && (t.path[0] === 'text' || (t.path[0] === 'font' && t.path[1] === 'size'));
const firstFamily = (v) => (Array.isArray(v) ? v[0] : String(v).split(',')[0].trim());

StyleDictionary.registerTransform({
  name: 'custom/size/swift', type: 'value', filter: isDim,
  transform: (t) => `CGFloat(${toPx(t.$value)})`,
});
StyleDictionary.registerTransform({
  name: 'custom/size/android', type: 'value', filter: isDim,
  transform: (t) => `${toPx(t.$value)}${isText(t) ? 'sp' : 'dp'}`,
});
StyleDictionary.registerTransform({
  name: 'custom/size/compose', type: 'value', filter: isDim,
  transform: (t) => `${toPx(t.$value)}.${isText(t) ? 'sp' : 'dp'}`,
});
// Native apps cannot use a CSS fallback stack: emit the first family as a
// string. The font itself must be bundled with the app.
StyleDictionary.registerTransform({
  name: 'custom/font/native', type: 'value', filter: (t) => t.$type === 'fontFamily',
  transform: (t) => JSON.stringify(firstFamily(t.$value)),
});

const pascal = (s) => s.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  .map((p) => p[0].toUpperCase() + p.slice(1)).join('');

const publicTokens = (modeFile) => (token) =>
  token.filePath.endsWith(modeFile) || SEMANTIC.some((f) => token.filePath.endsWith(f));

let count = 0;
for (const brand of BRANDS) {
  for (const mode of MODES) {
    const slug = `${nameOf(brand)}-${nameOf(mode)}`;
    const cls = `${pascal(nameOf(brand))}${pascal(nameOf(mode))}`;
    const filter = publicTokens(mode);

    const sd = new StyleDictionary({
      source: [...PRIMITIVES, brand, mode, ...SEMANTIC],
      log: { verbosity: 'silent', warnings: 'disabled' },
      platforms: {
        js: {
          transformGroup: 'js',
          buildPath: 'dist/js/',
          files: [
            { destination: `${slug}.js`, format: 'javascript/es6', filter },
            { destination: `${slug}.d.ts`, format: 'typescript/es6-declarations', filter },
          ],
        },
        json: {
          transformGroup: 'js',
          buildPath: 'dist/json/',
          files: [{ destination: `${slug}.json`, format: 'json/nested', filter }],
        },
        scss: {
          transformGroup: 'scss',
          buildPath: 'dist/scss/',
          files: [{
            destination: `${slug}.scss`,
            format: 'scss/variables',
            filter,
            options: { showFileHeader: false },
          }],
        },
        ios: {
          transforms: ['attribute/cti', 'name/camel', 'color/UIColorSwift', 'custom/size/swift', 'custom/font/native'],
          buildPath: 'dist/ios/',
          files: [{
            destination: `${cls}.swift`,
            format: 'ios-swift/class.swift',
            options: { className: cls },
            filter,
          }],
        },
        android: {
          transforms: ['attribute/cti', 'name/snake', 'color/hex8android', 'custom/size/android'],
          buildPath: `dist/android/${slug}/`,
          files: [
            { destination: 'colors.xml', format: 'android/colors', filter: (t) => filter(t) && t.$type === 'color' },
            { destination: 'dimens.xml', format: 'android/dimens', filter: (t) => filter(t) && t.$type === 'dimension' },
          ],
        },
        compose: {
          transforms: ['attribute/cti', 'name/camel', 'color/composeColor', 'custom/size/compose', 'custom/font/native'],
          buildPath: 'dist/compose/',
          files: [{
            destination: `${cls}.kt`,
            format: 'compose/object',
            options: { className: cls, packageName: 'agenticds.tokens' },
            filter,
          }],
        },
      },
    });
    await sd.buildAllPlatforms();
    count += 1;
  }
}

console.log(`Built platform outputs for ${count} brand x mode combinations -> dist/{js,json,scss,ios,android,compose}`);
