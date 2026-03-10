import { useEffect, useMemo, useState } from "react";

import ClueList from "./ClueList";
import CrosswordGrid from "./CrosswordGrid";
import CrosswordHeader from "./CrosswordHeader";
import type { CrosswordListItem, NYTPuzzle } from "./nyt";
import { useNYTPuzzle } from "./useNYTPuzzle";
import "./crossword.css";

type Direction = "Across" | "Down";

function getDefaultDate() {
	return new Date().toISOString().slice(0, 10);
}

function formatElapsedTime(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours}:${String(minutes).padStart(2, "0")}:${String(
		seconds,
	).padStart(2, "0")}`;
}

function getClueText(puzzle: NYTPuzzle["puzzle"], clueId: number) {
	return (
		puzzle.clues[clueId]?.text.map((entry) => entry.plain).join(" ") ?? ""
	);
}

function buildClueItems(
	puzzle: NYTPuzzle["puzzle"],
	direction: Direction,
): CrosswordListItem[] {
	const clueList = puzzle.clueLists.find((list) => list.name === direction);

	if (!clueList) {
		return [];
	}

	return clueList.clues.map((clueId) => {
		const clue = puzzle.clues[clueId];

		return {
			id: clueId,
			label: clue.label,
			text: getClueText(puzzle, clueId),
			direction: clue.direction,
		};
	});
}

function getCellClueIdForDirection(
	puzzle: NYTPuzzle["puzzle"],
	cellIndex: number,
	direction: Direction,
) {
	const cell = puzzle.cells[cellIndex];
	return (
		cell?.clues?.find(
			(clueId) => puzzle.clues[clueId]?.direction === direction,
		) ?? null
	);
}

function getNextDirection(
	puzzle: NYTPuzzle["puzzle"],
	cellIndex: number,
	currentDirection: Direction,
) {
	const currentClueId = getCellClueIdForDirection(
		puzzle,
		cellIndex,
		currentDirection,
	);
	if (currentClueId !== null) {
		return currentDirection;
	}

	return currentDirection === "Across" ? "Down" : "Across";
}

function moveWithinClue(
	puzzle: NYTPuzzle["puzzle"],
	cellIndex: number,
	direction: Direction,
	step: -1 | 1,
) {
	const clueId = getCellClueIdForDirection(puzzle, cellIndex, direction);
	if (clueId === null) {
		return null;
	}

	const clueCells = puzzle.clues[clueId]?.cells ?? [];
	const currentPosition = clueCells.indexOf(cellIndex);
	const nextCellIndex =
		currentPosition >= 0 ? clueCells[currentPosition + step] : undefined;

	return typeof nextCellIndex === "number" ? nextCellIndex : null;
}

export default function CrosswordPage() {
	const [date] = useState(getDefaultDate);
	const { data, isLoading, error } = useNYTPuzzle(date);
	const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(
		null,
	);
	const [selectedDirection, setSelectedDirection] =
		useState<Direction>("Across");
	const [guesses, setGuesses] = useState<Record<number, string>>({});
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const puzzle = data?.puzzle ?? null;

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setElapsedSeconds((currentSeconds) => currentSeconds + 1);
		}, 1000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		if (!puzzle) {
			setSelectedCellIndex(null);
			return;
		}

		const firstPlayableIndex = puzzle.cells.findIndex((cell) =>
			Boolean(cell.answer),
		);
		setSelectedCellIndex(
			firstPlayableIndex >= 0 ? firstPlayableIndex : null,
		);
		setSelectedDirection("Across");
		setGuesses({});
		setElapsedSeconds(0);
	}, [puzzle]);

	const activeClueId = useMemo(() => {
		if (!puzzle || selectedCellIndex === null) {
			return null;
		}

		return getCellClueIdForDirection(
			puzzle,
			selectedCellIndex,
			selectedDirection,
		);
	}, [puzzle, selectedCellIndex, selectedDirection]);
	const crossingClueId = useMemo(() => {
		if (!puzzle || selectedCellIndex === null) {
			return null;
		}

		const crossingDirection =
			selectedDirection === "Across" ? "Down" : "Across";
		return getCellClueIdForDirection(
			puzzle,
			selectedCellIndex,
			crossingDirection,
		);
	}, [puzzle, selectedCellIndex, selectedDirection]);
	const markedClueIds = useMemo(() => {
		if (crossingClueId === null) {
			return new Set<number>();
		}

		return new Set([crossingClueId]);
	}, [crossingClueId]);
	const primaryHighlightedCellIndexes = useMemo(() => {
		if (!puzzle || activeClueId === null) {
			return new Set<number>();
		}

		return new Set(puzzle.clues[activeClueId]?.cells ?? []);
	}, [activeClueId, puzzle]);
	const secondaryHighlightedCellIndexes = useMemo(() => {
		if (!puzzle || crossingClueId === null) {
			return new Set<number>();
		}

		return new Set(puzzle.clues[crossingClueId]?.cells ?? []);
	}, [crossingClueId, puzzle]);

	useEffect(() => {
		if (!puzzle || selectedCellIndex === null) {
			return;
		}

		setSelectedDirection((currentDirection) =>
			getNextDirection(puzzle, selectedCellIndex, currentDirection),
		);
	}, [puzzle, selectedCellIndex]);

	const activeClueLabel = useMemo(() => {
		if (!puzzle || activeClueId === null) {
			return "";
		}

		const clue = puzzle.clues[activeClueId];
		return `${clue.label}${clue.direction === "Across" ? "A" : "D"}`;
	}, [activeClueId, puzzle]);

	const activeClueText = useMemo(() => {
		if (!puzzle || activeClueId === null) {
			return "Select a cell to view its clue.";
		}

		return getClueText(puzzle, activeClueId);
	}, [activeClueId, puzzle]);

	const acrossClues = useMemo(
		() => (puzzle ? buildClueItems(puzzle, "Across") : []),
		[puzzle],
	);
	const downClues = useMemo(
		() => (puzzle ? buildClueItems(puzzle, "Down") : []),
		[puzzle],
	);

	const handleSelectCell = (cellIndex: number) => {
		if (!puzzle) {
			return;
		}

		if (selectedCellIndex === cellIndex) {
			const toggledDirection =
				selectedDirection === "Across" ? "Down" : "Across";
			if (
				getCellClueIdForDirection(
					puzzle,
					cellIndex,
					toggledDirection,
				) !== null
			) {
				setSelectedDirection(toggledDirection);
			}
			return;
		}

		setSelectedCellIndex(cellIndex);
		setSelectedDirection(
			getNextDirection(puzzle, cellIndex, selectedDirection),
		);
	};

	const handleSelectClue = (clueId: number) => {
		if (!puzzle) {
			return;
		}

		const firstCellIndex = puzzle.clues[clueId]?.cells[0];
		if (typeof firstCellIndex === "number") {
			setSelectedCellIndex(firstCellIndex);
			setSelectedDirection(puzzle.clues[clueId].direction);
		}
	};

	const handleUpdateGuess = (cellIndex: number, value: string) => {
		if (!puzzle) {
			return;
		}

		setGuesses((currentGuesses) => ({
			...currentGuesses,
			[cellIndex]: value,
		}));

		if (!value) {
			return;
		}

		const clueId = getCellClueIdForDirection(
			puzzle,
			cellIndex,
			selectedDirection,
		);
		if (clueId === null) {
			return;
		}

		const clueCells = puzzle.clues[clueId]?.cells ?? [];
		const currentPosition = clueCells.indexOf(cellIndex);
		const nextCellIndex =
			currentPosition >= 0 ? clueCells[currentPosition + 1] : undefined;

		if (typeof nextCellIndex === "number") {
			setSelectedCellIndex(nextCellIndex);
		}
	};

	const handleDeleteGuess = (cellIndex: number) => {
		if (!puzzle) {
			return;
		}

		const currentValue = guesses[cellIndex] ?? "";
		if (currentValue) {
			setGuesses((currentGuesses) => ({
				...currentGuesses,
				[cellIndex]: "",
			}));
			setSelectedCellIndex(cellIndex);
			return;
		}

		const clueId = getCellClueIdForDirection(
			puzzle,
			cellIndex,
			selectedDirection,
		);
		if (clueId === null) {
			return;
		}

		const clueCells = puzzle.clues[clueId]?.cells ?? [];
		const currentPosition = clueCells.indexOf(cellIndex);
		const previousCellIndex =
			currentPosition > 0 ? clueCells[currentPosition - 1] : undefined;

		if (typeof previousCellIndex === "number") {
			setSelectedCellIndex(previousCellIndex);
		}
	};

	const handleMoveSelection = (cellIndex: number, key: string) => {
		if (!puzzle) {
			return;
		}

		const isHorizontalKey = key === "ArrowLeft" || key === "ArrowRight";
		const targetDirection: Direction = isHorizontalKey ? "Across" : "Down";

		if (selectedDirection !== targetDirection) {
			if (
				getCellClueIdForDirection(
					puzzle,
					cellIndex,
					targetDirection,
				) !== null
			) {
				setSelectedDirection(targetDirection);
			}
			setSelectedCellIndex(cellIndex);
			return;
		}

		const step: -1 | 1 = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
		const nextCellIndex = moveWithinClue(
			puzzle,
			cellIndex,
			selectedDirection,
			step,
		);

		if (nextCellIndex !== null) {
			setSelectedCellIndex(nextCellIndex);
		}
	};

	return (
		<div className="crossword-page">
			<CrosswordHeader puzzle={data} />

			<section className="crossword-toolbar" aria-label="Puzzle tools">
				<div className="crossword-toolbar__left">
					{/* <button
						type="button"
						className="crossword-icon-button crossword-icon-button--gear"
						aria-label="Puzzle settings"
					>
						<span
							className="crossword-gear-icon"
							aria-hidden="true"
						/>
					</button> */}
				</div>

				<div className="crossword-toolbar__timer">
					{isLoading ? "Loading…" : formatElapsedTime(elapsedSeconds)}
				</div>

				<div className="crossword-toolbar__actions">
					<button
						type="button"
						className="crossword-toolbar__text-button"
					>
						Rebus
					</button>
					<button
						type="button"
						className="crossword-toolbar__text-button"
					>
						Reset
					</button>
					<button
						type="button"
						className="crossword-toolbar__text-button"
					>
						Reveal
					</button>
					<button
						type="button"
						className="crossword-toolbar__text-button"
					>
						Check
					</button>
					{/* <button
						type="button"
						className="crossword-icon-button crossword-icon-button--pencil"
						aria-label="Toggle pencil"
					>
						<span className="crossword-pencil-icon" aria-hidden="true" />
					</button> */}
				</div>
			</section>

			<main className="crossword-layout">
				{puzzle ? (
					<CrosswordGrid
						puzzle={puzzle}
						selectedCellIndex={selectedCellIndex}
						primaryHighlightedCellIndexes={
							primaryHighlightedCellIndexes
						}
						secondaryHighlightedCellIndexes={
							secondaryHighlightedCellIndexes
						}
						activeClueLabel={activeClueLabel}
						activeClueText={activeClueText}
						guesses={guesses}
						onSelectCell={handleSelectCell}
						onUpdateGuess={handleUpdateGuess}
						onDeleteGuess={handleDeleteGuess}
						onMoveSelection={handleMoveSelection}
					/>
				) : (
					<section
						className="crossword-board-panel"
						aria-label="Game board with clue bar"
					>
						<div className="crossword-clue-bar">
							<div className="crossword-clue-bar__text">
								{error ?? "Loading puzzle…"}
							</div>
						</div>
					</section>
				)}
				<section className="crossword-clues" aria-label="Clue lists">
					<ClueList
						title="Across"
						clues={acrossClues}
						markedClueIds={markedClueIds}
						selectedClueId={activeClueId}
						onSelectClue={handleSelectClue}
					/>
					<ClueList
						title="Down"
						clues={downClues}
						markedClueIds={markedClueIds}
						selectedClueId={activeClueId}
						onSelectClue={handleSelectClue}
					/>
				</section>
			</main>
		</div>
	);
}
