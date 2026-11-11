<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { TIMEZONE } from '$app/env/public';
	import { formatDate } from '#lib/time.ts';
	import Countdown from './Countdown.svelte';

	let {
		party,
		joined = false,
		index = 0
	}: {
		party: {
			id: string;
			name: string;
			partyAt: Date | null;
			drawAt: Date | null;
			drawnAt: Date | null;
			archived: boolean;
		};
		joined?: boolean;
		index?: number;
	} = $props();

	const tilt = $derived(((index % 3) - 1) * 0.8);
</script>

<a
	href="/p/{party.id}"
	class="group relative block animate-rise rounded-3xl border border-ink/10 bg-snow p-5 pl-7 shadow-[0_10px_25px_-18px_rgb(43_29_23/.6)] transition hover:-translate-y-0.5 hover:rotate-0 hover:shadow-[0_18px_30px_-18px_rgb(43_29_23/.6)]"
	style="transform:rotate({tilt}deg);animation-delay:{index * 70}ms"
>
	<!-- gift-tag hole + string -->
	<span
		class="absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-gold bg-paper"
		aria-hidden="true"
	></span>
	<div class="flex items-start justify-between gap-3">
		<h3 class="text-xl leading-tight font-bold text-pine group-hover:text-berry">{party.name}</h3>
		{#if party.archived}
			<span class="chip">🗄️ {m.archived()}</span>
		{:else if joined}
			<span class="chip bg-pine/10 text-pine">✓ {m.joined()}</span>
		{/if}
	</div>
	<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
		{#if party.partyAt}
			<span>🎄 {formatDate(party.partyAt, getLocale(), TIMEZONE)}</span>
		{/if}
		{#if party.drawnAt}
			<span class="font-semibold text-berry">🎲 {m.drawn_done()}</span>
		{:else if party.drawAt && !party.archived}
			<span>🎲 <Countdown target={party.drawAt} label="" compact /></span>
		{/if}
	</div>
</a>
