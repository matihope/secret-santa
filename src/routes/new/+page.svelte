<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { errorText } from '#lib/errors.ts';
	import { RULES, type RuleEntry, type RuleValue } from '#lib/rules/catalog.ts';
	import { CURRENCIES } from '#lib/currencies.ts';
	import RuleValueInput from '#lib/components/RuleValueInput.svelte';
	import RuleBuilder from '#lib/components/RuleBuilder.svelte';
	import Statute from '#lib/components/Statute.svelte';
	import { TIMEZONE } from '$app/env/public';
	import { fromInputValue } from '#lib/time.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const steps = [
		m.wizard_step_basics,
		m.wizard_step_questions,
		m.wizard_step_rules,
		m.wizard_step_you
	];
	let step = $state(0);
	let busy = $state(false);
	let localError = $state('');

	// basics
	let name = $state('');
	let description = $state('');
	let partyAt = $state('');
	let location = $state('');
	let drawAt = $state('');
	let currency = $state('PLN');
	let isPublic = $state(false);
	let codeMode = $state<'auto' | 'custom'>('auto');
	let code = $state('');

	// questionnaire
	const questions = RULES.filter((r) => r.wizard);
	let answers = $state<Record<string, { on: boolean; value: RuleValue }>>(
		Object.fromEntries(
			questions.map((q) => [q.type, { on: q.wizard === 'yes', value: q.defaultValue() }])
		)
	);
	let rules = $state<RuleEntry[]>([]);

	$effect(() => {
		// sensible default: gifts ready by the party
		if (partyAt && !answers.ready_by.value.at) answers.ready_by.value.at = partyAt;
	});

	$effect(() => {
		if (form?.error) {
			step = form.step;
			localError = '';
		}
	});

	function validate(s: number): string {
		if (s === 0) {
			if (!name.trim()) return 'party_name_required';
			if (!drawAt) return 'draw_required';
			const d = fromInputValue(drawAt, TIMEZONE);
			if (!d || d <= new Date()) return 'draw_in_past';
			if (codeMode === 'custom' && code.replace(/[^a-z0-9]/gi, '').length < 4) return 'code_format';
		}
		return '';
	}

	function next() {
		localError = validate(step);
		if (localError) return;
		if (step === 1) {
			rules = questions
				.filter((q) => answers[q.type].on)
				.map((q) => ({ type: q.type, value: { ...answers[q.type].value } }));
		}
		step = Math.min(step + 1, steps.length - 1);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
	function back() {
		localError = '';
		step = Math.max(step - 1, 0);
	}

	const error = $derived(localError || (form?.error ?? ''));
</script>

<svelte:head><title>{m.create_party()} · {m.app_name()}</title></svelte:head>

<div class="mx-auto max-w-2xl pt-4">
	<p class="eyebrow">{m.create_party()}</p>
	<h1 class="mt-2 text-4xl font-black text-pine">{steps[step]()}</h1>

	<!-- bauble progress -->
	<ol class="mt-5 flex items-center gap-2" aria-label={m.wizard_progress()}>
		{#each steps as label, i (i)}
			<li class="flex flex-1 items-center gap-2">
				<span
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition {i <
					step
						? 'border-pine bg-pine text-snow'
						: i === step
							? 'border-berry bg-berry text-snow'
							: 'border-ink/20 bg-snow text-ink-soft'}"
					aria-current={i === step ? 'step' : undefined}
					title={label()}>{i < step ? '✓' : i + 1}</span
				>
				{#if i < steps.length - 1}
					<span class="h-0.5 flex-1 rounded {i < step ? 'bg-pine' : 'bg-ink/15'}"></span>
				{/if}
			</li>
		{/each}
	</ol>

	<form
		method="POST"
		class="mt-6"
		use:enhance={({ cancel }) => {
			if (step < steps.length - 1) {
				cancel();
				next();
				return;
			}
			busy = true;
			return async ({ update }) => {
				busy = false;
				await update({ reset: false });
			};
		}}
	>
		<!-- step 0: basics -->
		<div class="space-y-5 card" class:hidden={step !== 0}>
			<div>
				<label class="label" for="name">{m.party_name()}</label>
				<input
					id="name"
					name="name"
					class="input"
					maxlength="120"
					placeholder={m.party_name_ph()}
					bind:value={name}
				/>
			</div>
			<div>
				<label class="label" for="description"
					>{m.party_description()} <span class="font-normal">({m.optional()})</span></label
				>
				<textarea
					id="description"
					name="description"
					rows="2"
					class="input"
					maxlength="2000"
					bind:value={description}></textarea>
			</div>
			<div class="grid gap-5 sm:grid-cols-2">
				<div>
					<label class="label" for="drawAt">🎲 {m.draw_when()}</label>
					<input
						id="drawAt"
						name="drawAt"
						type="datetime-local"
						class="input"
						bind:value={drawAt}
					/>
					<p class="mt-1 text-xs text-ink-soft">{m.draw_when_help()}</p>
				</div>
				<div>
					<label class="label" for="partyAt"
						>🎄 {m.party_when()} <span class="font-normal">({m.optional()})</span></label
					>
					<input
						id="partyAt"
						name="partyAt"
						type="datetime-local"
						class="input"
						bind:value={partyAt}
					/>
				</div>
			</div>
			<div>
				<label class="label" for="location"
					>📍 {m.party_where()} <span class="font-normal">({m.optional()})</span></label
				>
				<input
					id="location"
					name="location"
					class="input"
					maxlength="300"
					placeholder={m.party_where_ph()}
					bind:value={location}
				/>
			</div>
			<div class="grid gap-5 sm:grid-cols-2">
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
						bind:checked={isPublic}
					/>
					<span class="text-sm"
						><b>{m.party_public()}</b><br /><span class="text-ink-soft"
							>{m.party_public_help()}</span
						></span
					>
				</label>
			</div>
			<fieldset>
				<legend class="label">{m.party_code()}</legend>
				<div class="flex flex-wrap gap-2">
					<label
						class="btn border btn-sm {codeMode === 'auto'
							? 'border-pine bg-pine text-snow'
							: 'border-ink/15 bg-snow'}"
					>
						<input
							type="radio"
							name="codeMode"
							value="auto"
							class="sr-only"
							bind:group={codeMode}
						/>
						🎲 {m.code_auto()}
					</label>
					<label
						class="btn border btn-sm {codeMode === 'custom'
							? 'border-pine bg-pine text-snow'
							: 'border-ink/15 bg-snow'}"
					>
						<input
							type="radio"
							name="codeMode"
							value="custom"
							class="sr-only"
							bind:group={codeMode}
						/>
						✏️ {m.code_custom()}
					</label>
				</div>
				{#if codeMode === 'custom'}
					<input
						name="code"
						class="mt-3 input font-mono tracking-widest uppercase"
						maxlength="40"
						placeholder="KOLEDA-2026"
						bind:value={code}
					/>
					<p class="mt-1 text-xs text-ink-soft">{m.code_custom_help()}</p>
				{/if}
			</fieldset>
		</div>

		<!-- step 1: questionnaire -->
		<div class="space-y-3" class:hidden={step !== 1}>
			<p class="text-ink-soft">{m.wizard_questions_lead()}</p>
			{#each questions as q, i (q.type)}
				{@const a = answers[q.type]}
				<div class="card !p-4 transition {a.on ? '' : 'opacity-75'}">
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">{q.icon}</span>
						<div class="flex-1">
							<p class="font-semibold">{q.question()}</p>
							<div class="mt-2 flex gap-2" role="radiogroup" aria-label={q.question()}>
								<button
									type="button"
									role="radio"
									aria-checked={a.on}
									class="btn border btn-sm {a.on
										? 'border-pine bg-pine text-snow'
										: 'border-ink/15 bg-snow'}"
									onclick={() => (a.on = true)}>{m.yes()}</button
								>
								<button
									type="button"
									role="radio"
									aria-checked={!a.on}
									class="btn border btn-sm {!a.on
										? 'border-ink bg-ink text-snow'
										: 'border-ink/15 bg-snow'}"
									onclick={() => (a.on = false)}>{m.no_or_na()}</button
								>
							</div>
							{#if a.on && q.input.kind !== 'none'}
								<div class="mt-3"><RuleValueInput def={q} bind:value={a.value} {currency} /></div>
							{/if}
						</div>
						<span class="text-xs font-bold text-ink-soft">{i + 1}/{questions.length}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- step 2: rule builder -->
		<div class="space-y-6" class:hidden={step !== 2}>
			<div class="card">
				<p class="mb-4 text-ink-soft">{m.wizard_rules_lead()}</p>
				<RuleBuilder bind:rules {currency} />
			</div>
			<Statute
				{rules}
				{currency}
				partyAt={fromInputValue(partyAt, TIMEZONE)}
				{location}
				drawAt={fromInputValue(drawAt, TIMEZONE)}
			/>
		</div>

		<!-- step 3: admin -->
		<div class="space-y-5 card" class:hidden={step !== 3}>
			<p class="text-ink-soft">{m.wizard_you_lead()}</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="firstName">{m.first_name()}</label>
					<input
						id="firstName"
						name="firstName"
						class="input"
						maxlength="60"
						autocomplete="given-name"
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
					/>
				</div>
			</div>
			<div>
				<label class="label" for="nickname"
					>{m.nickname()} <span class="font-normal">({m.optional()})</span></label
				>
				<input id="nickname" name="nickname" class="input" maxlength="60" />
				<p class="mt-1 text-xs text-ink-soft">{m.name_help()}</p>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="password">{m.admin_password()}</label>
					<input
						id="password"
						name="password"
						type="password"
						class="input"
						autocomplete="new-password"
					/>
				</div>
				<div>
					<label class="label" for="password2">{m.repeat_password()}</label>
					<input
						id="password2"
						name="password2"
						type="password"
						class="input"
						autocomplete="new-password"
					/>
				</div>
			</div>
			<label class="flex items-center gap-3 rounded-2xl bg-paper-2/60 p-3">
				<input type="checkbox" name="participates" class="h-5 w-5 rounded text-pine" checked />
				<span class="text-sm"
					><b>{m.admin_participates()}</b><br /><span class="text-ink-soft"
						>{m.admin_participates_help()}</span
					></span
				>
			</label>
		</div>

		{#if error}
			<p class="mt-4 error" role="alert">{errorText(error)}</p>
		{/if}

		<div class="mt-6 flex items-center justify-between gap-3">
			{#if step > 0}
				<button type="button" class="btn-ghost" onclick={back}>← {m.back()}</button>
			{:else}
				<a href="/" class="btn-ghost">{m.cancel()}</a>
			{/if}
			{#if step < steps.length - 1}
				<button type="button" class="btn-pine" onclick={next}>{m.next()} →</button>
			{:else}
				<button class="btn-primary" disabled={busy}>🎁 {m.create_party()}</button>
			{/if}
		</div>
	</form>
</div>
