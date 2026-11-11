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
		<!-- bandit mask: a secret agent of gifts -->
		<path
			class="ties"
			d="M96 71 q 10 -2 16 4 q -8 -1 -14 2 z M96 74 q 9 3 12 10 q -6 -4 -13 -5 z"
			fill="#2b1d17"
		/>
		<path
			d="M24 71 C 28 62, 50 62, 60 68 C 70 62, 92 62, 96 71 C 98 81, 88 88, 76 86 C 68 85, 64 80, 60 80 C 56 80, 52 85, 44 86 C 32 88, 22 81, 24 71 Z"
			fill="#2b1d17"
		/>
		<!-- eyes -->
		<ellipse cx="42" cy="75" rx="7.5" ry="6.5" fill="#fffdf8" />
		<ellipse cx="78" cy="75" rx="7.5" ry="6.5" fill="#fffdf8" />
		<g class="pupils">
			<circle cx="45" cy="76" r="3.5" fill="#2b1d17" />
			<circle cx="81" cy="76" r="3.5" fill="#2b1d17" />
			<circle cx="46.3" cy="74.6" r="1.05" fill="#fffdf8" />
			<circle cx="82.3" cy="74.6" r="1.05" fill="#fffdf8" />
		</g>
		<!-- cheeks -->
		<circle cx="32" cy="93" r="5" fill="#ff8a8a" opacity=".45" />
		<circle cx="88" cy="93" r="5" fill="#ff8a8a" opacity=".45" />
		<!-- sly smile -->
		<path
			d="M50 96 Q 60 100 70 95"
			stroke="#2b1d17"
			stroke-width="3"
			fill="none"
			stroke-linecap="round"
		/>
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
	.animated .ties {
		transform-origin: 96px 72px;
		animation: flutter 3.2s ease-in-out infinite;
	}
	@keyframes flutter {
		0%,
		72%,
		100% {
			transform: rotate(0);
		}
		78% {
			transform: rotate(14deg);
		}
		86% {
			transform: rotate(-10deg);
		}
		94% {
			transform: rotate(4deg);
		}
	}
	@keyframes shifty {
		0%,
		35% {
			transform: translateX(0);
		}
		42%,
		62% {
			transform: translateX(-6px);
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
		.animated .ties {
			animation: none;
		}
	}
</style>
