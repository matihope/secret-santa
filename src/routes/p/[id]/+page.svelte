<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import { displayName } from '#lib/names.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import Countdown from '#lib/components/Countdown.svelte';
	import Statute from '#lib/components/Statute.svelte';
	import RevealCard from '#lib/components/RevealCard.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const party = $derived(data.party);
	let now = $state(Date.now());
	$effect(() => {
		const t = setInterval(() => (now = Date.now()), 15_000);
		return () => clearInterval(t);
	});
</script>

{#if !data.access}
	<div class="mx-auto max-w-md pt-8 text-center">
		<Logo size={110} class="mx-auto" />
		<h1 class="mt-4 text-4xl font-black text-pine">{party.name}</h1>
		<form method="POST" action="?/code" class="mt-6 card text-left" use:enhance>
			<label for="code" class="eyebrow">{m.party_code()}</label>
			<p class="mt-1 mb-4 text-sm text-ink-soft">{m.gate_help()}</p>
			<input
				id="code"
				name="code"
				class="input text-center font-mono text-2xl tracking-[0.25em] uppercase"
				placeholder="XXXX-XXXX"
				autocomplete="off"
				required
			/>
			{#if form?.error}<p class="mt-3 error" role="alert">{errorText(form.error)}</p>{/if}
			<button class="mt-4 btn-pine w-full">{m.enter_party()} →</button>
		</form>
	</div>
{:else}
	{#if data.created && data.code}
		<div class="mb-6 animate-rise success text-base">
			🎉 {m.created_banner()} <b class="font-mono tracking-widest">{data.code}</b>
		</div>
	{/if}

	<header class="animate-rise">
		<p class="eyebrow">{m.party_eyebrow()}</p>
		<h1 class="mt-2 text-5xl leading-none font-black text-pine sm:text-6xl">{party.name}</h1>
		{#if party.description}
			<p class="mt-4 max-w-2xl text-lg whitespace-pre-wrap text-ink-soft">{party.description}</p>
		{/if}
	</header>

	<div class="mt-8 space-y-8">
		{#if !party.drawnAt && party.drawAt && !party.archivedAt}
			<Countdown target={party.drawAt} label={m.countdown_draw()} />
		{:else if party.drawnAt && party.partyAt && party.partyAt.getTime() > now}
			<Countdown target={party.partyAt} label={m.countdown_party()} />
		{/if}

		{#if !party.drawnAt && party.drawAt && party.drawAt.getTime() <= now && !party.archivedAt}
			<p class="success">⏳ {party.drawError ? m.draw_problem_public() : m.draw_pending()}</p>
		{/if}

		{#if data.assignment}
			<RevealCard receiver={data.assignment} />
		{:else if data.me && party.drawnAt && data.me.participates}
			<p class="error">{m.no_assignment()}</p>
		{/if}

		{#if !data.me}
			<div class="flex flex-col items-center gap-4 card text-center sm:flex-row sm:text-left">
				<Logo size={64} />
				<div class="flex-1">
					<p class="font-display text-2xl font-bold text-pine">
						{party.drawnAt ? m.cta_drawn_title() : m.cta_join_title()}
					</p>
					<p class="text-ink-soft">{party.drawnAt ? m.cta_drawn_text() : m.cta_join_text()}</p>
				</div>
				<div class="flex flex-wrap justify-center gap-2">
					{#if !party.drawnAt && !party.archivedAt}
						<a href="/p/{party.id}/join" class="btn-primary">🎅 {m.join()}</a>
					{/if}
					{#if data.members.length}
						<a href="/p/{party.id}/login" class="btn-ghost">{m.login_existing()}</a>
					{/if}
				</div>
			</div>
		{/if}

		<Statute
			rules={data.rules}
			currency={party.currency}
			partyAt={party.partyAt}
			location={party.location}
			drawAt={party.drawAt}
		/>

		<section>
			<h2 class="text-2xl font-bold text-pine">
				{m.members_title({ count: String(data.members.length) })}
			</h2>
			<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each data.members as member, i (member.id)}
					<li
						class="flex animate-rise items-center gap-3 rounded-2xl bg-snow/80 p-3 ring-1 ring-ink/5"
						style="animation-delay:{i * 40}ms"
					>
						<Avatar {member} size={44} />
						<div class="min-w-0">
							<p class="truncate font-semibold">{displayName(member)}</p>
							<p class="flex flex-wrap gap-1 text-xs text-ink-soft">
								{#if member.isAdmin}<span title={m.party_admin()}>👑</span>{/if}
								{#if !member.participates}<span>{m.spectator()}</span>{/if}
								{#if !member.hasPasscode}<span title={m.no_passcode_warning()}>🔓</span>{/if}
							</p>
						</div>
					</li>
				{:else}
					<li class="col-span-full text-ink-soft">{m.no_members()}</li>
				{/each}
			</ul>
		</section>
	</div>
{/if}
