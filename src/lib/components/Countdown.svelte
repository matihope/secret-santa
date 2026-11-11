<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let {
		target,
		label,
		compact = false
	}: { target: Date; label: string; compact?: boolean } = $props();

	let now = $state(Date.now());
	$effect(() => {
		const t = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(t);
	});

	const left = $derived(Math.max(0, target.getTime() - now));
	const parts = $derived([
		{ value: Math.floor(left / 86_400_000), label: m.cd_days() },
		{ value: Math.floor(left / 3_600_000) % 24, label: m.cd_hours() },
		{ value: Math.floor(left / 60_000) % 60, label: m.cd_minutes() },
		{ value: Math.floor(left / 1000) % 60, label: m.cd_seconds() }
	]);
	const pad = (n: number) => String(n).padStart(2, '0');
</script>

{#if compact}
	<span class="font-mono text-sm tabular-nums">
		{parts[0].value}{m.cd_days_short()}
		{pad(parts[1].value)}:{pad(parts[2].value)}:{pad(parts[3].value)}
	</span>
{:else}
	<section
		class="relative overflow-hidden rounded-[2rem] bg-holly px-4 py-7 text-cream shadow-[0_20px_50px_-25px_#0c2219] sm:px-8 sm:py-10"
		aria-live="off"
	>
		<div class="snow" aria-hidden="true">
			{#each Array(18) as _, i (i)}
				<span
					style="left:{(i * 53) % 100}%;animation-duration:{7 +
						((i * 7) % 9)}s;animation-delay:-{(i * 13) % 11}s;--drift:{((i % 5) - 2) *
						18}px;font-size:{8 + ((i * 5) % 10)}px">❄</span
				>
			{/each}
		</div>
		<p class="relative text-center text-xs font-bold tracking-[0.25em] text-gold-2 uppercase">
			{label}
		</p>
		<div class="relative mt-4 grid grid-cols-4 gap-2 sm:gap-4">
			{#each parts as part, i (i)}
				<div
					class="min-w-0 rounded-2xl bg-cream/8 px-1 py-3 text-center ring-1 ring-cream/10 sm:py-5"
				>
					<div
						class="font-display leading-none font-black tabular-nums {String(part.value).length > 2
							? 'text-[clamp(1.25rem,6.5vw,3.5rem)]'
							: 'text-[clamp(2rem,10vw,4.5rem)]'}"
						style="font-variation-settings:'SOFT' 100,'WONK' 1"
					>
						{i === 0 ? part.value : pad(part.value)}
					</div>
					<div
						class="mt-2 text-[0.65rem] font-semibold tracking-widest text-cream/70 uppercase sm:text-xs"
					>
						{part.label}
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.snow span {
		position: absolute;
		top: -20px;
		color: white;
		opacity: 0.35;
		animation-name: fall;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes fall {
		from {
			transform: translate3d(0, 0, 0);
		}
		to {
			transform: translate3d(var(--drift), 420px, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.snow {
			display: none;
		}
	}
</style>
