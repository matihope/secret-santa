<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { setTheme, THEME_CHOICES, type ThemeChoice } from '#lib/theme.ts';

	let { initial }: { initial: ThemeChoice } = $props();
	// svelte-ignore state_referenced_locally
	let choice = $state(initial);

	const label = { auto: m.theme_auto, light: m.theme_light, dark: m.theme_dark };

	function next() {
		choice = THEME_CHOICES[(THEME_CHOICES.indexOf(choice) + 1) % THEME_CHOICES.length];
		setTheme(choice);
	}
</script>

<button
	type="button"
	class="flex size-8 cursor-pointer items-center justify-center rounded-full border border-ink/15 bg-snow/70 text-ink transition hover:border-ink/30"
	aria-label="{m.theme()}: {label[choice]()}"
	title="{m.theme()}: {label[choice]()}"
	onclick={next}
>
	<svg viewBox="0 0 24 24" class="size-4.5" aria-hidden="true">
		<g
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			{#if choice === 'light'}
				<circle cx="12" cy="12" r="4" />
				<path
					d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
				/>
			{:else if choice === 'dark'}
				<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
				<path d="M17 3.5v3M15.5 5h3" />
			{:else}
				<circle cx="12" cy="12" r="8.5" />
				<path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
			{/if}
		</g>
	</svg>
</button>
