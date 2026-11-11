/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Only handles push notifications — no offline caching (party data must always be fresh).

const sw = self as unknown as ServiceWorkerGlobalScope;

type Payload = { title: string; body: string; url: string; tag?: string };

sw.addEventListener('install', () => sw.skipWaiting());
sw.addEventListener('activate', (event) => event.waitUntil(sw.clients.claim()));

sw.addEventListener('push', (event) => {
	let data: Payload;
	try {
		data = event.data!.json() as Payload;
	} catch {
		data = { title: 'Secret Santa', body: event.data?.text() ?? '', url: '/' };
	}
	event.waitUntil(
		sw.registration.showNotification(data.title, {
			body: data.body,
			icon: '/icon-192.png',
			badge: '/badge-96.png',
			tag: data.tag,
			data: { url: data.url }
		})
	);
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL((event.notification.data?.url as string) || '/', sw.location.origin).href;
	event.waitUntil(
		(async () => {
			const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
			for (const client of windows) {
				if (new URL(client.url).origin === sw.location.origin) {
					await client.focus();
					await (client as WindowClient).navigate(url).catch(() => undefined);
					return;
				}
			}
			await sw.clients.openWindow(url);
		})()
	);
});
