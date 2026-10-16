import tokens from '../../dist/json/tokens.json';

export type Layer = 'primitives' | 'brand' | 'mode' | 'semantic';

interface Token {
  name: string;
  cssVar: string;
  type: string;
  layer: Layer;
  reference: string | null;
  source: string;
  value: unknown;
}

const all = tokens.tokens as Token[];

// Brand and mode tokens exist once per file; pick the one for the active theme.
function active() {
  const { brand = tokens.defaults.brand, mode = tokens.defaults.mode } = document.documentElement.dataset;
  return (t: Token) =>
    (t.layer !== 'brand' || t.source === brand) && (t.layer !== 'mode' || t.source === mode);
}

function chain(t: Token, isActive: (t: Token) => boolean): string[] {
  const out: string[] = [];
  let ref = t.reference;
  while (ref) {
    out.push(ref);
    const r = ref;
    ref = all.find((x) => x.name === r && isActive(x))?.reference ?? null;
  }
  return out;
}

const computed = (cssVar: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();

function Preview({ t, value }: { t: Token; value: string }) {
  const box = { width: 40, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' };
  if (t.type === 'color') return <div style={{ ...box, background: value }} />;
  if (t.type === 'dimension' && t.name.includes('radius'))
    return <div style={{ ...box, borderRadius: value, background: 'var(--color-bg-action-subtle)' }} />;
  if (t.type === 'dimension' && t.name.includes('size'))
    return <span style={{ fontSize: value, lineHeight: 1 }}>Aa</span>;
  if (t.type === 'dimension')
    return <div style={{ width: value, height: 12, background: 'var(--color-bg-action)', borderRadius: 2 }} />;
  if (t.type === 'fontFamily') return <span style={{ fontFamily: value }}>Aa Bb</span>;
  if (t.type === 'fontWeight') return <span style={{ fontWeight: Number(value) }}>Aa</span>;
  return null;
}

const cell = { padding: '8px 12px', borderBottom: '1px solid var(--color-border-default)', verticalAlign: 'middle' } as const;
const mono = { fontFamily: 'var(--text-family-code)', fontSize: 'var(--text-size-caption)' } as const;

export function TokenTable({ layer, prefix }: { layer: Layer; prefix?: string }) {
  const isActive = active();
  const rows = all.filter((t) => t.layer === layer && isActive(t) && (!prefix || t.name.startsWith(prefix)));
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-size-label)' }}>
      <thead>
        <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
          <th style={cell}>Preview</th>
          <th style={cell}>Token</th>
          <th style={cell}>References</th>
          <th style={cell}>Computed</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => {
          const value = computed(t.cssVar);
          return (
            <tr key={t.name}>
              <td style={cell}><Preview t={t} value={value} /></td>
              <td style={cell}>
                <div>{t.name}</div>
                <div style={{ ...mono, color: 'var(--color-text-muted)' }}>var({t.cssVar})</div>
              </td>
              <td style={{ ...cell, ...mono, color: 'var(--color-text-muted)' }}>
                {chain(t, isActive).join(' → ') || '(raw value)'}
              </td>
              <td style={{ ...cell, ...mono }}>{value}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
