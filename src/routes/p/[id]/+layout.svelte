<script lang="ts">
	import { APP_NAME } from '#lib/brand.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { page } from '$app/state';
	import Avatar from '#lib/components/Avatar.svelte';
	import { displayName } from '#lib/names.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	const base = $derived(`/p/${data.party.id}`);
	const tabs = $derived(
		[
			{ href: base, label: m.nav_party(), show: true },
			{ href: `${base}/me`, label: m.nav_me(), show: !!data.me },
			{ href: `${base}/admin`, label: m.nav_admin(), show: data.canAdmin }
		].filter((t) => t.show)
	);
</script>

<svelte:head><title>{data.party.name} · {APP_NAME}</title></svelte:head>

{#if data.access}
	<nav class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div class="flex gap-1 rounded-full border border-ink/10 bg-snow/70 p-1">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="rounded-full px-4 py-1.5 text-sm font-semibold transition {page.url.pathname ===
						tab.href ||
					(tab.href !== base && page.url.pathname.startsWith(tab.href))
						? 'bg-berry text-snow'
						: 'text-ink-soft hover:text-ink'}">{tab.label}</a
				>
			{/each}
		</div>
		{#if data.me}
			<form method="POST" action="{base}?/logout" class="flex items-center gap-2 text-sm">
				<Avatar member={data.me} size={30} />
				<span class="font-semibold">{displayName(data.me)}</span>
				<button class="text-ink-soft underline-offset-2 hover:underline">{m.logout()}</button>
			</form>
		{:else if data.siteAdmin}
			<span class="chip">🛡️ {m.site_admin()}</span>
		{/if}
	</nav>
	{#if data.party.archivedAt}
		<p class="mb-6 rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-snow">
			🗄️ {m.archived_banner()}
		</p>
	{/if}
{/if}

{@render children()}
