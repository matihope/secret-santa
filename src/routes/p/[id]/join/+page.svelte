<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import Logo from '#lib/components/Logo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let passcode = $state('');
	let busy = $state(false);
</script>

<div class="mx-auto max-w-lg">
	<div class="flex items-center gap-3">
		<Logo size={60} />
		<div>
			<p class="eyebrow">{data.party.name}</p>
			<h1 class="text-4xl font-black text-pine">{m.join_title()}</h1>
		</div>
	</div>

	{#if data.closed}
		<p class="mt-6 error">{m.err_join_closed()}</p>
	{:else}
		<form
			method="POST"
			class="mt-6 space-y-5 card"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					busy = false;
					await update({ reset: false });
				};
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="firstName">{m.first_name()}</label>
					<input
						id="firstName"
						name="firstName"
						class="input"
						maxlength="60"
						autocomplete="given-name"
						value={form?.firstName ?? ''}
					/>
				</div>
				<div>
					<label class="label" for="lastName">{m.last_name()}</label>
					<input
						id="lastName"
						name="lastName"
						class="input"
						maxlength="60"
						autocomplete="family-name"
						value={form?.lastName ?? ''}
					/>
				</div>
			</div>
			<div>
				<label class="label" for="nickname"
					>{m.nickname()} <span class="font-normal">({m.optional()})</span></label
				>
				<input
					id="nickname"
					name="nickname"
					class="input"
					maxlength="60"
					value={form?.nickname ?? ''}
				/>
				<p class="mt-1 text-xs text-ink-soft">{m.name_help()}</p>
			</div>

			<div class="rounded-2xl border border-gold/50 bg-gold-2/15 p-4">
				<p class="font-semibold">🔐 {m.passcode_title()}</p>
				<p class="mt-1 text-sm text-ink-soft">{m.passcode_recommend()}</p>
				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<input
						name="passcode"
						type="password"
						class="input"
						placeholder={m.passcode()}
						autocomplete="new-password"
						bind:value={passcode}
						aria-label={m.passcode()}
					/>
					<input
						name="passcode2"
						type="password"
						class="input"
						placeholder={m.repeat_password()}
						autocomplete="new-password"
						aria-label={m.repeat_password()}
					/>
				</div>
				{#if !passcode}
					<p class="mt-2 text-xs font-semibold text-berry">⚠️ {m.no_passcode_warning()}</p>
				{/if}
			</div>

			{#if form?.error}<p class="error" role="alert">{errorText(form.error)}</p>{/if}
			<button class="btn-primary w-full text-lg" disabled={busy}>🎅 {m.join()}</button>
			<p class="text-center text-sm">
				<a href="/p/{data.party.id}/login" class="text-ink-soft underline underline-offset-2"
					>{m.login_existing()}</a
				>
			</p>
		</form>
	{/if}
</div>
