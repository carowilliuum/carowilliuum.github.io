import { useEffect, useMemo, useRef, useState } from "react";

import AuthScreen from "./AuthScreen";
import ClueList from "./ClueList";
import CongratsDialog from "./CongratsDialog";
import CrosswordGrid from "./CrosswordGrid";
import CrosswordHeader from "./CrosswordHeader";
import ProfileDrawer from "./ProfileDrawer";
import type {
	CheckRevealScope,
	Direction,
	RenderModel,
} from "./firebaseTypes";
import { useCollaborativePuzzle } from "./useCollaborativePuzzle";
import "./crossword.css";

type CrosswordListItem = {
	id: number;
	label: string;
	text: string;
	direction: Direction;
};

function formatElapsedTime(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours}:${String(minutes).padStart(2, "0")}:${String(
		seconds,
	).padStart(2, "0")}`;
}

function buildClueItems(
	puzzle: RenderModel,
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
			text: clue.text,
			direction: clue.direction,
		};
	});
}

function getCellClueIdForDirection(
	puzzle: RenderModel,
	cellIndex: number,
	direction: Direction,
) {
	const cell = puzzle.cells[cellIndex];
	return (
		cell?.clueIds?.find(
			(clueId) => puzzle.clues[clueId]?.direction === direction,
		) ?? null
	);
}

function getNextDirection(
	puzzle: RenderModel,
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
	puzzle: RenderModel,
	cellIndex: number,
	direction: Direction,
	step: -1 | 1,
) {
	const clueId = getCellClueIdForDirection(puzzle, cellIndex, direction);
	if (clueId === null) {
		return null;
	}

	const clueCells = puzzle.clues[clueId]?.cellIndexes ?? [];
	const currentPosition = clueCells.indexOf(cellIndex);
	const nextCellIndex =
		currentPosition >= 0 ? clueCells[currentPosition + step] : undefined;

	return typeof nextCellIndex === "number" ? nextCellIndex : null;
}

export default function CrosswordPage() {
	const {
		authReady,
		user,
		currentProfile,
		profiles,
		puzzleMeta,
		renderModel,
		puzzleState,
		activeUsers,
		selectedCellIndex,
		selectedDirection,
		monthViewDate,
		monthStatuses,
		error,
		isBusy,
		showCongrats,
		setShowCongrats,
		setSelectedCellIndex,
		setSelectedDirection,
		setMonthViewDate,
		signIn,
		createAccount,
		signOut,
		openPuzzle,
		updateGuess,
		deleteGuess,
		checkSelection,
		revealSelection,
		updateProfile,
	} = useCollaborativePuzzle();
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [showOwnership, setShowOwnership] = useState(false);
	const [showProfileDrawer, setShowProfileDrawer] = useState(false);
	const [showActionMenu, setShowActionMenu] = useState(false);
	const [cluesMaxHeight, setCluesMaxHeight] = useState<number | null>(null);
	const boardPanelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!user || !puzzleMeta) {
			setElapsedSeconds(0);
			return;
		}

		const intervalId = window.setInterval(() => {
			setElapsedSeconds((currentSeconds) => currentSeconds + 1);
		}, 1000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [puzzleMeta, user]);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault();
				setShowOwnership((current) => !current);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	useEffect(() => {
		const boardPanel = boardPanelRef.current;
		if (!boardPanel || typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			setCluesMaxHeight(entry.contentRect.height);
		});

		observer.observe(boardPanel);
		return () => observer.disconnect();
	}, [renderModel]);

	const activeClueId = useMemo(() => {
		if (!renderModel || selectedCellIndex === null) {
			return null;
		}

		return getCellClueIdForDirection(
			renderModel,
			selectedCellIndex,
			selectedDirection,
		);
	}, [renderModel, selectedCellIndex, selectedDirection]);
	const crossingClueId = useMemo(() => {
		if (!renderModel || selectedCellIndex === null) {
			return null;
		}

		const crossingDirection =
			selectedDirection === "Across" ? "Down" : "Across";
		return getCellClueIdForDirection(
			renderModel,
			selectedCellIndex,
			crossingDirection,
		);
	}, [renderModel, selectedCellIndex, selectedDirection]);
	const markedClueIds = useMemo(() => {
		if (crossingClueId === null) {
			return new Set<number>();
		}

		return new Set([crossingClueId]);
	}, [crossingClueId]);
	const primaryHighlightedCellIndexes = useMemo(() => {
		if (!renderModel || activeClueId === null) {
			return new Set<number>();
		}

		return new Set(renderModel.clues[activeClueId]?.cellIndexes ?? []);
	}, [activeClueId, renderModel]);
	const secondaryHighlightedCellIndexes = useMemo(() => {
		if (!renderModel || crossingClueId === null) {
			return new Set<number>();
		}

		return new Set(renderModel.clues[crossingClueId]?.cellIndexes ?? []);
	}, [crossingClueId, renderModel]);

	useEffect(() => {
		if (!renderModel || selectedCellIndex === null) {
			return;
		}

		setSelectedDirection((currentDirection) =>
			getNextDirection(renderModel, selectedCellIndex, currentDirection),
		);
	}, [renderModel, selectedCellIndex, setSelectedDirection]);

	const activeClueLabel = useMemo(() => {
		if (!renderModel || activeClueId === null) {
			return "";
		}

		const clue = renderModel.clues[activeClueId];
		return `${clue.label}${clue.direction === "Across" ? "A" : "D"}`;
	}, [activeClueId, renderModel]);

	const activeClueText = useMemo(() => {
		if (!renderModel || activeClueId === null) {
			return "Select a cell to view its clue.";
		}

		return renderModel.clues[activeClueId]?.text ?? "";
	}, [activeClueId, renderModel]);

	const acrossClues = useMemo(
		() => (renderModel ? buildClueItems(renderModel, "Across") : []),
		[renderModel],
	);
	const downClues = useMemo(
		() => (renderModel ? buildClueItems(renderModel, "Down") : []),
		[renderModel],
	);

	const remoteSelections = useMemo(
		() =>
			activeUsers
				.filter((activeUser) => activeUser.uid !== user?.uid)
				.map((activeUser) => ({
					uid: activeUser.uid,
					color: activeUser.color,
					selectedCellIndex: activeUser.selectedCellIndex ?? null,
				})),
		[activeUsers, user],
	);

	const guessOwners = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(profiles).map(([uid, profile]) => [uid, profile]),
			),
		[profiles],
	);

	const handleSelectCell = (cellIndex: number) => {
		if (!renderModel) {
			return;
		}

		if (selectedCellIndex === cellIndex) {
			const toggledDirection =
				selectedDirection === "Across" ? "Down" : "Across";
			if (
				getCellClueIdForDirection(
					renderModel,
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
			getNextDirection(renderModel, cellIndex, selectedDirection),
		);
	};

	const handleSelectClue = (clueId: number) => {
		if (!renderModel) {
			return;
		}

		const firstCellIndex = renderModel.clues[clueId]?.cellIndexes[0];
		if (typeof firstCellIndex === "number") {
			setSelectedCellIndex(firstCellIndex);
			setSelectedDirection(renderModel.clues[clueId].direction);
		}
	};

	const handleUpdateGuess = async (cellIndex: number, value: string) => {
		if (!renderModel) {
			return;
		}

		const cell = renderModel.cells[cellIndex];
		const isRebusCell = (cell.type ?? 1) !== 1;
		const nextValue = isRebusCell
			? value.toUpperCase()
			: value.slice(0, 1).toUpperCase();

		if (!nextValue) {
			await updateGuess(cellIndex, nextValue);
			return;
		}

		const clueId = getCellClueIdForDirection(
			renderModel,
			cellIndex,
			selectedDirection,
		);
		if (clueId === null) {
			return;
		}

		const clueCells = renderModel.clues[clueId]?.cellIndexes ?? [];
		const currentPosition = clueCells.indexOf(cellIndex);
		const nextCellIndex =
			currentPosition >= 0 ? clueCells[currentPosition + 1] : undefined;

		if (typeof nextCellIndex === "number") {
			setSelectedCellIndex(nextCellIndex);
		}

		await updateGuess(cellIndex, nextValue);
	};

	const handleDeleteGuess = async (cellIndex: number) => {
		if (!renderModel) {
			return;
		}

		const currentValue = puzzleState.guesses[String(cellIndex)]?.value ?? "";
		if (currentValue) {
			await deleteGuess(cellIndex);
			setSelectedCellIndex(cellIndex);
			return;
		}

		const clueId = getCellClueIdForDirection(
			renderModel,
			cellIndex,
			selectedDirection,
		);
		if (clueId === null) {
			return;
		}

		const clueCells = renderModel.clues[clueId]?.cellIndexes ?? [];
		const currentPosition = clueCells.indexOf(cellIndex);
		const previousCellIndex =
			currentPosition > 0 ? clueCells[currentPosition - 1] : undefined;

		if (typeof previousCellIndex === "number") {
			await deleteGuess(previousCellIndex);
			setSelectedCellIndex(previousCellIndex);
		}
	};

	const handleMoveSelection = (cellIndex: number, key: string) => {
		if (!renderModel) {
			return;
		}

		const isHorizontalKey = key === "ArrowLeft" || key === "ArrowRight";
		const targetDirection: Direction = isHorizontalKey ? "Across" : "Down";

		if (selectedDirection !== targetDirection) {
			if (
				getCellClueIdForDirection(
					renderModel,
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
			renderModel,
			cellIndex,
			selectedDirection,
			step,
		);

		if (nextCellIndex !== null) {
			setSelectedCellIndex(nextCellIndex);
		}
	};

	if (!authReady) {
		return <div className="crossword-page crossword-page--loading">Loading…</div>;
	}

	if (!user) {
		return (
			<AuthScreen
				isBusy={isBusy}
				error={error}
				onLogin={signIn}
				onCreateAccount={createAccount}
			/>
		);
	}

	const actionItems: Array<{
		label: string;
		scope: CheckRevealScope;
		action: "check" | "reveal";
	}> = [
		{ label: "Check Cell", scope: "cell", action: "check" },
		{ label: "Check Word", scope: "word", action: "check" },
		{ label: "Check Puzzle", scope: "puzzle", action: "check" },
		{ label: "Reveal Cell", scope: "cell", action: "reveal" },
		{ label: "Reveal Word", scope: "word", action: "reveal" },
		{ label: "Reveal Puzzle", scope: "puzzle", action: "reveal" },
	];

	return (
		<div className="crossword-page">
			<CrosswordHeader
				puzzle={puzzleMeta}
				currentProfile={currentProfile}
				activeUsers={activeUsers}
				monthViewDate={monthViewDate}
				monthStatuses={monthStatuses}
				selectedDate={puzzleMeta?.publicationDate ?? null}
				showOwnership={showOwnership}
				onOpenMenu={() => setShowProfileDrawer(true)}
				onChangeMonth={setMonthViewDate}
				onSelectDate={(date) => void openPuzzle(date)}
			/>

			<section className="crossword-toolbar" aria-label="Puzzle tools">
				<div className="crossword-toolbar__left">
					{error ? <span className="crossword-toolbar__error">{error}</span> : null}
				</div>

				<div className="crossword-toolbar__timer">
					{isBusy ? "Syncing…" : formatElapsedTime(elapsedSeconds)}
				</div>

				<div className="crossword-toolbar__actions">
					<button
						type="button"
						className="crossword-toolbar__text-button"
						onClick={() => setShowOwnership((current) => !current)}
					>
						{showOwnership ? "Hide Edits" : "Show Edits"}
					</button>
					<div className="crossword-toolbar__menu">
						<button
							type="button"
							className="crossword-toolbar__icon-button"
							aria-label="Check and reveal actions"
							onClick={() => setShowActionMenu((current) => !current)}
						>
							✓
						</button>
						{showActionMenu ? (
							<div className="crossword-toolbar__dropdown">
								{actionItems.map((item) => (
									<button
										key={item.label}
										type="button"
										onClick={() => {
											setShowActionMenu(false);
											if (item.action === "check") {
												void checkSelection(item.scope);
												return;
											}

											void revealSelection(item.scope);
										}}
									>
										{item.label}
									</button>
								))}
							</div>
						) : null}
					</div>
				</div>
			</section>

			<main className="crossword-layout">
				{renderModel ? (
					<div
						ref={boardPanelRef}
						className="crossword-board-panel-wrap"
					>
						<CrosswordGrid
							puzzle={renderModel}
							selectedCellIndex={selectedCellIndex}
							primaryHighlightedCellIndexes={
								primaryHighlightedCellIndexes
							}
							secondaryHighlightedCellIndexes={
								secondaryHighlightedCellIndexes
							}
							activeClueLabel={activeClueLabel}
							activeClueText={activeClueText}
							puzzleState={puzzleState}
							guessOwners={guessOwners}
							remoteSelections={remoteSelections}
							showOwnership={showOwnership}
							onSelectCell={handleSelectCell}
							onUpdateGuess={(cellIndex, value) =>
								void handleUpdateGuess(cellIndex, value)
							}
							onDeleteGuess={(cellIndex) => void handleDeleteGuess(cellIndex)}
							onMoveSelection={handleMoveSelection}
						/>
					</div>
				) : (
					<section
						className="crossword-board-panel crossword-board-panel--empty"
						aria-label="Game board with clue bar"
					>
						<div className="crossword-clue-bar">
							<div className="crossword-clue-bar__text">
								Pick a date in the calendar to load a puzzle.
							</div>
						</div>
					</section>
				)}
				<section
					className="crossword-clues"
					aria-label="Clue lists"
					style={cluesMaxHeight ? { maxHeight: cluesMaxHeight } : undefined}
				>
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

			<ProfileDrawer
				isOpen={showProfileDrawer}
				profile={currentProfile}
				onClose={() => setShowProfileDrawer(false)}
				onSave={async (input) => {
					await updateProfile(input);
					setShowProfileDrawer(false);
				}}
				onSignOut={signOut}
			/>
			<CongratsDialog
				isOpen={showCongrats}
				onDismiss={() => setShowCongrats(false)}
			/>
		</div>
	);
}
