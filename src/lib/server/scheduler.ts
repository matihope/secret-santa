import { drawDueParties } from './party.ts';
import { purgeExpiredSessions } from './auth.ts';
import { sendDueNotifications } from './notifications.ts';

let timer: ReturnType<typeof setInterval> | undefined;

export function startScheduler(intervalMs = 30_000) {
	if (timer) return;
	const tick = () => {
		try {
			const drawn = drawDueParties();
			if (drawn.length) console.log(`[scheduler] drew parties: ${drawn.join(', ')}`);
		} catch (e) {
			console.error('[scheduler] draw failed', e);
		}
		sendDueNotifications().catch((e) => console.error('[scheduler] notifications failed', e));
	};
	tick();
	timer = setInterval(tick, intervalMs);
	timer.unref?.();
	const cleanup = setInterval(() => purgeExpiredSessions(), 6 * 3600_000);
	cleanup.unref?.();
}
