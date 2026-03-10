import { useEffect, useRef } from "react";

/**
 * Infinite scrollable 🧵 emoji grid with subtle floating effect.
 */
export default function InvisibleString() {
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	// Massive plane to simulate infinite scroll
	const PLANE_SIZE = 200_000;

	useEffect(() => {
		const el = wrapperRef.current;
		if (!el) return;

		// Center scroll so user can move in all directions
		const centerX = (PLANE_SIZE - el.clientWidth) / 2;
		const centerY = (PLANE_SIZE - el.clientHeight) / 2;
		if (typeof el.scrollTo === "function") {
			el.scrollTo({ left: centerX, top: centerY });
		}
	}, []);

	const svgEmoji = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
      <defs>
        <filter id='f' x='-50%' y='-50%' width='200%' height='200%'>
          <feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='rgba(0,0,0,0.25)'/>
        </filter>
      </defs>
      <text x='40' y='54' font-size='48' text-anchor='middle' filter='url(#f)'>🧵</text>
    </svg>
  `);

	const dataUrl = `url("data:image/svg+xml,${svgEmoji}")`;

	return (
		<div
			ref={wrapperRef}
			className="w-screen h-screen overflow-scroll bg-[radial-gradient(ellipse_at_center,_#0b10201a,_transparent_60%)]"
			style={{
				WebkitOverflowScrolling: "touch",
			}}
		>
			<a
				href="/crossword"
				style={{
					position: "fixed",
					top: 20,
					left: 20,
					zIndex: 1,
					padding: "10px 14px",
					borderRadius: 999,
					background: "rgba(255,255,255,0.88)",
					color: "#111827",
					textDecoration: "none",
					fontFamily: "inherit",
					fontSize: 14,
					fontWeight: 600,
					boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
					backdropFilter: "blur(8px)",
				}}
			>
				Open crossword
			</a>

			<div
				className="relative rounded-2xl shadow-2xl"
				style={{
					width: PLANE_SIZE,
					height: PLANE_SIZE,
					backgroundImage: dataUrl,
					backgroundRepeat: "repeat",
					backgroundSize: "80px 80px",
					animation: "drift 20s linear infinite",
				}}
			/>

			<style>{`
        @keyframes drift {
          0%   { background-position: 0px 0px; }
          100% { background-position: 80px 80px; }
        }
        a:hover { transform: translateY(-1px); }
        div::-webkit-scrollbar { width: 10px; height: 10px; }
        div::-webkit-scrollbar-thumb { background: #c7cbe1; border-radius: 8px; }
        div::-webkit-scrollbar-track { background: transparent; }
      `}</style>
		</div>
	);
}
