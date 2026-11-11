<script lang="ts">
	import { APP_NAME } from '#lib/brand.ts';
	let {
		size = 48,
		animated = true,
		class: klass = ''
	}: { size?: number; animated?: boolean; class?: string } = $props();
</script>

<svg
	viewBox="0 0 120 120"
	width={size}
	height={size}
	class="logo {klass}"
	class:animated
	role="img"
	aria-label={APP_NAME}
>
	<!-- shadow -->
	<ellipse cx="60" cy="112" rx="40" ry="5" fill="#2b1d17" opacity=".15" />
	<g class="body">
		<!-- box -->
		<rect x="22" y="54" width="76" height="54" rx="7" fill="#b4232f" />
		<rect x="22" y="54" width="76" height="10" fill="#8f1a24" opacity=".55" />
		<rect x="54" y="54" width="12" height="54" fill="#e9c36a" />
		<rect x="54" y="54" width="3" height="54" fill="#c8962b" />
		<!-- lid -->
		<rect x="16" y="45" width="88" height="15" rx="5" fill="#c62c38" />
		<rect x="52" y="45" width="16" height="15" fill="#e9c36a" />
		<!-- santa hat, slightly askew -->
		<g transform="rotate(-9 60 44)">
			<path
				d="M30 46 C 34 22, 52 8, 74 10 C 88 11, 98 20, 100 32 C 92 26, 84 24, 78 28 C 82 34, 86 40, 90 46 Z"
				fill="#b4232f"
			/>
			<path
				d="M78 28 C 84 24, 92 26, 100 32"
				stroke="#8f1a24"
				stroke-width="2"
				fill="none"
				opacity=".6"
			/>
			<rect x="24" y="40" width="72" height="12" rx="6" fill="#fffdf8" />
			<circle cx="101" cy="34" r="7.5" fill="#fffdf8" />
		</g>
		<!-- eyebrows: one raised, suspicious -->
		<path
			d="M33 66 Q 41 60 50 64"
			stroke="#2b1d17"
			stroke-width="3"
			fill="none"
			stroke-linecap="round"
		/>
		<path
			d="M70 66 Q 79 66 87 66"
			stroke="#2b1d17"
			stroke-width="3"
			fill="none"
			stroke-linecap="round"
		/>
		<!-- eyes -->
		<ellipse cx="41" cy="76" rx="8.5" ry="9.5" fill="#fffdf8" />
		<ellipse cx="79" cy="76" rx="8.5" ry="9.5" fill="#fffdf8" />
		<g class="pupils">
			<circle cx="45" cy="78" r="4" fill="#2b1d17" />
			<circle cx="83" cy="78" r="4" fill="#2b1d17" />
			<circle cx="46.3" cy="76.6" r="1.2" fill="#fffdf8" />
			<circle cx="84.3" cy="76.6" r="1.2" fill="#fffdf8" />
		</g>
		<!-- cheeks -->
		<circle cx="32" cy="90" r="5" fill="#ff8a8a" opacity=".45" />
		<circle cx="88" cy="90" r="5" fill="#ff8a8a" opacity=".45" />
		<!-- zipped mouth: lips sealed -->
		<g class="zip">
			<path
				d="M42 91 Q 60 98 78 90"
				stroke="#2b1d17"
				stroke-width="6"
				fill="none"
				stroke-linecap="round"
			/>
			<path
				d="M42 91 Q 60 98 78 90"
				stroke="#e9c36a"
				stroke-width="2.6"
				stroke-dasharray="1.8 2.2"
				fill="none"
			/>
			<g class="pull">
				<circle cx="79" cy="90" r="3" fill="#e9c36a" stroke="#2b1d17" stroke-width="1.6" />
				<rect
					x="76"
					y="92"
					width="6"
					height="10"
					rx="2.5"
					fill="#e9c36a"
					stroke="#2b1d17"
					stroke-width="1.6"
				/>
			</g>
		</g>
	</g>
</svg>

<style>
	.logo {
		overflow: visible;
	}
	.animated .body {
		transform-origin: 60px 108px;
		animation: wiggle 3.2s ease-in-out infinite;
	}
	.animated .pupils {
		animation: shifty 4s ease-in-out infinite;
	}
	.animated .pull {
		transform-origin: 79px 90px;
		animation: swing 3.2s ease-in-out infinite;
	}
	@keyframes swing {
		0%,
		72%,
		100% {
			transform: rotate(0);
		}
		78% {
			transform: rotate(18deg);
		}
		86% {
			transform: rotate(-14deg);
		}
		94% {
			transform: rotate(6deg);
		}
	}
	@keyframes shifty {
		0%,
		35% {
			transform: translateX(0);
		}
		42%,
		62% {
			transform: translateX(-7px);
		}
		70%,
		100% {
			transform: translateX(0);
		}
	}
	@keyframes wiggle {
		0%,
		70%,
		100% {
			transform: rotate(0);
		}
		76% {
			transform: rotate(-5deg);
		}
		84% {
			transform: rotate(4deg);
		}
		92% {
			transform: rotate(-1.5deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.animated .body,
		.animated .pupils,
		.animated .pull {
			animation: none;
		}
	}
</style>
