<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Logo from '#lib/components/Logo.svelte';
	import LangSwitch from '#lib/components/LangSwitch.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{m.app_name()}</title>
	<meta name="theme-color" content="#17382a" />
</svelte:head>

<div class="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-6">
	<header class="flex items-center justify-between gap-3 py-4">
		<a href="/" class="group flex items-center gap-2.5">
			<Logo size={46} />
			<span class="leading-none">
				<span
					class="block font-display text-xl font-black text-pine sm:text-2xl"
					style="font-variation-settings:'SOFT' 100,'WONK' 1">{m.app_name()}</span
				>
				<span class="block text-[0.7rem] font-semibold tracking-wider text-berry"
					>{m.app_tagline()}</span
				>
			</span>
		</a>
		<LangSwitch />
	</header>

	<main class="flex-1 pb-16">
		{@render children()}
	</main>

	<footer class="border-t border-ink/10 py-6 text-center text-xs text-ink-soft">
		{m.footer()} · <a href="/admin" class="underline-offset-2 hover:underline">{m.site_admin()}</a>
	</footer>
</div>
