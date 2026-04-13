import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

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

const INCORRECT_HINT_RADIUS = 3;
const INCORRECT_HINT_FADE_MS = 15_000;

function formatElapsedTime(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours}:${String(minutes).padStart(2, "0")}:${String(
		seconds,
	).padStart(2, "0")}`;
}

function CrosswordTimer({
	resetKey,
	isBusy,
}: {
	resetKey: string;
	isBusy: boolean;
}) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		setElapsedSeconds(0);
	}, [resetKey]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setElapsedSeconds((currentSeconds) => currentSeconds + 1);
		}, 1000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [resetKey]);

	return <span>{isBusy ? "Syncing…" : formatElapsedTime(elapsedSeconds)}</span>;
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

function getCellCoordinates(puzzle: RenderModel, cellIndex: number) {
	return {
		row: Math.floor(cellIndex / puzzle.dimensions.width),
		column: cellIndex % puzzle.dimensions.width,
	};
}

function getManhattanDistance(
	puzzle: RenderModel,
	leftCellIndex: number,
	rightCellIndex: number,
) {
	const left = getCellCoordinates(puzzle, leftCellIndex);
	const right = getCellCoordinates(puzzle, rightCellIndex);
	return Math.abs(left.row - right.row) + Math.abs(left.column - right.column);
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
		isSavingGuesses,
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
	const [showOwnership, setShowOwnership] = useState(false);
	const [showProfileDrawer, setShowProfileDrawer] = useState(false);
	const [showActionMenu, setShowActionMenu] = useState(false);
	const [showJumpPalette, setShowJumpPalette] = useState(false);
	const [jumpClueInput, setJumpClueInput] = useState("");
	const [jumpError, setJumpError] = useState<string | null>(null);
	const [showIncorrectDialog, setShowIncorrectDialog] = useState(false);
	const [verifiedIncorrectCellIndexes, setVerifiedIncorrectCellIndexes] =
		useState<number[]>([]);
	const [activeIncorrectHintCenterCellIndexes, setActiveIncorrectHintCenterCellIndexes] =
		useState<number[]>([]);
	const [incorrectHintFadeProgress, setIncorrectHintFadeProgress] = useState(1);
	const [showUnverifiedDialog, setShowUnverifiedDialog] = useState(false);
	const [showContributionChart, setShowContributionChart] = useState(false);
	const [cluesMaxHeight, setCluesMaxHeight] = useState<number | null>(null);
	const boardPanelRef = useRef<HTMLDivElement | null>(null);
	const jumpInputRef = useRef<HTMLInputElement | null>(null);
	const autoCheckedFillSignatureRef = useRef<string | null>(null);
	const processedFillSignatureRef = useRef<string | null>(null);
	const initializedPuzzleIdRef = useRef<string | null>(null);
	const incorrectHintAnimationFrameRef = useRef<number | null>(null);

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
		if (!boardPanel) {
			return;
		}

		setCluesMaxHeight(boardPanel.getBoundingClientRect().height);

		if (typeof ResizeObserver === "undefined") {
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

	useEffect(() => {
		if (!showJumpPalette) {
			return;
		}

		jumpInputRef.current?.focus();
		jumpInputRef.current?.select();
	}, [showJumpPalette]);

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
	const cluesStyle = cluesMaxHeight
		? ({
				"--crossword-clues-height": `${cluesMaxHeight}px`,
			} as CSSProperties)
		: undefined;

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
	const playableCellIndexes = useMemo(
		() =>
			renderModel
				? renderModel.cells
						.filter((cell) => !cell.isBlock)
						.map((cell) => cell.index)
				: [],
		[renderModel],
	);
	const puzzleFillSignature = useMemo(() => {
		if (!renderModel) {
			return "";
		}

		return playableCellIndexes
			.map(
				(cellIndex) =>
					`${cellIndex}:${puzzleState.guesses[String(cellIndex)]?.value ?? ""}`,
			)
			.join("|");
	}, [playableCellIndexes, puzzleState.guesses, renderModel]);
	const isPuzzleFilled = useMemo(
		() =>
			playableCellIndexes.length > 0 &&
			playableCellIndexes.every((cellIndex) =>
				Boolean(puzzleState.guesses[String(cellIndex)]?.value.trim()),
			),
		[playableCellIndexes, puzzleState.guesses],
	);
	const incorrectCellIndexes = useMemo(
		() =>
			Object.entries(puzzleState.cellAnnotations)
				.filter(([, annotation]) => annotation.status === "incorrect")
				.map(([cellIndex]) => Number(cellIndex))
				.filter((cellIndex) => !Number.isNaN(cellIndex)),
		[puzzleState.cellAnnotations],
	);
	const isPuzzleFullyChecked = useMemo(
		() =>
			playableCellIndexes.length > 0 &&
			playableCellIndexes.every((cellIndex) =>
				Boolean(puzzleState.cellAnnotations[String(cellIndex)]),
			),
		[playableCellIndexes, puzzleState.cellAnnotations],
	);
	const isPuzzleCheckedCorrect = useMemo(
		() =>
			isPuzzleFullyChecked &&
			playableCellIndexes.every(
				(cellIndex) =>
					puzzleState.cellAnnotations[String(cellIndex)]?.status === "correct",
			),
		[isPuzzleFullyChecked, playableCellIndexes, puzzleState.cellAnnotations],
	);
	const contributionBars = useMemo(() => {
		const counts = new Map<
			string,
			{ label: string; color: string; count: number }
		>();

		for (const guess of Object.values(puzzleState.guesses)) {
			if (!guess.value || !guess.guesserId) {
				continue;
			}

			const owner = guessOwners[guess.guesserId];
			const label = owner?.username || owner?.email || "Unknown";
			const color = owner?.color || "#767676";
			const current = counts.get(guess.guesserId);

			if (current) {
				current.count += 1;
				continue;
			}

			counts.set(guess.guesserId, {
				label,
				color,
				count: 1,
			});
		}

		const total = Array.from(counts.values()).reduce(
			(sum, entry) => sum + entry.count,
			0,
		);

		return Array.from(counts.entries())
			.map(([uid, entry]) => ({
				uid,
				...entry,
				share: total > 0 ? (entry.count / total) * 100 : 0,
			}))
			.sort((left, right) => right.count - left.count);
	}, [guessOwners, puzzleState.guesses]);
	const firstPlayableCellGuessDebug = useMemo(
		() =>
			playableCellIndexes.length > 0
				? {
						cellIndex: playableCellIndexes[0],
						guess:
							puzzleState.guesses[String(playableCellIndexes[0])]?.value ?? "",
						guessEntry:
							puzzleState.guesses[String(playableCellIndexes[0])] ?? null,
				  }
				: null,
		[playableCellIndexes, puzzleState.guesses],
	);

	useEffect(() => {
		if (!renderModel) {
			return;
		}

		const puzzleId = puzzleMeta?.id ?? null;
		if (initializedPuzzleIdRef.current !== puzzleId) {
			initializedPuzzleIdRef.current = puzzleId;
			autoCheckedFillSignatureRef.current = null;
			processedFillSignatureRef.current = isPuzzleFilled
				? puzzleFillSignature
				: null;
			setShowIncorrectDialog(false);
			setVerifiedIncorrectCellIndexes([]);
			setActiveIncorrectHintCenterCellIndexes([]);
			setIncorrectHintFadeProgress(1);
			setShowUnverifiedDialog(false);
			return;
		}

		if (!isPuzzleFilled) {
			processedFillSignatureRef.current = null;
			autoCheckedFillSignatureRef.current = null;
			setShowIncorrectDialog(false);
			setVerifiedIncorrectCellIndexes([]);
			setActiveIncorrectHintCenterCellIndexes([]);
			setIncorrectHintFadeProgress(1);
			setShowUnverifiedDialog(false);
			return;
		}

		if (processedFillSignatureRef.current === puzzleFillSignature) {
			return;
		}

		if (!isPuzzleFullyChecked) {
			if (isSavingGuesses) {
				return;
			}

			if (autoCheckedFillSignatureRef.current === puzzleFillSignature) {
				return;
			}

			autoCheckedFillSignatureRef.current = puzzleFillSignature;
			console.log("[crossword check] firing puzzle-wide verification", {
				puzzleId,
				fillSignature: puzzleFillSignature,
				firstPlayableCell: firstPlayableCellGuessDebug,
			});
			void (async () => {
				const checkResult = (await checkSelection("puzzle")) as
					| { incorrectCellIndexes?: number[] }
					| null;
				if (
					!checkResult ||
					autoCheckedFillSignatureRef.current !== puzzleFillSignature
				) {
					return;
				}

				const checkedIncorrectCellIndexes =
					checkResult.incorrectCellIndexes ?? [];
				const checkedIncorrectCount = checkedIncorrectCellIndexes.length;
				const checkedAllCorrect = checkedIncorrectCount === 0;

				processedFillSignatureRef.current = puzzleFillSignature;
				console.log("[crossword check] verification result", {
					puzzleId,
					fillSignature: puzzleFillSignature,
					incorrectCount: checkedIncorrectCount,
					allCorrect: checkedAllCorrect,
					source: "function-result",
					firstPlayableCellGuess: firstPlayableCellGuessDebug,
				});

				if (checkedAllCorrect) {
					setShowUnverifiedDialog(false);
					setShowIncorrectDialog(false);
					setVerifiedIncorrectCellIndexes([]);
					setActiveIncorrectHintCenterCellIndexes([]);
					setIncorrectHintFadeProgress(1);
					setShowCongrats(true);
					return;
				}

				setShowUnverifiedDialog(false);
				setVerifiedIncorrectCellIndexes(checkedIncorrectCellIndexes);
				setShowIncorrectDialog(true);
			})();
			return;
		}

		processedFillSignatureRef.current = puzzleFillSignature;
		if (incorrectCellIndexes.length === 0) {
			setShowUnverifiedDialog(false);
			setShowIncorrectDialog(false);
			setVerifiedIncorrectCellIndexes([]);
			setActiveIncorrectHintCenterCellIndexes([]);
			setIncorrectHintFadeProgress(1);
			setShowCongrats(true);
			return;
		}

		setShowUnverifiedDialog(false);
		setVerifiedIncorrectCellIndexes(incorrectCellIndexes);
		setShowIncorrectDialog(true);
	}, [
		checkSelection,
		incorrectCellIndexes,
		isPuzzleFilled,
		isPuzzleFullyChecked,
		isPuzzleCheckedCorrect,
		isSavingGuesses,
		puzzleFillSignature,
		puzzleMeta?.id,
		firstPlayableCellGuessDebug,
		renderModel,
		setShowCongrats,
	]);

	useEffect(() => {
		if (activeIncorrectHintCenterCellIndexes.length === 0) {
			setIncorrectHintFadeProgress(1);
			if (incorrectHintAnimationFrameRef.current !== null) {
				window.cancelAnimationFrame(incorrectHintAnimationFrameRef.current);
				incorrectHintAnimationFrameRef.current = null;
			}
			return;
		}

		const startedAt = window.performance.now();

		const tick = (now: number) => {
			const nextProgress = Math.min(
				(now - startedAt) / INCORRECT_HINT_FADE_MS,
				1,
			);
			setIncorrectHintFadeProgress(nextProgress);

			if (nextProgress >= 1) {
				setActiveIncorrectHintCenterCellIndexes([]);
				incorrectHintAnimationFrameRef.current = null;
				return;
			}

			incorrectHintAnimationFrameRef.current =
				window.requestAnimationFrame(tick);
		};

		setIncorrectHintFadeProgress(0);
		incorrectHintAnimationFrameRef.current = window.requestAnimationFrame(tick);

		return () => {
			if (incorrectHintAnimationFrameRef.current !== null) {
				window.cancelAnimationFrame(incorrectHintAnimationFrameRef.current);
				incorrectHintAnimationFrameRef.current = null;
			}
		};
	}, [activeIncorrectHintCenterCellIndexes]);

	useEffect(() => {
		if (!showCongrats) {
			setShowContributionChart(false);
		}
	}, [showCongrats]);

	const proximityHintIntensityByCellIndex = useMemo(() => {
		if (
			!renderModel ||
			activeIncorrectHintCenterCellIndexes.length === 0 ||
			incorrectHintFadeProgress >= 1
		) {
			return new Map<number, number>();
		}

		const fadeMultiplier = 1 - incorrectHintFadeProgress;
		const nextEntries = new Map<number, number>();

		for (const cell of renderModel.cells) {
			if (cell.isBlock) {
				continue;
			}

			const distances = activeIncorrectHintCenterCellIndexes.map((hintCellIndex) =>
				getManhattanDistance(renderModel, cell.index, hintCellIndex),
			);
			const shortestDistance = Math.min(...distances);
			if (shortestDistance > INCORRECT_HINT_RADIUS) {
				continue;
			}

			const distanceWeight =
				(INCORRECT_HINT_RADIUS + 1 - shortestDistance) /
				(INCORRECT_HINT_RADIUS + 1);
			nextEntries.set(cell.index, 0.4 * distanceWeight * fadeMultiplier);
		}

		return nextEntries;
	}, [
		activeIncorrectHintCenterCellIndexes,
		incorrectHintFadeProgress,
		renderModel,
	]);

	const shouldHideExactIncorrectStyling =
		isPuzzleFilled &&
		(verifiedIncorrectCellIndexes.length > 0 || incorrectCellIndexes.length > 0);

	const handleShowIncorrectHint = () => {
		if (!renderModel || verifiedIncorrectCellIndexes.length === 0) {
			return;
		}

		const playableCellIndexes = renderModel.cells
			.filter((cell) => !cell.isBlock)
			.map((cell) => cell.index);
		const hintCenterCellIndexes = verifiedIncorrectCellIndexes
			.map((incorrectCellIndex) => {
				const candidateCellIndexes = playableCellIndexes.filter((cellIndex) => {
					const distance = getManhattanDistance(
						renderModel,
						cellIndex,
						incorrectCellIndex,
					);
					return distance > 0 && distance <= INCORRECT_HINT_RADIUS;
				});

				if (candidateCellIndexes.length === 0) {
					return null;
				}

				return candidateCellIndexes[
					Math.floor(Math.random() * candidateCellIndexes.length)
				];
			})
			.filter((cellIndex): cellIndex is number => cellIndex !== null);

		if (hintCenterCellIndexes.length === 0) {
			return;
		}

		setActiveIncorrectHintCenterCellIndexes(hintCenterCellIndexes);
		setShowIncorrectDialog(false);
	};

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

	const jumpToClueLabel = (label: string) => {
		if (!renderModel) {
			return false;
		}

		const normalizedInput = label.trim();
		if (!normalizedInput) {
			return false;
		}

		const matchingClues = renderModel.clues.filter(
			(clue) => clue.label === normalizedInput,
		);
		if (matchingClues.length === 0) {
			return false;
		}

		const preferredClue =
			matchingClues.find((clue) => clue.direction === selectedDirection) ??
			matchingClues[0];
		if (!preferredClue) {
			return false;
		}

		const firstCellIndex = preferredClue.cellIndexes[0];
		if (typeof firstCellIndex === "number") {
			setSelectedCellIndex(firstCellIndex);
			setSelectedDirection(preferredClue.direction);
			return true;
		}

		return false;
	};

	const handleRequestJumpToClue = () => {
		if (!renderModel) {
			return;
		}

		setJumpClueInput("");
		setJumpError(null);
		setShowJumpPalette(true);
	};

	const handleSubmitJumpToClue = () => {
		const normalizedInput = jumpClueInput.trim();
		if (!normalizedInput) {
			setJumpError("Enter a clue number to jump.");
			return;
		}

		const didJump = jumpToClueLabel(normalizedInput);
		if (!didJump) {
			setJumpError(`No clue ${normalizedInput} in this puzzle.`);
			return;
		}

		setShowJumpPalette(false);
		setJumpClueInput("");
		setJumpError(null);
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
			currentPosition >= 0
				? clueCells[currentPosition + 1] ?? clueCells[0]
				: undefined;

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
			setSelectedCellIndex(cellIndex);
			await deleteGuess(cellIndex);
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
			setSelectedCellIndex(previousCellIndex);
			await deleteGuess(previousCellIndex);
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

	const handleJumpSelection = (cellIndex: number, key: string) => {
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

		const clueId = getCellClueIdForDirection(
			renderModel,
			cellIndex,
			selectedDirection,
		);
		if (clueId === null) {
			return;
		}

		const clueCells = renderModel.clues[clueId]?.cellIndexes ?? [];
		const jumpCellIndex =
			key === "ArrowLeft" || key === "ArrowUp"
				? clueCells[0]
				: clueCells[clueCells.length - 1];

		if (typeof jumpCellIndex === "number") {
			setSelectedCellIndex(jumpCellIndex);
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
					<CrosswordTimer
						resetKey={puzzleMeta?.publicationDate ?? user?.uid ?? "no-puzzle"}
						isBusy={isBusy}
					/>
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

			{showJumpPalette ? (
				<div
					className="crossword-jump-overlay"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							setShowJumpPalette(false);
							setJumpError(null);
						}
					}}
				>
					<section
						className="crossword-jump-card"
						aria-label="Jump to clue"
					>
						<div className="crossword-jump-card__eyebrow">
							Jump To Clue
						</div>
						<div className="crossword-jump-card__header">
							<h2>Find a number fast</h2>
							<button
								type="button"
								className="crossword-jump-card__close"
								aria-label="Close jump to clue"
								onClick={() => {
									setShowJumpPalette(false);
									setJumpError(null);
								}}
							>
								×
							</button>
						</div>
						<p className="crossword-jump-card__body">
							Type a clue number. If it exists in both directions, we’ll
							prefer the current {selectedDirection.toLowerCase()} clue.
						</p>
						<form
							className="crossword-jump-card__form"
							onSubmit={(event) => {
								event.preventDefault();
								handleSubmitJumpToClue();
							}}
						>
							<input
								ref={jumpInputRef}
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								placeholder="e.g. 17"
								value={jumpClueInput}
								onChange={(event) => {
									setJumpClueInput(event.target.value.replace(/[^\d]/g, ""));
									if (jumpError) {
										setJumpError(null);
									}
								}}
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										event.preventDefault();
										setShowJumpPalette(false);
										setJumpError(null);
									}
								}}
								className="crossword-jump-card__input"
								aria-label="Clue number"
							/>
							<div className="crossword-jump-card__actions">
								<button
									type="button"
									className="crossword-jump-card__button crossword-jump-card__button--ghost"
									onClick={() => {
										setShowJumpPalette(false);
										setJumpError(null);
									}}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="crossword-jump-card__button crossword-jump-card__button--primary"
								>
									Jump
								</button>
							</div>
						</form>
						<div className="crossword-jump-card__footer">
							<span>Shortcut</span>
							<kbd>Cmd</kbd>
							<span>+</span>
							<kbd>J</kbd>
						</div>
						{jumpError ? (
							<p className="crossword-jump-card__error">{jumpError}</p>
						) : null}
					</section>
				</div>
			) : null}

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
							verifiedIncorrectCellIndexes={
								new Set(verifiedIncorrectCellIndexes)
							}
							hideIncorrectStyling={shouldHideExactIncorrectStyling}
							proximityHintIntensityByCellIndex={
								proximityHintIntensityByCellIndex
							}
							guessOwners={guessOwners}
							remoteSelections={remoteSelections}
							showOwnership={showOwnership}
							onSelectCell={handleSelectCell}
							onUpdateGuess={(cellIndex, value) =>
								void handleUpdateGuess(cellIndex, value)
							}
							onDeleteGuess={(cellIndex) => void handleDeleteGuess(cellIndex)}
							onMoveSelection={handleMoveSelection}
							onJumpSelection={handleJumpSelection}
							onRequestJumpToClue={handleRequestJumpToClue}
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
					style={cluesStyle}
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
				variant="complete"
				contributors={contributionBars}
				showContributionChart={showContributionChart}
				onToggleContributionChart={() =>
					setShowContributionChart((current) => !current)
				}
				onDismiss={() => setShowCongrats(false)}
			/>
			<CongratsDialog
				isOpen={showIncorrectDialog}
				variant="incorrect"
				incorrectCount={verifiedIncorrectCellIndexes.length}
				primaryActionLabel="Show hint"
				onPrimaryAction={handleShowIncorrectHint}
				onDismiss={() => {
					setShowIncorrectDialog(false);
				}}
			/>
			<CongratsDialog
				isOpen={showUnverifiedDialog}
				variant="unverified"
				onDismiss={() => setShowUnverifiedDialog(false)}
			/>
		</div>
	);
}
