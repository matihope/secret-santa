<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import { displayName } from '#lib/names.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import type { PageProps } from './$types';
	import type { SubmitFunction } from '$app/forms';

	let { data, form }: PageProps = $props();
	const me = $derived(data.me!);
	let uploading = $state(false);

	const keep: SubmitFunction =
		() =>
		async ({ update }) =>
			update({ reset: false });
	const msg = (section: string) =>
		form && 'section' in form && form.section === section
			? { error: form.error as string }
			: form && 'ok' in form && form.ok === section
				? { ok: true }
				: null;
</script>

{#snippet feedback(section: string)}
	{@const f = msg(section)}
	{#if f?.error}<p class="mt-3 error" role="alert">{errorText(f.error)}</p>{/if}
	{#if f?.ok}<p class="mt-3 success" role="status">✓ {m.saved()}</p>{/if}
{/snippet}

{#if data.welcome}
	<div class="mb-6 animate-rise success text-base">🎉 {m.welcome_banner()}</div>
{/if}

<div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<!-- profile -->
	<section class="card">
		<h1 class="text-3xl font-black text-pine">{m.my_profile()}</h1>

		<form
			method="POST"
			action="?/avatar"
			enctype="multipart/form-data"
			class="mt-5 flex items-center gap-4"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					uploading = false;
					await update();
				};
			}}
		>
			<Avatar member={me} size={88} ring />
			<div class="flex flex-wrap gap-2">
				<label class="btn-ghost cursor-pointer btn-sm">
					📷 {uploading ? m.uploading() : m.avatar_change()}
					<input
						type="file"
						name="avatar"
						accept="image/*"
						class="sr-only"
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					/>
				</label>
				{#if me.avatar}
					<button class="btn-ghost btn-sm" formaction="?/removeAvatar">{m.remove()}</button>
				{/if}
			</div>
		</form>
		{@render feedback('avatar')}

		<form method="POST" action="?/profile" class="mt-6 space-y-4" use:enhance={keep}>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="firstName">{m.first_name()}</label>
					<input
						id="firstName"
						name="firstName"
						class="input"
						maxlength="60"
						value={me.firstName}
					/>
				</div>
				<div>
					<label class="label" for="lastName">{m.last_name()}</label>
					<input id="lastName" name="lastName" class="input" maxlength="60" value={me.lastName} />
				</div>
			</div>
			<div>
				<label class="label" for="nickname"
					>{m.nickname()} <span class="font-normal">({m.optional()})</span></label
				>
				<input id="nickname" name="nickname" class="input" maxlength="60" value={me.nickname} />
			</div>
			<div>
				<label class="label" for="wishlist">🎁 {m.wishlist()}</label>
				<textarea
					id="wishlist"
					name="wishlist"
					rows="6"
					maxlength="4000"
					class="input"
					placeholder={m.wishlist_ph()}>{data.wishlist}</textarea
				>
				<p class="mt-1 text-xs text-ink-soft">{m.wishlist_help()}</p>
			</div>
			<button class="btn-pine">{m.save()}</button>
			{@render feedback('profile')}
		</form>
	</section>

	<div class="space-y-6">
		<!-- exclusions -->
		<section class="card">
			<h2 class="text-2xl font-bold text-pine">💑 {m.exclusion_title()}</h2>
			<p class="mt-1 text-sm text-ink-soft">{m.exclusion_help()}</p>

			<ul class="mt-4 space-y-3">
				{#each data.exclusions as ex (ex.id)}
					<li class="rounded-2xl bg-paper-2/60 p-3">
						<div class="flex items-center gap-3">
							<Avatar member={ex.other} size={36} />
							<div class="flex-1 text-sm">
								<p class="font-semibold">{displayName(ex.other)}</p>
								<p class="text-ink-soft">
									{#if ex.status === 'accepted'}✅ {m.exclusion_accepted()}
									{:else if ex.mine}⏳ {m.exclusion_waiting()}
									{:else}📨 {m.exclusion_incoming()}{/if}
								</p>
							</div>
						</div>
						{#if !data.locked}
							<div class="mt-3 flex flex-wrap gap-2">
								{#if ex.status === 'pending' && !ex.mine}
									<form method="POST" action="?/respond" use:enhance={keep}>
										<input type="hidden" name="id" value={ex.id} />
										<button name="accept" value="1" class="btn-pine btn-sm">{m.accept()}</button>
										<button name="accept" value="0" class="btn-ghost btn-sm">{m.decline()}</button>
									</form>
								{:else}
									<form method="POST" action="?/withdraw" use:enhance={keep}>
										<input type="hidden" name="id" value={ex.id} />
										<button class="btn-ghost btn-sm"
											>{ex.status === 'pending' ? m.cancel() : m.remove()}</button
										>
									</form>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>

			{#if data.locked}
				<p class="mt-3 text-sm text-ink-soft">🔒 {m.locked_after_draw()}</p>
			{:else if !data.exclusions.length}
				{#if data.candidates.length}
					<form method="POST" action="?/exclude" class="mt-3 flex gap-2" use:enhance={keep}>
						<select name="targetId" class="input" aria-label={m.exclusion_pick()} required>
							<option value="">{m.exclusion_pick()}</option>
							{#each data.candidates as c (c.id)}
								<option value={c.id}>{displayName(c)}</option>
							{/each}
						</select>
						<button class="btn-pine shrink-0">{m.propose()}</button>
					</form>
				{:else}
					<p class="mt-3 text-sm text-ink-soft">
						{data.others ? m.exclusion_none_available() : m.exclusion_nobody()}
					</p>
				{/if}
			{/if}
			{@render feedback('exclusion')}
		</section>

		{#if me.isAdmin}
			<section class="card">
				<h2 class="text-2xl font-bold text-pine">🎲 {m.participation()}</h2>
				<form method="POST" action="?/participates" class="mt-3" use:enhance={keep}>
					<label class="flex items-center gap-3">
						<input
							type="checkbox"
							name="participates"
							class="h-5 w-5 rounded text-pine"
							checked={me.participates}
							disabled={data.locked}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						/>
						<span>{m.admin_participates()}</span>
					</label>
				</form>
				{@render feedback('participates')}
			</section>
		{/if}

		<!-- passcode -->
		<section class="card">
			<h2 class="text-2xl font-bold text-pine">
				🔐 {me.isAdmin ? m.admin_password() : m.passcode()}
			</h2>
			{#if !me.hasPasscode}
				<p class="mt-2 error">⚠️ {m.no_passcode_warning()}</p>
			{/if}
			<form method="POST" action="?/passcode" class="mt-4 space-y-3" use:enhance={keep}>
				{#if me.hasPasscode}
					<input
						name="current"
						type="password"
						class="input"
						placeholder={m.current_passcode()}
						autocomplete="current-password"
						aria-label={m.current_passcode()}
					/>
				{/if}
				<input
					name="passcode"
					type="password"
					class="input"
					placeholder={m.new_passcode()}
					autocomplete="new-password"
					aria-label={m.new_passcode()}
				/>
				<input
					name="passcode2"
					type="password"
					class="input"
					placeholder={m.repeat_password()}
					autocomplete="new-password"
					aria-label={m.repeat_password()}
				/>
				<div class="flex flex-wrap gap-2">
					<button class="btn-pine">{m.save()}</button>
					{#if me.hasPasscode && !me.isAdmin}
						<button class="btn-ghost" name="remove" value="1">{m.passcode_remove()}</button>
					{/if}
				</div>
				{@render feedback('passcode')}
			</form>
		</section>
	</div>
</div>
