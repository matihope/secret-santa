<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { displayName, fullName, type NamedMember } from '#lib/names.ts';
	import Avatar from './Avatar.svelte';

	let {
		receiver
	}: { receiver: NamedMember & { id: string; avatar: string | null; wishlist: string } } = $props();
	let open = $state(false);
</script>

<section
	class="relative overflow-hidden rounded-[2rem] border-4 border-gold-2 bg-ribbon p-6 text-cream shadow-[0_25px_50px_-25px_#5a1016] sm:p-8"
>
	<div
		class="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gold-2/90"
		aria-hidden="true"
		class:hidden={open}
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 bg-gold-2/90"
		aria-hidden="true"
		class:hidden={open}
	></div>

	{#if !open}
		<div class="relative flex flex-col items-center gap-4 py-6 text-center">
			<span class="text-6xl drop-shadow-lg" aria-hidden="true">🎁</span>
			<p class="rounded-full bg-ribbon-2/90 px-4 py-1 font-display text-2xl font-bold">
				{m.reveal_title()}
			</p>
			<button
				class="btn rounded-full bg-cream text-ribbon shadow-[0_3px_0_#e9c36a] hover:bg-[#f7f0e3]"
				onclick={() => (open = true)}
			>
				✨ {m.reveal_open()}
			</button>
			<p class="max-w-xs rounded-xl bg-ribbon-2/80 px-3 py-1 text-xs text-cream/90">
				{m.reveal_hint()}
			</p>
		</div>
	{:else}
		<div class="relative animate-rise">
			<p class="text-xs font-bold tracking-[0.25em] text-gold-2 uppercase">{m.reveal_you_give()}</p>
			<div class="mt-4 flex items-center gap-4">
				<Avatar member={receiver} size={84} ring />
				<div>
					<p class="font-display text-4xl leading-none font-black">{displayName(receiver)}</p>
					{#if fullName(receiver) !== displayName(receiver)}
						<p class="mt-1 text-cream/80">{fullName(receiver)}</p>
					{/if}
				</div>
			</div>
			<div class="mt-6 rounded-2xl bg-cream p-4 text-[#2b1d17]">
				<p class="text-xs font-bold tracking-wider text-ribbon uppercase">
					📝 {m.their_wishlist()}
				</p>
				<p class="mt-2 whitespace-pre-wrap">{receiver.wishlist || m.wishlist_empty_theirs()}</p>
			</div>
			<button
				class="mt-4 text-sm font-semibold text-cream/80 underline underline-offset-2"
				onclick={() => (open = false)}
			>
				🙈 {m.reveal_close()}
			</button>
		</div>
	{/if}
</section>
