export type NYTPuzzleCell = {
	answer?: string;
	clues?: number[];
	label?: string;
	type?: number;
};

export type NYTPuzzleClueText = {
	plain: string;
};

export type NYTPuzzleClue = {
	cells: number[];
	direction: "Across" | "Down";
	label: string;
	list?: number;
	relatives?: number[];
	text: NYTPuzzleClueText[];
};

export type NYTPuzzleClueList = {
	clues: number[];
	name: "Across" | "Down" | string;
};

export type NYTPuzzleDimensions = {
	height: number;
	width: number;
};

export type NYTPuzzleBody = {
	board: string;
	cells: NYTPuzzleCell[];
	clueLists: NYTPuzzleClueList[];
	clues: NYTPuzzleClue[];
	dimensions: NYTPuzzleDimensions;
};

export type NYTPuzzleResponse = {
	body: NYTPuzzleBody[];
	constructors: string[];
	copyright: string;
	editor: string;
	id: number;
	lastUpdated: string;
	publicationDate: string;
	relatedContent?: {
		text: string;
		url: string;
	};
};

export type NYTPuzzle = NYTPuzzleResponse & {
	puzzle: NYTPuzzleBody;
};

export type CrosswordListItem = {
	id: number;
	label: string;
	text: string;
	direction: "Across" | "Down";
};
