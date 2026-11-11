<script lang="ts">
	import { getLocale, locales, setLocale, type Locale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { LANGUAGES } from '#lib/languages.ts';

	const current = getLocale();
	let open = $state(false);
	let root: HTMLDivElement;
	let trigger: HTMLButtonElement;

	const items = () => [...root.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];

	function toggle(focusFirst = false) {
		open = !open;
		if (open && focusFirst) queueMicrotask(() => items()[0]?.focus());
	}
	function close(refocus = false) {
		open = false;
		if (refocus) trigger.focus();
	}
	function choose(locale: Locale) {
		close();
		if (locale !== current) setLocale(locale);
	}
	function onMenuKey(e: KeyboardEvent) {
		const list = items();
		const i = list.indexOf(document.activeElement as HTMLButtonElement);
		const go = (j: number) => {
			e.preventDefault();
			list[(j + list.length) % list.length]?.focus();
		};
		if (e.key === 'ArrowDown') go(i + 1);
		else if (e.key === 'ArrowUp') go(i - 1);
		else if (e.key === 'Home') go(0);
		else if (e.key === 'End') go(list.length - 1);
		else if (e.key === 'Escape') close(true);
		else if (e.key === 'Tab') close();
	}
</script>

<svelte:window
	onclick={(e) => {
		if (open && !root.contains(e.target as Node)) close();
	}}
/>

<div class="relative" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-snow/70 py-1.5 pr-2.5 pl-2 text-xs font-bold text-ink transition hover:border-ink/30"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label="{m.language()}: {LANGUAGES[current].name}"
		onclick={() => toggle()}
		onkeydown={(e) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				if (!open) toggle(true);
				else items()[0]?.focus();
			}
		}}
	>
		<img src={LANGUAGES[current].flag} alt="" class="flag" />
		<span class="uppercase sm:hidden">{current}</span>
		<span class="hidden sm:inline">{LANGUAGES[current].name}</span>
		<svg viewBox="0 0 12 12" class="size-3 transition {open ? 'rotate-180' : ''}" aria-hidden="true">
			<path
				d="M3 4.5 6 7.5 9 4.5"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if open}
		<div
			role="menu"
			tabindex="-1"
			aria-label={m.language()}
			class="absolute right-0 z-30 mt-1.5 min-w-40 rounded-2xl border border-ink/10 bg-snow p-1 shadow-lg"
			onkeydown={onMenuKey}
		>
			{#each locales as locale (locale)}
				<button
					type="button"
					role="menuitemradio"
					aria-checked={locale === current}
					lang={locale}
					class="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-pine/10 focus-visible:bg-pine/10 focus-visible:outline-none {locale ===
					current
						? 'text-pine'
						: 'text-ink'}"
					onclick={() => choose(locale)}
				>
					<img src={LANGUAGES[locale].flag} alt="" class="flag" />
					<span class="flex-1">{LANGUAGES[locale].name}</span>
					{#if locale === current}
						<svg viewBox="0 0 12 12" class="size-3.5" aria-hidden="true">
							<path
								d="M2.5 6.5 5 9l4.5-6"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.flag {
		width: 20px;
		height: 14px;
		border-radius: 3px;
		object-fit: cover;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.12);
		flex: none;
	}
</style>
