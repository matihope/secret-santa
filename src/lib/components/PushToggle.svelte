<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';

	let { partyId, vapidKey, endpoints }: { partyId: string; vapidKey: string; endpoints: string[] } =
		$props();

	type State = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';
	let status = $state<State>('loading');
	let busy = $state(false);
	let note = $state('');
	let endpoint = '';

	const api = (method: string, body?: unknown, query = '') =>
		fetch(`/p/${partyId}/push${query}`, {
			method,
			headers: { 'content-type': 'application/json' },
			body: body ? JSON.stringify(body) : '{}'
		});

	function keyBytes(base64url: string) {
		const b64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4))
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
	}

	onMount(async () => {
		const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
		const standalone =
			matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		if (
			!('serviceWorker' in navigator) ||
			!('PushManager' in window) ||
			!('Notification' in window)
		) {
			status = ios && !standalone ? 'ios-install' : 'unsupported';
			return;
		}
		if (Notification.permission === 'denied') {
			status = 'denied';
			return;
		}
		const reg = await navigator.serviceWorker.getRegistration();
		const sub = await reg?.pushManager.getSubscription();
		endpoint = sub?.endpoint ?? '';
		status = sub && endpoints.includes(sub.endpoint) ? 'on' : 'off';
	});

	async function enable() {
		busy = true;
		note = '';
		try {
			if ((await Notification.requestPermission()) !== 'granted') {
				status = Notification.permission === 'denied' ? 'denied' : 'off';
				return;
			}
			const reg = await navigator.serviceWorker.ready;
			const sub =
				(await reg.pushManager.getSubscription()) ??
				(await reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: keyBytes(vapidKey)
				}));
			const res = await api('POST', sub.toJSON());
			if (!res.ok) throw new Error(String(res.status));
			endpoint = sub.endpoint;
			status = 'on';
		} catch (e) {
			console.error(e);
			note = m.push_error();
		} finally {
			busy = false;
		}
	}

	async function disable() {
		busy = true;
		note = '';
		// keep the browser subscription: other parties on this device may still use it
		await api('DELETE', { endpoint }).catch(() => undefined);
		status = 'off';
		busy = false;
	}

	async function test() {
		busy = true;
		const res = await api('POST', undefined, '?test').catch(() => null);
		note = res?.ok ? m.push_test_sent() : m.push_error();
		busy = false;
	}
</script>

<section class="card" id="notifications">
	<h2 class="text-2xl font-bold text-pine">{m.push_section()}</h2>
	<p class="mt-1 text-sm text-ink-soft">{m.push_intro()}</p>

	<div class="mt-4">
		{#if status === 'loading'}
			<p class="text-sm text-ink-soft">…</p>
		{:else if status === 'unsupported'}
			<p class="text-sm text-ink-soft">{m.push_unsupported()}</p>
		{:else if status === 'ios-install'}
			<p class="rounded-2xl bg-paper-2/60 p-3 text-sm">📲 {m.push_ios_install()}</p>
		{:else if status === 'denied'}
			<p class="error">{m.push_denied()}</p>
		{:else if status === 'off'}
			<button class="btn-pine" disabled={busy} onclick={enable}>🔔 {m.push_enable()}</button>
		{:else}
			<p class="font-semibold text-pine">✓ {m.push_on()}</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<button class="btn-ghost btn-sm" disabled={busy} onclick={test}>{m.push_test()}</button>
				<button class="btn-ghost btn-sm" disabled={busy} onclick={disable}
					>{m.push_disable()}</button
				>
			</div>
		{/if}
		{#if note}<p class="mt-3 text-sm text-ink-soft" role="status">{note}</p>{/if}
	</div>
</section>
