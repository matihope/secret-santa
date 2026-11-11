<script lang="ts">
	import { displayName, type NamedMember } from '#lib/names.ts';
	import { avatarDataUri } from '#lib/avatar-art.ts';

	let {
		member,
		size = 48,
		ring = false
	}: {
		member: NamedMember & { id: string; avatar: string | null };
		size?: number;
		ring?: boolean;
	} = $props();

	// No photo → a cartoon person generated from the member id (same id, same face).
	const src = $derived(member.avatar ? `/uploads/${member.avatar}` : avatarDataUri(member.id));
</script>

<img
	{src}
	alt={displayName(member)}
	width={size}
	height={size}
	class="shrink-0 rounded-full object-cover {ring ? 'ring-4 ring-gold-2' : 'ring-2 ring-snow'}"
	style="width:{size}px;height:{size}px"
/>
