<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { TIMEZONE } from '$app/env/public';
	import { errorText } from '#lib/errors.ts';
	import { displayName, fullName } from '#lib/names.ts';
	import { formatDateTime, toInputValue } from '#lib/time.ts';
	import { CURRENCIES } from '#lib/currencies.ts';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import type { RuleEntry } from '#lib/rules/catalog.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import Obscured from '#lib/components/Obscured.svelte';
	import RuleBuilder from '#lib/components/RuleBuilder.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const party = $derived(data.party);
	let rules = $state<RuleEntry[]>([]);
	$effect.pre(() => {
		rules = structuredClone($state.snapshot(data.rules));
	});
	let currency = $state('PLN');
	$effect.pre(() => {
		currency = party.currency;
	});

	const keep: SubmitFunction =
		() =>
		async ({ update }) =>
			update({ reset: false });
	const confirmThen =
		(question: string): SubmitFunction =>
		({ cancel }) => {
			if (!confirm(question)) cancel();
			return async ({ update }) => update({ reset: false });
		};
	const msg = (section: string) =>
		form && 'section' in form && form.section === section
			? { error: form.error as string }
			: form && 'ok' in form && form.ok === section
				? { ok: true }
				: null;
	const participants = $derived(data.members.filter((x) => x.participates).length);
</script>

