<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import { fullName } from '#lib/names.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const member = $derived(data.member);
	let showWishlist = $state(false);
	// svelte-ignore state_referenced_locally
	let wish = $state(data.member.wishlist);
	const keep: SubmitFunction =
		() =>
		async ({ update }) =>
			update({ reset: false });
</script>

<a href="/p/{data.party.id}/admin" class="text-sm font-semibold text-ink-soft hover:text-ink"
	>← {m.admin_title()}</a
>

<div class="mx-auto mt-4 max-w-2xl space-y-6">
	<section class="card">
		<div class="flex items-center gap-4">
			<Avatar {member} size={72} ring />
			<div>
				<p class="eyebrow">{m.edit_member()}</p>
				<h1 class="text-3xl font-black text-pine">{fullName(member)}</h1>
			</div>
		</div>
		<form
			method="POST"
			action="?/avatar"
			enctype="multipart/form-data"
			class="mt-4 flex flex-wrap gap-2"
			use:enhance
		>
			<label class="btn-ghost cursor-pointer btn-sm">
				📷 {m.avatar_change()}
				<input
					type="file"
					name="avatar"
					accept="image/*"
					class="sr-only"
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				/>
			</label>
			{#if member.avatar}<button class="btn-ghost btn-sm" formaction="?/removeAvatar"
					>{m.remove()}</button
				>{/if}
		</form>

		<form method="POST" action="?/save" class="mt-6 space-y-4" use:enhance={keep}>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="firstName">{m.first_name()}</label>
					<input
						id="firstName"
						name="firstName"
						class="input"
						maxlength="60"
						value={member.firstName}
					/>
				</div>
				<div>
					<label class="label" for="lastName">{m.last_name()}</label>
					<input
						id="lastName"
						name="lastName"
						class="input"
						maxlength="60"
						value={member.lastName}
					/>
				</div>
			</div>
			<div>
				<label class="label" for="nickname">{m.nickname()}</label>
				<input id="nickname" name="nickname" class="input" maxlength="60" value={member.nickname} />
			</div>

			<div>
				<div class="flex items-center justify-between">
					<span class="label">🎁 {m.wishlist()}</span>
					<button
						type="button"
						class="mb-1.5 btn-ghost btn-sm"
						onclick={() => (showWishlist = !showWishlist)}
					>
						{showWishlist ? m.hide() : m.reveal_and_edit()}
					</button>
				</div>
				{#if showWishlist}
					<textarea name="wishlist" rows="5" maxlength="4000" class="input" bind:value={wish}
					></textarea>
				{:else}
					<input type="hidden" name="wishlist" value={wish} />
					<p class="rounded-2xl bg-paper-2/70 px-4 py-3 tracking-widest text-ink-soft select-none">
						{wish ? '•'.repeat(12) : m.wishlist_empty()}
					</p>
					<p class="mt-1 text-xs text-ink-soft">{m.wishlist_spoiler_note()}</p>
				{/if}
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex items-center gap-3 rounded-2xl bg-paper-2/60 p-3">
					<input
						type="checkbox"
						name="participates"
						class="h-5 w-5 rounded text-pine"
						checked={member.participates}
						disabled={!!data.party.drawnAt}
					/>
					<span class="text-sm font-semibold">{m.participates()}</span>
				</label>
				<label class="flex items-center gap-3 rounded-2xl bg-paper-2/60 p-3">
					<input
						type="checkbox"
						name="isAdmin"
						class="h-5 w-5 rounded text-pine"
						checked={member.isAdmin}
					/>
					<span class="text-sm font-semibold">👑 {m.party_admin()}</span>
				</label>
			</div>

			<div class="rounded-2xl border border-gold/50 bg-gold-2/15 p-4">
				<p class="font-semibold">
					🔐 {m.passcode()}: {member.hasPasscode ? m.passcode_set() : m.passcode_not_set()}
				</p>
				<input
					name="passcode"
					type="password"
					class="mt-3 input"
					placeholder={m.new_passcode()}
					autocomplete="new-password"
					aria-label={m.new_passcode()}
				/>
				{#if member.hasPasscode}
					<label class="mt-3 flex items-center gap-2 text-sm">
						<input type="checkbox" name="removePasscode" class="rounded text-berry" />
						{m.passcode_remove()}
					</label>
				{/if}
				<p class="mt-2 text-xs text-ink-soft">{m.passcode_admin_note()}</p>
			</div>

			<button class="btn-pine">{m.save()}</button>
			{#if form?.error}<p class="error" role="alert">{errorText(form.error)}</p>{/if}
			{#if form?.ok}<p class="success" role="status">✓ {m.saved()}</p>{/if}
		</form>
	</section>

	<form
		method="POST"
		action="?/delete"
		class="flex flex-wrap items-center justify-between gap-3 card border-berry/30"
		use:enhance={({ cancel }) => {
			if (
				!confirm(data.party.drawnAt ? m.confirm_delete_member_drawn() : m.confirm_delete_member())
			)
				cancel();
			return async ({ update }) => update();
		}}
	>
		<p class="text-sm text-ink-soft">
			{data.party.drawnAt ? m.delete_member_drawn_note() : m.delete_member_note()}
		</p>
		<button class="btn-danger">{m.delete_member()}</button>
	</form>
</div>
