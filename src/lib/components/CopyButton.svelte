<script lang="ts">
	import { onDestroy } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';

	// Copies `text`; shows ✓ only when the clipboard write really worked. Where there is no
	// clipboard (in-app browsers, plain http) it falls back to the share sheet, then to a
	// selected text field to copy by hand.
	let { text, label }: { text: string; label: string } = $props();

	let copied = $state(false);
	let manual = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => clearTimeout(timer));

	async function copy() {
		try {
			if (!navigator.clipboard) throw new Error('no clipboard');
			await navigator.clipboard.writeText(text);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1500);
		} catch {
			if (navigator.share) {
				// a cancelled share sheet is fine; anything else → copy by hand
				await navigator
					.share({ text })
					.catch((e: unknown) => (manual = (e as Error)?.name !== 'AbortError'));
			} else manual = true;
		}
	}

	const selectAll = (node: HTMLInputElement) => {
		node.focus();
		node.select();
	};
</script>

<button type="button" class="btn-ghost btn-sm" onclick={copy}>{copied ? '✓' : '📋'} {label}</button>
{#if manual}
	<label class="mt-2 block w-full text-xs text-ink-soft">
		{m.copy_manual()}
		<input
			class="mt-1 input py-1.5 font-mono text-sm"
			readonly
			value={text}
			use:selectAll
			onfocus={(e) => e.currentTarget.select()}
		/>
	</label>
{/if}
