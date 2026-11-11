<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import Logo from '#lib/components/Logo.svelte';
</script>

<div class="mx-auto max-w-md pt-10 text-center">
	<Logo size={120} class="mx-auto" />
	<h1 class="mt-4 font-display text-6xl font-black text-berry">{page.status}</h1>
	<p class="mt-2 text-lg text-ink-soft">
		{page.status === 404 ? m.error_404() : m.error_generic()}
	</p>
	<a href="/" class="mt-6 btn-pine">{m.go_home()}</a>
</div>
