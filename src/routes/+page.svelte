<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import Logo from '#lib/components/Logo.svelte';
	import PartyCard from '#lib/components/PartyCard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>

<section class="grid items-center gap-8 pt-6 pb-10 md:grid-cols-[1.15fr_1fr] md:pt-12">
	<div class="animate-rise">
		<p class="eyebrow">{m.home_eyebrow()}</p>
		<h1 class="mt-3 text-5xl leading-[0.95] font-black text-pine sm:text-6xl">
			{m.home_title_1()}<br /><span class="text-berry italic">{m.home_title_2()}</span>
		</h1>
		<p class="mt-5 max-w-md text-lg text-ink-soft">{m.home_lead()}</p>
		<a href="/new" class="mt-7 btn-primary text-lg">🎁 {m.create_party()}</a>
	</div>

	<div class="relative animate-rise [animation-delay:120ms]">
		<div class="absolute -top-12 -right-2 z-10 rotate-12 sm:-right-6" aria-hidden="true">
			<Logo size={92} />
		</div>
		<form
			method="POST"
			action="?/code"
			class="relative card border-2 border-dashed border-gold/60"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					busy = false;
					await update({ reset: false });
				};
			}}
		>
			<label for="code" class="eyebrow">{m.party_code()}</label>
			<p class="mt-1 mb-4 text-sm text-ink-soft">{m.party_code_help()}</p>
			<input
				id="code"
				name="code"
				class="input text-center font-mono text-2xl tracking-[0.25em] uppercase"
				placeholder="XXXX-XXXX"
				autocomplete="off"
				autocapitalize="characters"
				spellcheck="false"
				required
				value={form?.code ?? ''}
			/>
			{#if form?.error}
				<p class="mt-3 error" role="alert">{errorText(form.error)}</p>
			{/if}
			<button class="mt-4 btn-pine w-full text-lg" disabled={busy}>{m.enter_party()} →</button>
		</form>
	</div>
</section>

{#if data.joined.length}
	<section class="mt-4">
		<h2 class="text-2xl font-bold text-pine">{m.my_parties()}</h2>
		<div class="mt-4 grid gap-5 sm:grid-cols-2">
			{#each data.joined as party, i (party.id)}
				<PartyCard {party} joined index={i} />
			{/each}
		</div>
	</section>
{/if}

<section class="mt-12">
	<div class="flex flex-wrap items-end justify-between gap-2">
		<h2 class="text-2xl font-bold text-pine">{m.public_parties()}</h2>
		<a
			href={data.showArchived ? '/' : '/?archived'}
			class="text-sm font-semibold text-ink-soft underline-offset-2 hover:underline"
		>
			{data.showArchived ? m.hide_archived() : m.show_archived()}
		</a>
	</div>
	{#if data.publicParties.length}
		<div class="mt-4 grid gap-5 sm:grid-cols-2">
			{#each data.publicParties as party, i (party.id)}
				<PartyCard {party} index={i} />
			{/each}
		</div>
	{:else}
		<p class="mt-4 rounded-3xl border border-dashed border-ink/20 p-6 text-center text-ink-soft">
			{m.no_public_parties()}
		</p>
	{/if}
</section>
