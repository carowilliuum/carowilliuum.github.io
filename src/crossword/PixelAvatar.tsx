type PixelAvatarProps = {
	seed: string;
	label: string;
	color: string;
	className?: string;
};

type AvatarVariant = {
	name: string;
	rows: string[];
};

const AVATAR_VARIANTS: AvatarVariant[] = [
	{
		name: "fox",
		rows: [
			"................",
			"...D........D...",
			"..DAD......DAD..",
			"..DBBD....DBBD..",
			"...DBBBBBBBBD...",
			"..DBBBBBBBBBBD..",
			"..BBLEBBEBLBB...",
			"..BBBBBBBBBBBD..",
			"...BBBAAAABBD...",
			"....BBAAAABB....",
			".....DDBBDD.....",
			".....BBBBBB.....",
			"....BB....BB....",
			"...DD......DD...",
			"................",
			"................",
		],
	},
	{
		name: "owl",
		rows: [
			"................",
			"....D......D....",
			"...DAD....DAD...",
			"..DABBBBBBBAD...",
			"..BBBBBBBBBBBB..",
			".BBBLEABBAELBBB.",
			".BBBLEABBAELBBB.",
			".BBBBBBDDBBBBBB.",
			"..BBBBBAABBBBB..",
			"...BBBBBBBBBB...",
			"....DBBBBBBD....",
			".....BB..BB.....",
			"....DD....DD....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "frog",
		rows: [
			"................",
			"....BBB..BBB....",
			"...BLEB..BLEB...",
			"..BBBBBBBBBBBB..",
			"..BBBBBBBBBBBB..",
			".BBBBBAAAABBBBB.",
			"..BBBBBBBBBBBB..",
			"...BBBDDBBBB....",
			"..BBBBBBBBBBBB..",
			"..AABBBBBBBBAA..",
			".AA..BBBBBB..AA.",
			".....BB..BB.....",
			"....DD....DD....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "dragon",
		rows: [
			"................",
			".....A....A.....",
			"....ADA..ADA....",
			"...ADBBBBBDA....",
			"..ADBBBBBBBDA...",
			".DDBBBEBBEBBDD..",
			".BBBBBBBBBBBBB..",
			"..BBBLAALBBBB...",
			"..ABBBBBBBBBA...",
			".AAABBBBBBBAAA..",
			"AA..BBBBBB..AA..",
			".....BB..BB.....",
			"....DD....DD....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "wizard",
		rows: [
			".......A........",
			"......AAA.......",
			".....AAAAA......",
			"....AADADAA.....",
			"...AAAAAAAAA....",
			".....BBBBB......",
			"....BLELEB......",
			"....BBBBB.......",
			"...BDDDDDB......",
			"..BDBBBBBDB.....",
			".ABBBBBBBBBA....",
			"...BB...BB......",
			"...DD...DD......",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "cactus",
		rows: [
			"................",
			".......BB.......",
			"......BLLB......",
			"......BBBB......",
			"..BB..BBBB..BB..",
			".BBBB.BBBB.BBBB.",
			".BBBBBBBBBBBBBB.",
			"..BBBBBBBBBBBB..",
			"......BBBB......",
			"......BBBB......",
			"......BBBB......",
			".....DBBBBD.....",
			"....DDDDDDDD....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "mushroom",
		rows: [
			"................",
			".....BBBBBB.....",
			"...BBBBBBBBBB...",
			"..BBBAABBAABBB..",
			".BBBBBBBBBBBBBB.",
			".BBBBBAAAABBBBB.",
			"..DDDDDDDDDDDD..",
			".....LLLLLL.....",
			"....LLLLLLLL....",
			"....LLELLELL....",
			"....LLLLLLLL....",
			".....LLLLLL.....",
			".....DDDDDD.....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "geode",
		rows: [
			"................",
			"......DDDD......",
			"....DDBBBBDD....",
			"...DBBBBBBBBD...",
			"..DBBLLLLBBBD...",
			"..DBLAAAALBBD...",
			"..DBLAAAAALBD...",
			"..DBBLAAAABBD...",
			"...DBBLLLBBBD...",
			"....DBBBBBBD....",
			".....DDBBDD.....",
			".......DD.......",
			"................",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "turtle",
		rows: [
			"................",
			".....DDDD.......",
			"...DDBBBBDD.....",
			"..DBBLLLLBBD....",
			".DBBLAAAALBBD...",
			".DBLAAAAAALBD...",
			".DBBLAAAALBBD...",
			"..DBBLLLLBBD....",
			"...DDBBBBDD..BB.",
			"..DD.BBBB...BEB.",
			".DD..BBBB....BB.",
			".....DDDD.......",
			"....DD..DD......",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "cat",
		rows: [
			"................",
			"..D..........D..",
			".DAD........DAD.",
			".DABBBBBBBBBDAD.",
			"..BBBBBBBBBBBB..",
			".BBBLEBBEBLBBB..",
			".BBBBBBBBBBBBBB.",
			".BBBAAABBAAABBB.",
			"..BBBBBBBBBBBB..",
			"...BBBDDBBBB....",
			"....BBBBBB......",
			"...BB....BB.....",
			"...DD....DD.....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "phoenix",
		rows: [
			"................",
			".......A........",
			"...A..AAA..A....",
			"..AABBBBBBBAA...",
			".AABBBEBBEBBAA..",
			"..AABBBBBBBAA...",
			"...ABBLAAABAA...",
			"....BBBBBBBB....",
			"...AABBBBBBAA...",
			"..AA..BBBB..AA..",
			".AA...BBBB...AA.",
			"......BBBB......",
			".....DDBBDD.....",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "ghost",
		rows: [
			"................",
			".....DDDDDD.....",
			"....DBBBBBBD....",
			"...DBBBBBBBBD...",
			"...BBBEBBEBB....",
			"..DBBBBBBBBD....",
			"..DBBBBBBBBD....",
			"..DBBBBBBBBD....",
			"..DBBLBBLBBD....",
			"..DBBBBBBBBD....",
			"..DBBDBBDBBD....",
			"...DD..DD..D....",
			"................",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "bonsai",
		rows: [
			"................",
			".....BBBBBB.....",
			"...BBBBBBBBBB...",
			"..BBBLBBBBLBB...",
			"...BBBBBBBBB....",
			"....BBBBBB......",
			"......DD........",
			".....DDDD.......",
			"....DDBDDD......",
			"...DD..DD.......",
			"......DD........",
			".....AAAA.......",
			"....AAAAAA......",
			"....DDDDDD......",
			"................",
			"................",
		],
	},
	{
		name: "crystal",
		rows: [
			"................",
			".......A........",
			"......ABA.......",
			".....ABBA.......",
			"....ABLBBA......",
			"...ABLLBBBA.....",
			"..ABLLBBBBBA....",
			"..DBBBBBBBBD....",
			"...DBBBBBBD.....",
			"....DBBBBD......",
			".....DBBD.......",
			"......DD........",
			"....DDDDDD......",
			"................",
			"................",
			"................",
		],
	},
	{
		name: "monolith",
		rows: [
			"................",
			"......DDDD......",
			".....DBBBD......",
			".....DBBBD......",
			".....DBLBD......",
			".....DBBBD......",
			".....DBABD......",
			".....DBBBD......",
			".....DBLBD......",
			".....DBBBD......",
			".....DBBBD......",
			".....DBBBD......",
			"....DDDDDD......",
			"...DDDDDDDD.....",
			"................",
			"................",
		],
	},
	{
		name: "moon moth",
		rows: [
			"................",
			"..AA........AA..",
			".AALA......ALAA.",
			".AALLA....ALLAA.",
			"..AALBBBBBBAA...",
			"...ABBELEBBA....",
			"....BBBBBBB.....",
			"...AABBBBBBAA...",
			"..AA.BBBBB.AA...",
			".AA..BBBBB..AA..",
			".....BB.BB......",
			"....DD...DD.....",
			"................",
			"................",
			"................",
			"................",
		],
	},
];

function centerRows(rows: string[]) {
	let minX = 16;
	let minY = 16;
	let maxX = -1;
	let maxY = -1;

	rows.forEach((row, y) => {
		row.split("").forEach((cell, x) => {
			if (cell === ".") {
				return;
			}

			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		});
	});

	if (maxX < 0 || maxY < 0) {
		return rows;
	}

	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;
	const shiftX = centerX <= 6.5 ? 1 : centerX >= 8.5 ? -1 : 0;
	const shiftY = centerY <= 6.5 ? 1 : centerY >= 8.5 ? -1 : 0;

	if (shiftX === 0 && shiftY === 0) {
		return rows;
	}

	const centeredRows = Array.from({ length: 16 }, () => Array(16).fill("."));
	rows.forEach((row, y) => {
		row.split("").forEach((cell, x) => {
			if (cell === ".") {
				return;
			}

			const nextX = x + shiftX;
			const nextY = y + shiftY;
			if (nextX < 0 || nextX > 15 || nextY < 0 || nextY > 15) {
				return;
			}

			centeredRows[nextY][nextX] = cell;
		});
	});

	return centeredRows.map((row) => row.join(""));
}

function hashSeed(seed: string) {
	let hash = 0x811c9dc5;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}

	return hash >>> 0;
}

function parseHexColor(color: string) {
	const normalized = color.trim().replace(/^#/, "");
	const hex =
		normalized.length === 3
			? normalized
					.split("")
					.map((character) => `${character}${character}`)
					.join("")
			: normalized;

	if (!/^[0-9a-f]{6}$/i.test(hex)) {
		return { red: 118, green: 118, blue: 118 };
	}

	return {
		red: Number.parseInt(hex.slice(0, 2), 16),
		green: Number.parseInt(hex.slice(2, 4), 16),
		blue: Number.parseInt(hex.slice(4, 6), 16),
	};
}

function mixChannel(channel: number, target: number, amount: number) {
	return Math.round(channel + (target - channel) * amount);
}

function toHexChannel(channel: number) {
	return channel.toString(16).padStart(2, "0");
}

function mixColor(
	color: { red: number; green: number; blue: number },
	target: number,
	amount: number,
) {
	const red = mixChannel(color.red, target, amount);
	const green = mixChannel(color.green, target, amount);
	const blue = mixChannel(color.blue, target, amount);

	return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
}

function buildTonalPalette(color: string) {
	const parsedColor = parseHexColor(color);

	return {
		accent: mixColor(parsedColor, 255, 0.68),
		body: mixColor(parsedColor, 255, 0.12),
		dark: mixColor(parsedColor, 0, 0.42),
		eye: mixColor(parsedColor, 0, 0.76),
		light: mixColor(parsedColor, 255, 0.42),
	};
}

export function getPixelAvatarName(seed: string) {
	const hash = hashSeed(seed);
	return AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length].name;
}

export default function PixelAvatar({
	seed,
	label,
	color,
	className,
}: PixelAvatarProps) {
	const hash = hashSeed(seed);
	const variant = AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length];
	const rows = centerRows(variant.rows);
	const palette = buildTonalPalette(color);
	const colors: Record<string, string> = {
		A: palette.accent,
		B: palette.body,
		D: palette.dark,
		E: palette.eye,
		L: palette.light,
	};

	return (
		<svg
			className={className}
			viewBox="0 0 16 16"
			role="img"
			aria-label={`${label}'s ${variant.name} avatar`}
			shapeRendering="crispEdges"
		>
			<rect width="16" height="16" fill="#fffdf9" />
			{rows.flatMap((row, y) =>
				row.split("").map((cell, x) => {
					const fill = colors[cell];
					if (!fill) {
						return null;
					}

					return (
						<rect
							key={`${x}-${y}`}
							x={x}
							y={y}
							width="1"
							height="1"
							fill={fill}
						/>
					);
				}),
			)}
		</svg>
	);
}
