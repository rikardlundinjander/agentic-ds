import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenTable } from './TokenTable';

// Token reference pages. Switch Brand and Mode in the toolbar:
// the "Computed" column updates, the "References" column stays the same.
const meta = {
  title: 'Tokens',
  component: TokenTable,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TokenTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModeColors: Story = {
  name: 'Mode / Colors',
  args: { layer: 'mode' },
};

export const SemanticSpacing: Story = {
  name: 'Semantic / Spacing & shape',
  args: { layer: 'semantic', prefix: 'space' },
  render: () => (
    <>
      <TokenTable layer="semantic" prefix="space" />
      <TokenTable layer="semantic" prefix="shape" />
    </>
  ),
};

export const SemanticText: Story = {
  name: 'Semantic / Text',
  args: { layer: 'semantic', prefix: 'text' },
};

export const BrandPalette: Story = {
  name: 'Brand / Palette & aliases',
  args: { layer: 'brand' },
};

export const PrimitiveColors: Story = {
  name: 'Primitives / Colors',
  args: { layer: 'primitives', prefix: 'color' },
};

export const PrimitiveScales: Story = {
  name: 'Primitives / Space, radius, type',
  args: { layer: 'primitives' },
  render: () => (
    <>
      <TokenTable layer="primitives" prefix="space" />
      <TokenTable layer="primitives" prefix="radius" />
      <TokenTable layer="primitives" prefix="font" />
    </>
  ),
};
