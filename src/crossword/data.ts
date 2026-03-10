export type CrosswordCell = {
	number?: number;
	letter?: string;
	block?: boolean;
	selected?: boolean;
	highlighted?: boolean;
};

export type CrosswordClue = {
	number: number;
	text: string;
	filled?: boolean;
	selected?: boolean;
	highlighted?: boolean;
};

export const crosswordMeta = {
	title: "The Crossword",
	date: "Sunday, March 8, 2026",
	puzzleTitle: "Join Together",
	author: "Kelly Richardson",
	editor: "Will Shortz",
	currentClueNumber: "12A",
	currentClueText: "Some budget-friendly grocery stores",
	timer: "1:51:21",
};

const rows = [
	["A", "T", "T", "A", "C", "H", "#", "A", "T", "B", "A", "T", "#", "#", "#"],
	["H", "O", "A", "G", "I", "E", "#", "S", "H", "A", "P", "E", "D", "#", "#"],
	["I", "O", "D", "I", "N", "E", "#", "K", "E", "Y", "G", "R", "I", "P", "#"],
	["#", "#", "#", "T", "E", "L", "L", "#", "R", "W", "A", "N", "D", "A", "#"],
	["A", "T", "E", "A", "M", "#", "I", "H", "E", "A", "R", "S", "L", "O", "P"],
	["L", "A", "M", "#", "A", "T", "L", "A", "S", "T", "#", "M", "O", "L", "D"],
	["I", "B", "M", "#", "S", "R", "I", "R", "A", "C", "H", "A", "#", "E", "A"],
	["B", "O", "A", "S", "#", "O", "U", "R", "#", "H", "A", "L", "F", "T", "W"],
	["I", "O", "W", "A", "#", "N", "O", "I", "R", "#", "M", "A", "I", "#", "P"],
	["#", "#", "A", "D", "O", "#", "K", "E", "E", "N", "#", "L", "E", "G", "#"],
	["I", "N", "T", "E", "R", "N", "A", "T", "I", "O", "N", "A", "L", "W", "O"],
	["S", "I", "S", "#", "A", "I", "L", "#", "D", "R", "Y", "#", "D", "E", "C"],
	["S", "N", "O", "G", "#", "N", "A", "W", "#", "M", "O", "C", "#", "N", "O"],
	["A", "A", "N", "D", "M", "#", "N", "O", "H", "A", "N", "D", "S", "#", "W"],
	["#", "#", "A", "R", "R", "I", "V", "E", "#", "G", "R", "A", "I", "N", "E"],
];

export const crosswordGrid: CrosswordCell[][] = rows.map((row, rowIndex) =>
	row.map((value, columnIndex) => {
		const block = value === "#";

		return {
			block,
			letter: block ? "" : value,
			number: !block ? rowIndex * row.length + columnIndex + 1 : undefined,
			selected: rowIndex === 0 && columnIndex === 7,
			highlighted:
				rowIndex === 0 &&
				columnIndex >= 7 &&
				columnIndex <= 11,
		};
	})
);

export const acrossClues: CrosswordClue[] = [
	{ number: 12, text: "Some budget-friendly grocery stores", filled: true, selected: true },
	{ number: 17, text: "It's on a roll!", filled: true },
	{ number: 18, text: "Sculpted", filled: true },
	{ number: 20, text: "Minimalist swimwear", filled: true },
	{ number: 21, text: "Mineral found in seaweed", filled: true },
	{ number: 22, text: "Certain supervisor on a film set", filled: true },
	{ number: 24, text: "Cozy garment", filled: true },
	{ number: 25, text: "Giveaway", filled: true },
	{ number: 27, text: 'Setting for "Gorillas in the Mist"', filled: true },
	{ number: 28, text: "Spot for a grill", filled: true },
	{ number: 29, text: "Starters", filled: true },
	{ number: 32, text: '"Rumor has it ..."', filled: true },
	{ number: 34, text: "Most slipshod", filled: true },
	{ number: 36, text: "On the ___", filled: true },
];

export const downClues: CrosswordClue[] = [
	{ number: 12, text: "Predinner beverage", filled: true, highlighted: true },
	{ number: 13, text: "Show gratitude for service", filled: true },
	{ number: 14, text: "Loathe", filled: true },
	{ number: 15, text: "Part of PIN: Abbr.", filled: true },
	{ number: 16, text: "Photocopier function", filled: true },
	{ number: 19, text: "Simple rebuttal", filled: true },
	{ number: 20, text: "Makes a choice on Tinder, e.g.", filled: true },
	{ number: 23, text: "Structure in a shipping container", filled: true },
	{ number: 24, text: "Sucker", filled: true },
	{ number: 26, text: "First (and last) queen of Hawaii", filled: true },
	{ number: 29, text: "Good thing for a suspect to have", filled: true },
	{ number: 30, text: "Verboten", filled: true },
	{ number: 31, text: "Actress who portrayed Hermione Granger", filled: true },
	{ number: 33, text: "Tubman of the Underground Railroad", filled: true },
];
