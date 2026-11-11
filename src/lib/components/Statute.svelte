<script lang="ts">
	import { ruleSentence, RULES_BY_TYPE, type RuleEntry } from '#lib/rules/catalog.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { TIMEZONE } from '$app/env/public';
	import { formatDateTime } from '#lib/time.ts';

	let {
		rules,
		currency,
		partyAt,
		location,
		drawAt
	}: {
		rules: RuleEntry[];
		currency: string;
		partyAt: Date | null;
		location: string;
		drawAt: Date | null;
	} = $props();

	const locale = getLocale();
</script>

<article class="relative overflow-hidden card">
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,var(--color-berry)_0_14px,var(--color-snow)_14px_28px)]"
		aria-hidden="true"
	></div>
	<p class="mt-2 eyebrow">{m.statute_eyebrow()}</p>
	<h2 class="mt-1 text-3xl font-bold text-pine">{m.statute_title()}</h2>

	<dl class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
		{#if partyAt}
			<div class="rounded-2xl bg-paper-2/60 p-3">
				<dt class="font-bold text-ink-soft">🎄 {m.party_when()}</dt>
				<dd class="mt-1 font-semibold">{formatDateTime(partyAt, locale, TIMEZONE)}</dd>
			</div>
		{/if}
		{#if location}
			<div class="rounded-2xl bg-paper-2/60 p-3">
				<dt class="font-bold text-ink-soft">📍 {m.party_where()}</dt>
				<dd class="mt-1 font-semibold whitespace-pre-wrap">{location}</dd>
			</div>
		{/if}
		{#if drawAt}
			<div class="rounded-2xl bg-paper-2/60 p-3">
				<dt class="font-bold text-ink-soft">🎲 {m.draw_when()}</dt>
				<dd class="mt-1 font-semibold">{formatDateTime(drawAt, locale, TIMEZONE)}</dd>
			</div>
		{/if}
	</dl>

	{#if rules.length}
		<ol class="mt-6 space-y-3">
			{#each rules as rule, i (i)}
				<li class="flex gap-3">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-berry font-display text-sm font-bold text-snow"
						>{i + 1}</span
					>
					<p class="pt-0.5 leading-relaxed">
						<span aria-hidden="true">{RULES_BY_TYPE.get(rule.type)?.icon}</span>
						{ruleSentence(rule, { currency, tz: TIMEZONE })}
					</p>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="mt-6 text-sm text-ink-soft italic">{m.statute_empty()}</p>
	{/if}
</article>
