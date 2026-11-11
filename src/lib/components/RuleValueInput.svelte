<script lang="ts">
	import type { RuleDef, RuleValue } from '#lib/rules/catalog.ts';
	import { m } from '#lib/paraglide/messages.js';

	let {
		def,
		value = $bindable(),
		currency
	}: { def: RuleDef; value: RuleValue; currency: string } = $props();
	const input = $derived(def.input);
</script>

{#if input.kind === 'money'}
	<label class="flex items-center gap-2">
		<span class="sr-only">{m.rule_amount()}</span>
		<input
			class="input max-w-36"
			type="number"
			min="1"
			step="1"
			inputmode="decimal"
			bind:value={value.amount}
		/>
		<span class="font-semibold text-ink-soft">{currency}</span>
	</label>
{:else if input.kind === 'number'}
	<input
		class="input max-w-28"
		type="number"
		min="1"
		max="99"
		bind:value={value.n}
		aria-label={def.label()}
	/>
{:else if input.kind === 'text'}
	<input
		class="input"
		type="text"
		maxlength="500"
		placeholder={input.placeholder()}
		bind:value={value.text}
		aria-label={def.label()}
	/>
{:else if input.kind === 'datetime'}
	<input
		class="input max-w-64"
		type="datetime-local"
		bind:value={value.at}
		aria-label={def.label()}
	/>
{:else if input.kind === 'select'}
	<div class="flex flex-wrap gap-2" role="radiogroup" aria-label={def.label()}>
		{#each input.options as opt (opt.value)}
			<button
				type="button"
				role="radio"
				aria-checked={value.option === opt.value}
				class="btn border btn-sm {value.option === opt.value
					? 'border-pine bg-holly text-cream'
					: 'border-ink/15 bg-snow text-ink'}"
				onclick={() => (value.option = opt.value)}>{opt.label()}</button
			>
		{/each}
	</div>
{/if}
