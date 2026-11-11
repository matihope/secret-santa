<script lang="ts">
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
	const current = getLocale();
</script>

<div class="flex rounded-full border border-ink/15 bg-snow/70 p-0.5 text-xs font-bold">
	{#each locales as locale (locale)}
		<button
			type="button"
			class="cursor-pointer rounded-full px-2.5 py-1 uppercase transition {locale === current
				? 'bg-pine text-snow'
				: 'text-ink-soft hover:text-ink'}"
			aria-pressed={locale === current}
			onclick={() => setLocale(locale)}
		>
			{locale}
		</button>
	{/each}
</div>
