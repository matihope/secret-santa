<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { TIMEZONE } from '$app/env/public';
	import { errorText } from '#lib/errors.ts';
	import { formatDate } from '#lib/time.ts';
	import Logo from '#lib/components/Logo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>{m.site_admin()} · {m.app_name()}</title></svelte:head>

{#if !data.loggedIn}
	<div class="mx-auto max-w-sm pt-8 text-center">
		<Logo size={96} class="mx-auto" />
		<h1 class="mt-4 text-3xl font-black text-pine">{m.site_admin()}</h1>
		{#if !data.enabled}
			<p class="mt-6 error">{m.site_admin_disabled()}</p>
		{:else}
			<form method="POST" action="?/login" class="mt-6 card text-left" use:enhance>
				<label class="label" for="password">{m.password()}</label>
				<input
					id="password"
					name="password"
					type="password"
					class="input"
					autocomplete="current-password"
					required
				/>
				{#if form?.error}<p class="mt-3 error" role="alert">{errorText(form.error)}</p>{/if}
				<button class="mt-4 btn-pine w-full">{m.login()}</button>
			</form>
		{/if}
	</div>
{:else}
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-4xl font-black text-pine">🛡️ {m.site_admin()}</h1>
		<form method="POST" action="?/logout">
			<button class="btn-ghost btn-sm">{m.logout()}</button>
		</form>
	</div>
	<p class="mt-2 text-ink-soft">{m.site_admin_lead()}</p>

	<div class="mt-6 overflow-x-auto card !p-0">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="bg-paper-2/70 text-xs tracking-wider text-ink-soft uppercase">
				<tr>
					<th class="px-4 py-3">{m.party_name()}</th>
					<th class="px-4 py-3">{m.party_code()}</th>
					<th class="px-4 py-3">{m.party_when()}</th>
					<th class="px-4 py-3">👥</th>
					<th class="px-4 py-3">{m.status()}</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-ink/10">
				{#each data.parties as p (p.id)}
					<tr class={p.archived ? 'opacity-60' : ''}>
						<td class="px-4 py-3 font-semibold">
							<a href="/p/{p.id}" class="hover:text-berry">{p.name}</a>
							{#if p.isPublic}<span class="ml-1 chip">{m.public_badge()}</span>{/if}
						</td>
						<td class="px-4 py-3 font-mono">{p.code}</td>
						<td class="px-4 py-3">{formatDate(p.partyAt, getLocale(), TIMEZONE) || '—'}</td>
						<td class="px-4 py-3">{p.members}</td>
						<td class="px-4 py-3">
							{#if p.archived}🗄️ {m.archived()}
							{:else if p.drawnAt}✅ {m.drawn_done()}
							{:else if p.drawError}⚠️ {errorText(`draw_${p.drawError}`)}
							{:else}⏳ {formatDate(p.drawAt, getLocale(), TIMEZONE)}{/if}
						</td>
						<td class="px-4 py-3 text-right"
							><a href="/p/{p.id}/admin" class="btn-ghost btn-sm">{m.manage()}</a></td
						>
					</tr>
				{:else}
					<tr><td colspan="6" class="px-4 py-6 text-center text-ink-soft">{m.no_parties()}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
