<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import { displayName } from '#lib/names.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let selected = $state('');
	$effect(() => {
		if (form && 'memberId' in form && typeof form.memberId === 'string') selected = form.memberId;
	});
	const member = $derived(data.members.find((x) => x.id === selected));
</script>

<div class="mx-auto max-w-xl">
	<p class="eyebrow">{data.party.name}</p>
	<h1 class="text-4xl font-black text-pine">{m.login_title()}</h1>
	<p class="mt-2 text-ink-soft">{m.login_lead()}</p>

	<form
		method="POST"
		class="mt-6 space-y-5"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
	>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each data.members as mem (mem.id)}
				<label
					class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 bg-snow p-3 text-center transition {selected ===
					mem.id
						? 'border-berry shadow-lg'
						: 'border-transparent ring-1 ring-ink/10 hover:ring-ink/30'}"
				>
					<input
						type="radio"
						name="memberId"
						value={mem.id}
						class="sr-only"
						bind:group={selected}
					/>
					<Avatar member={mem} size={56} />
					<span class="text-sm font-semibold">{displayName(mem)}</span>
					{#if mem.isAdmin}<span class="text-xs">👑</span>{/if}
				</label>
			{/each}
		</div>

		{#if member}
			<div class="animate-rise card">
				{#if member.hasPasscode}
					<label class="label" for="passcode"
						>{member.isAdmin ? m.admin_password() : m.passcode()}</label
					>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="passcode"
						name="passcode"
						type="password"
						class="input"
						autocomplete="current-password"
						autofocus
					/>
				{:else}
					<p class="text-sm text-ink-soft">🔓 {m.login_no_passcode()}</p>
				{/if}
				{#if form?.error}<p class="mt-3 error" role="alert">{errorText(form.error)}</p>{/if}
				<button class="mt-4 btn-pine w-full">{m.login_as({ name: displayName(member) })}</button>
			</div>
		{:else if form?.error}
			<p class="error" role="alert">{errorText(form.error)}</p>
		{/if}
	</form>
</div>