{#snippet feedback(section: string)}
	{@const f = msg(section)}
	{#if f?.error}<p class="mt-3 error" role="alert">{errorText(f.error)}</p>{/if}
	{#if f?.ok}<p class="mt-3 success" role="status">✓ {m.saved()}</p>{/if}
{/snippet}

<h1 class="text-4xl font-black text-pine">{m.admin_title()}</h1>

<div class="mt-6 grid gap-6 lg:grid-cols-2">
	<!-- draw -->
	<section class="card lg:col-span-2">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="text-2xl font-bold text-pine">🎲 {m.draw_title()}</h2>
				<p class="mt-1 text-ink-soft">
					{#if party.drawnAt}
						✅ {m.draw_done_at({ date: formatDateTime(party.drawnAt, getLocale(), TIMEZONE) })}
					{:else if party.drawAt}
						{m.draw_scheduled({ date: formatDateTime(party.drawAt, getLocale(), TIMEZONE) })}
					{:else}
						{m.draw_not_scheduled()}
					{/if}
				</p>
				<p class="mt-1 text-sm text-ink-soft">
					{m.draw_participants({ count: String(participants) })}
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				{#if !party.drawnAt}
					<form method="POST" action="?/draw" use:enhance={confirmThen(m.confirm_draw())}>
						<button class="btn-primary" disabled={!!party.archivedAt}>🎲 {m.draw_now()}</button>
					</form>
				{:else}
					<form method="POST" action="?/resetDraw" use:enhance={confirmThen(m.confirm_reset())}>
						<button class="btn-danger">↺ {m.draw_reset()}</button>
					</form>
				{/if}
			</div>
		</div>
		{#if data.admin.drawError && !party.drawnAt}
			<p class="mt-3 error">⚠️ {errorText(`draw_${data.admin.drawError}`)}</p>
		{/if}
		{#if party.drawnAt}
			<p class="mt-3 text-sm text-ink-soft">🙈 {m.draw_secret_note()}</p>
		{/if}
		{@render feedback('draw')}
	</section>

	<!-- settings -->
	<section class="card">
		<h2 class="text-2xl font-bold text-pine">⚙️ {m.settings()}</h2>
		<form method="POST" action="?/settings" class="mt-4 space-y-4" use:enhance={keep}>
			<div>
				<label class="label" for="name">{m.party_name()}</label>
				<input id="name" name="name" class="input" maxlength="120" value={party.name} required />
			</div>
			<div>
				<label class="label" for="description">{m.party_description()}</label>
				<textarea id="description" name="description" rows="2" class="input" maxlength="2000"
					>{party.description}</textarea
				>
			</div>
			<div class="grid gap-4">
				<div>
					<label class="label" for="drawAt">🎲 {m.draw_when()}</label>
					<input
						id="drawAt"
						name="drawAt"
						type="datetime-local"
						class="input"
						value={toInputValue(party.drawAt, TIMEZONE)}
						disabled={!!party.drawnAt}
					/>
				</div>
				<div>
					<label class="label" for="partyAt">🎄 {m.party_when()}</label>
					<input
						id="partyAt"
						name="partyAt"
						type="datetime-local"
						class="input"
						value={toInputValue(party.partyAt, TIMEZONE)}
					/>
				</div>
			</div>
			<div>
				<label class="label" for="location">📍 {m.party_where()}</label>
				<input id="location" name="location" class="input" maxlength="300" value={party.location} />
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="currency">{m.currency()}</label>
					<select id="currency" name="currency" class="input" bind:value={currency}>
						{#each CURRENCIES as c (c)}<option>{c}</option>{/each}
					</select>
				</div>
				<label class="flex items-center gap-3 self-end rounded-2xl bg-paper-2/60 p-3">
					<input
						type="checkbox"
						name="isPublic"
						class="h-5 w-5 rounded text-pine"
						checked={party.isPublic}
					/>
					<span class="text-sm font-semibold">{m.party_public()}</span>
				</label>
			</div>
			<button class="btn-pine">{m.save()}</button>
			{@render feedback('settings')}
		</form>
	</section>

	<!-- code -->
	<section class="card">
		<h2 class="text-2xl font-bold text-pine">🔑 {m.party_code()}</h2>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<span
				class="rounded-2xl border-2 border-dashed border-gold bg-gold-2/15 px-5 py-3 font-mono text-2xl font-bold tracking-[0.2em]"
				>{data.admin.code}</span
			>
			<CopyButton text={data.admin.code} label={m.copy()} />
		</div>
		<p class="mt-2 text-sm text-ink-soft">{m.code_share_help()}</p>
		<form method="POST" action="?/code" class="mt-4 space-y-2" use:enhance={keep}>
			<input
				name="code"
				class="input font-mono tracking-widest uppercase"
				maxlength="40"
				placeholder={m.code_custom()}
				aria-label={m.code_custom()}
			/>
			<div class="flex flex-wrap gap-2">
				<button class="btn-pine">{m.save()}</button>
				<button class="btn-ghost" name="regenerate" value="1">🎲 {m.code_regenerate()}</button>
			</div>
		</form>
		<p class="mt-2 text-xs text-ink-soft">{m.code_change_note()}</p>
		{@render feedback('code')}
	</section>

	<!-- rules -->
	<section class="card lg:col-span-2">
		<h2 class="text-2xl font-bold text-pine">📜 {m.statute_title()}</h2>
		<form method="POST" action="?/rules" class="mt-4" use:enhance={keep}>
			<RuleBuilder bind:rules {currency} />
			<button class="mt-4 btn-pine">{m.save_rules()}</button>
			{@render feedback('rules')}
		</form>
	</section>

	<!-- members -->
	<section class="card lg:col-span-2">
		<h2 class="text-2xl font-bold text-pine">
			👥 {m.members_title({ count: String(data.members.length) })}
		</h2>
		<ul class="mt-4 divide-y divide-ink/10">
			{#each data.members as member (member.id)}
				<li class="grid gap-3 py-4 sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-start">
					<div class="flex items-center gap-3">
						<Avatar {member} size={44} />
						<div class="min-w-0">
							<p class="truncate font-semibold">{fullName(member)}</p>
							<p class="flex flex-wrap gap-1.5 text-xs text-ink-soft">
								{#if member.isAdmin}<span>👑 {m.party_admin()}</span>{/if}
								{#if !member.participates}<span>{m.spectator()}</span>{/if}
								{#if !member.hasPasscode}<span class="text-berry">🔓 {m.no_passcode_short()}</span
									>{/if}
							</p>
						</div>
					</div>
					<Obscured text={member.wishlist} />
					<a
						href="/p/{party.id}/admin/members/{member.id}"
						class="btn-ghost justify-self-start btn-sm">✏️ {m.edit()}</a
					>
				</li>
			{/each}
		</ul>

		{#if !party.drawnAt}
			<details class="mt-4 rounded-2xl bg-paper-2/50 p-4">
				<summary class="cursor-pointer font-semibold">➕ {m.add_member()}</summary>
				<p class="mt-2 text-sm text-ink-soft">{m.add_member_help()}</p>
				<form method="POST" action="?/addMember" class="mt-3 grid gap-3 sm:grid-cols-2" use:enhance>
					<input
						name="firstName"
						class="input"
						placeholder={m.first_name()}
						aria-label={m.first_name()}
						maxlength="60"
					/>
					<input
						name="lastName"
						class="input"
						placeholder={m.last_name()}
						aria-label={m.last_name()}
						maxlength="60"
					/>
					<input
						name="nickname"
						class="input"
						placeholder={m.nickname()}
						aria-label={m.nickname()}
						maxlength="60"
					/>
					<input
						name="passcode"
						type="password"
						class="input"
						placeholder={m.passcode() + ' (' + m.optional() + ')'}
						aria-label={m.passcode()}
						autocomplete="new-password"
					/>
					<button class="btn-pine sm:col-span-2 sm:justify-self-start">{m.add_member()}</button>
				</form>
			</details>
		{/if}
		{@render feedback('members')}
	</section>

	<!-- exclusions -->
	<section class="card lg:col-span-2">
		<h2 class="text-2xl font-bold text-pine">💑 {m.exclusions_admin_title()}</h2>
		<p class="mt-1 text-sm text-ink-soft">{m.exclusions_admin_help()}</p>
		<ul class="mt-4 space-y-2">
			{#each data.exclusions as ex (ex.id)}
				<li class="flex flex-wrap items-center gap-3 rounded-2xl bg-paper-2/60 p-3">
					<Avatar member={ex.a} size={32} />
					<span class="font-semibold">{displayName(ex.a)}</span>
					<span aria-hidden="true">⇄</span>
					<Avatar member={ex.b} size={32} />
					<span class="font-semibold">{displayName(ex.b)}</span>
					<span class="chip"
						>{ex.status === 'accepted'
							? '✅ ' + m.exclusion_accepted()
							: '⏳ ' + m.exclusion_pending()}</span
					>
					{#if !party.drawnAt}
						<form method="POST" action="?/removeExclusion" class="ml-auto" use:enhance={keep}>
							<input type="hidden" name="id" value={ex.id} />
							<button class="btn-ghost btn-sm">{m.remove()}</button>
						</form>
					{/if}
				</li>
			{:else}
				<li class="text-sm text-ink-soft">{m.exclusions_none()}</li>
			{/each}
		</ul>
		{#if !party.drawnAt && data.members.length >= 2}
			<form
				method="POST"
				action="?/addExclusion"
				class="mt-4 flex flex-col gap-2 sm:flex-row"
				use:enhance={keep}
			>
				{#each ['a', 'b'] as field (field)}
					<select name={field} class="input" required aria-label={m.exclusion_pick()}>
						<option value="">{m.exclusion_pick()}</option>
						{#each data.members as mem (mem.id)}<option value={mem.id}>{displayName(mem)}</option
							>{/each}
					</select>
				{/each}
				<button class="btn-pine shrink-0">{m.exclusion_add()}</button>
			</form>
		{/if}
		{@render feedback('exclusions')}
	</section>

	<!-- danger zone -->
	<section class="card border-berry/30 lg:col-span-2">
		<h2 class="text-2xl font-bold text-berry">🧨 {m.danger_zone()}</h2>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			{#if party.archivedAt}
				<form method="POST" action="?/unarchive" use:enhance={keep}>
					<button class="btn-pine">📤 {m.unarchive()}</button>
				</form>
			{:else}
				<form method="POST" action="?/archive" use:enhance={confirmThen(m.confirm_archive())}>
					<button class="btn-ghost">🗄️ {m.archive()}</button>
				</form>
			{/if}
			<span class="text-sm text-ink-soft">{m.archive_help()}</span>
		</div>
		<details class="mt-5">
			<summary class="cursor-pointer text-sm font-semibold text-berry">{m.delete_party()}</summary>
			<form
				method="POST"
				action="?/deleteParty"
				class="mt-3 flex flex-col gap-2 sm:flex-row"
				use:enhance={keep}
			>
				<input
					name="confirm"
					class="input"
					placeholder={m.delete_confirm_ph({ name: party.name })}
					aria-label={m.delete_party()}
				/>
				<button class="btn-danger shrink-0">{m.delete_party()}</button>
			</form>
		</details>
		{@render feedback('danger')}
	</section>
</div>
