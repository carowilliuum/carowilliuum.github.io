import { useEffect, useMemo, useState } from "react";

import ClueList from "./ClueList";
import CrosswordGrid from "./CrosswordGrid";
import CrosswordHeader from "./CrosswordHeader";
import type { CrosswordListItem, NYTPuzzle } from "./nyt";
import { useNYTPuzzle } from "./useNYTPuzzle";
import "./crossword.css";

function getDefaultDate() {
	return new Date().toISOString().slice(0, 10);
}

function getClueText(puzzle: NYTPuzzle["puzzle"], clueId: number) {
	return puzzle.clues[clueId]?.text.map((entry) => entry.plain).join(" ") ?? "";
}

function buildClueItems(
	puzzle: NYTPuzzle["puzzle"],
	direction: "Across" | "Down"
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

export default function CrosswordPage() {
	const [date] = useState(getDefaultDate);
	const { data, isLoading, error } = useNYTPuzzle(date);
	const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
	const [guesses, setGuesses] = useState<Record<number, string>>({});

	const puzzle = data?.puzzle ?? null;

	useEffect(() => {
		if (!puzzle) {
			setSelectedCellIndex(null);
			return;
		}

		const firstPlayableIndex = puzzle.cells.findIndex((cell) => Boolean(cell.answer));
		setSelectedCellIndex(firstPlayableIndex >= 0 ? firstPlayableIndex : null);
		setGuesses({});
	}, [puzzle]);

	const selectedCell = selectedCellIndex !== null ? puzzle?.cells[selectedCellIndex] : null;
	const highlightedClueIds = useMemo(
		() => new Set(selectedCell?.clues ?? []),
		[selectedCell]
	);
	const activeClueId = selectedCell?.clues?.[0] ?? null;

	const highlightedCellIndexes = useMemo(() => {
		if (!puzzle || !selectedCell?.clues?.length) {
			return new Set<number>();
		}

		return new Set(
			selectedCell.clues.flatMap((clueId) => puzzle.clues[clueId]?.cells ?? [])
		);
	}, [puzzle, selectedCell]);

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
		[puzzle]
	);
	const downClues = useMemo(
		() => (puzzle ? buildClueItems(puzzle, "Down") : []),
		[puzzle]
	);

	const handleSelectClue = (clueId: number) => {
		if (!puzzle) {
			return;
		}

		const firstCellIndex = puzzle.clues[clueId]?.cells[0];
		if (typeof firstCellIndex === "number") {
			setSelectedCellIndex(firstCellIndex);
		}
	};

	return (
		<div className="crossword-page">
			<CrosswordHeader puzzle={data} />

			<section className="crossword-toolbar" aria-label="Puzzle tools">
				<div className="crossword-toolbar__left">
					<button
						type="button"
						className="crossword-icon-button crossword-icon-button--gear"
						aria-label="Puzzle settings"
					>
						<span className="crossword-gear-icon" aria-hidden="true" />
					</button>
				</div>

				<div className="crossword-toolbar__timer">
					{isLoading ? "Loading…" : date}
				</div>

				<div className="crossword-toolbar__actions">
					<button type="button" className="crossword-toolbar__text-button">
						Rebus
					</button>
					<button type="button" className="crossword-toolbar__text-button">
						Reset
					</button>
					<button
						type="button"
						className="crossword-icon-button crossword-icon-button--help"
						aria-label="Help"
					>
						?
					</button>
					<button
						type="button"
						className="crossword-icon-button crossword-icon-button--pencil"
						aria-label="Toggle pencil"
					>
						<span className="crossword-pencil-icon" aria-hidden="true" />
					</button>
				</div>
			</section>

			<main className="crossword-layout">
				{puzzle ? (
					<CrosswordGrid
						puzzle={puzzle}
						selectedCellIndex={selectedCellIndex}
						highlightedCellIndexes={highlightedCellIndexes}
						activeClueLabel={activeClueLabel}
						activeClueText={activeClueText}
						guesses={guesses}
						onSelectCell={setSelectedCellIndex}
						onUpdateGuess={(cellIndex, value) => {
							setGuesses((currentGuesses) => ({
								...currentGuesses,
								[cellIndex]: value,
							}));
						}}
					/>
				) : (
					<section className="crossword-board-panel" aria-label="Game board with clue bar">
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
						highlightedClueIds={highlightedClueIds}
						selectedClueId={activeClueId}
						onSelectClue={handleSelectClue}
					/>
					<ClueList
						title="Down"
						clues={downClues}
						highlightedClueIds={highlightedClueIds}
						selectedClueId={activeClueId}
						onSelectClue={handleSelectClue}
					/>
				</section>
			</main>
		</div>
	);
}
