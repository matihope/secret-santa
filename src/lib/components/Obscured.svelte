<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	let { text }: { text: string } = $props();
	let shown = $state(false);
</script>

<div class="flex items-start gap-3">
	<div class="min-w-0 flex-1 rounded-2xl bg-paper-2/70 px-3 py-2 text-sm whitespace-pre-wrap">
		{#if !text}
			<span class="text-ink-soft italic">{m.wishlist_empty()}</span>
		{:else if shown}
			{text}
		{:else}
			<span class="tracking-widest text-ink-soft select-none"
				>{'•'.repeat(Math.min(18, 6 + (text.length % 12)))}</span
			>
		{/if}
	</div>
	{#if text}
		<button type="button" class="btn-ghost btn-sm" onclick={() => (shown = !shown)}>
			{shown ? m.hide() : m.reveal()}
		</button>
	{/if}
</div>
