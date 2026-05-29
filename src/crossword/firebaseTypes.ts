export type Direction = "Across" | "Down";

export type PuzzleCompletionState = "in_progress" | "complete";

export type UserProfile = {
	id: string;
	email: string;
	username: string;
	initial: string;
	color: string;
	createdAt?: Date | null;
	updatedAt?: Date | null;
	lastSeenAt?: Date | null;
};

export type PuzzleMetadata = {
	id: string;
	publicationDate: string;
	nytPuzzleId?: number | null;
	title: string;
	constructors: string[];
	editor?: string | null;
	importedAt?: Date | null;
	importedBy?: string | null;
	lastWorkedAt?: Date | null;
	lastEditedBy?: string | null;
	completionState: PuzzleCompletionState;
	completionProgress: number;
	filledCellCount?: number;
	totalCellCount?: number;
	completedAt?: Date | null;
};

export type RenderCell = {
	index: number;
	label: string | null;
	type: number | null;
	isBlock: boolean;
	clueIds: number[];
};

export type RenderClue = {
	id: number;
	direction: Direction;
	label: string;
	text: string;
	cellIndexes: number[];
};

export type RenderModel = {
	title: string;
	dimensions: {
		height: number;
		width: number;
	};
	board: string;
	cells: RenderCell[];
	clues: RenderClue[];
	clueLists: Array<{
		name: string;
		clues: number[];
	}>;
	source: "nyt";
	sourceFetchedAt?: Date | null;
};

export type GuessEntry = {
	value: string;
	guesserId: string;
	updatedAt?: Date | null;
	origin: "manual" | "reveal";
};

export type CellAnnotation = {
	status: "correct" | "incorrect";
	checkedAt?: Date | null;
	checkedBy?: string | null;
	revealed: boolean;
	revealedAt?: Date | null;
	revealedBy?: string | null;
};

export type PuzzleState = {
	guesses: Record<string, GuessEntry>;
	cellAnnotations: Record<string, CellAnnotation>;
	updatedAt?: Date | null;
	lastEditedBy?: string | null;
	revision: number;
};

export type PresenceEntry = {
	username: string;
	initial: string;
	color: string;
	selectedCellIndex: number | null;
	selectedDirection: Direction;
	lastSeenAt?: Date | null;
	isViewing: boolean;
};

export type PresenceState = {
	users: Record<string, PresenceEntry>;
};

export type CheckRevealScope = "cell" | "word" | "puzzle";

export type CalendarStatusMap = Record<
	string,
	{
		completionState: PuzzleCompletionState;
		completionProgress: number;
		hasStoredCompletionProgress?: boolean;
		lastWorkedAt?: Date | null;
	}
>;
