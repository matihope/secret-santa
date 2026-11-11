<script lang="ts">
	import { initials, displayName, type NamedMember } from '#lib/names.ts';

	let {
		member,
		size = 48,
		ring = false
	}: { member: NamedMember & { avatar: string | null }; size?: number; ring?: boolean } = $props();

	const palette = ['#b4232f', '#17382a', '#c8962b', '#24523d', '#8f1a24', '#6b5a4e'];
	const color = $derived.by(() => {
		const name = displayName(member);
		let h = 0;
		for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
		return palette[h % palette.length];
	});
</script>

{#if member.avatar}
	<img
		src="/uploads/{member.avatar}"
		alt={displayName(member)}
		width={size}
		height={size}
		class="shrink-0 rounded-full object-cover {ring ? 'ring-4 ring-gold-2' : 'ring-2 ring-snow'}"
		style="width:{size}px;height:{size}px"
	/>
{:else}
	<span
		class="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-snow {ring
			? 'ring-4 ring-gold-2'
			: 'ring-2 ring-snow'}"
		style="width:{size}px;height:{size}px;background:{color};font-size:{size * 0.38}px"
		aria-label={displayName(member)}
	>
		{initials(member)}
	</span>
{/if}
