<script lang="ts">
	import { RULES, RULES_BY_TYPE, ruleSentence, type RuleEntry } from '#lib/rules/catalog.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { TIMEZONE } from '$app/env/public';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import RuleValueInput from './RuleValueInput.svelte';

	let {
		rules = $bindable(),
		currency,
		name = 'rules'
	}: { rules: RuleEntry[]; currency: string; name?: string } = $props();

	const available = $derived(
		RULES.filter((r) => r.type === 'custom' || !rules.some((x) => x.type === r.type))
	);
	let adding = $state('');
	const [open, close] = getLocale() === 'pl' ? ['„', '”'] : ['“', '”'];

	function add() {
		const def = RULES_BY_TYPE.get(adding);
		if (!def) return;
		rules.push({ type: def.type, value: def.defaultValue() });
		adding = '';
	}
	function move(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= rules.length) return;
		[rules[i], rules[j]] = [rules[j], rules[i]];
	}
</script>

<input type="hidden" {name} value={JSON.stringify(rules)} />

<ol class="space-y-3">
	{#each rules as rule, i (rule)}
		{@const def = RULES_BY_TYPE.get(rule.type)}
		{#if def}
			<li class="rounded-2xl border border-ink/10 bg-snow p-3 sm:p-4">
				<div class="flex items-start gap-3">
					<span class="mt-0.5 text-xl" aria-hidden="true">{def.icon}</span>
					<div class="min-w-0 flex-1 space-y-2">
						<p class="text-xs font-bold tracking-wider text-ink-soft uppercase">{def.label()}</p>
						{#if def.input.kind !== 'none'}
							<RuleValueInput {def} bind:value={rule.value} {currency} />
						{/if}
						<p class="font-display text-[1.05rem] leading-snug text-pine italic">
							{open}{ruleSentence(rule, { currency, tz: TIMEZONE })}{close}
						</p>
					</div>
					<div class="flex shrink-0 flex-col gap-1">
						<button
							type="button"
							class="btn-ghost btn-sm px-2"
							aria-label={m.move_up()}
							disabled={i === 0}
							onclick={() => move(i, -1)}>↑</button
						>
						<button
							type="button"
							class="btn-ghost btn-sm px-2"
							aria-label={m.move_down()}
							disabled={i === rules.length - 1}
							onclick={() => move(i, 1)}>↓</button
						>
						<button
							type="button"
							class="btn-danger btn-sm px-2"
							aria-label={m.remove()}
							onclick={() => rules.splice(i, 1)}>✕</button
						>
					</div>
				</div>
			</li>
		{/if}
	{:else}
		<li
			class="rounded-2xl border border-dashed border-ink/20 p-4 text-center text-sm text-ink-soft"
		>
			{m.rules_empty()}
		</li>
	{/each}
</ol>

<div class="mt-4 flex flex-col gap-2 sm:flex-row">
	<select class="input sm:flex-1" bind:value={adding} aria-label={m.rule_add()}>
		<option value="">{m.rule_pick()}</option>
		{#each available as def (def.type)}
			<option value={def.type}>{def.icon} {def.label()}</option>
		{/each}
	</select>
	<button type="button" class="btn-pine" disabled={!adding} onclick={add}>+ {m.rule_add()}</button>
</div>
