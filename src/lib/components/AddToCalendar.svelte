<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { googleCalendarUrl } from '#lib/calendar.ts';
	import { partyEvents } from '#lib/party-events.ts';

	type Props = Parameters<typeof partyEvents>[0];
	let { party }: { party: Props } = $props();

	const events = $derived.by(() => {
		const all = partyEvents(party, page.url.origin);
		// a party that already happened isn't worth adding
		if (all.party && all.party.start.getTime() < Date.now()) delete all.party;
		return all;
	});
	let details = $state<HTMLDetailsElement>();
</script>

<svelte:window
	onclick={(e) => {
		if (details?.open && !details.contains(e.target as Node)) details.open = false;
	}}
/>

{#if events.draw || events.party}
	<details class="group relative inline-block" bind:this={details}>
		<summary
			class="btn-ghost cursor-pointer list-none btn-sm select-none [&::-webkit-details-marker]:hidden"
		>
			📅 {m.cal_add()}
		</summary>
		<div
			class="absolute left-0 z-20 mt-2 w-72 space-y-1 rounded-2xl border border-ink/10 bg-snow p-2 text-sm shadow-lg"
		>
			{#if events.draw}
				<a
					class="block rounded-xl px-3 py-2 font-semibold hover:bg-pine/10"
					href={googleCalendarUrl(events.draw)}
					target="_blank"
					rel="noopener">{m.cal_google_draw()}</a
				>
			{/if}
			{#if events.party}
				<a
					class="block rounded-xl px-3 py-2 font-semibold hover:bg-pine/10"
					href={googleCalendarUrl(events.party)}
					target="_blank"
					rel="noopener">{m.cal_google_party()}</a
				>
			{/if}
			<a
				class="block rounded-xl px-3 py-2 font-semibold hover:bg-pine/10"
				href="/p/{party.id}/calendar.ics"
				download
				data-sveltekit-reload
			>
				{m.cal_ics()}
				<span class="block text-xs font-normal text-ink-soft">{m.cal_ics_hint()}</span>
			</a>
		</div>
	</details>
{/if}
