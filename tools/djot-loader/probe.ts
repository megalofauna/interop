/**
 * Smoke test for the djot loader pipeline. Run with:
 *   npx tsx tools/djot-loader/probe.ts
 */
import { parse } from '@djot/djot';
import { extractSlots } from './extract';
import { emitModule } from './emit';

const src = `{#hero .lead}
:::
# Title

A **strong** word and an :icon-shield: symbol with [styled span]{.foo}.
:::

{#install .code-block}
:::
\`\`\`bash
npm install interop
\`\`\`
:::

{#features}
:::
- :icon-bolt: one
- two

[link](https://example.com)
:::

{#hero}
:::
duplicate to trigger error
:::

{#1bad}
:::
invalid identifier
:::
`;

const ast = parse(src);
const { slots, errors } = extractSlots(ast);

console.log('=== slot ids ===');
console.log([...slots.keys()]);

console.log('\n=== extract errors ===');
console.log(errors);

console.log('\n=== emitted module (without bad ident) ===');
const cleanSlots = new Map([...slots].filter(([id]) => /^[A-Za-z_$]/.test(id)));
console.log(emitModule(cleanSlots));

console.log('\n=== ident validation ===');
try {
	emitModule(slots);
} catch (e) {
	console.log('caught:', (e as Error).message);
}
