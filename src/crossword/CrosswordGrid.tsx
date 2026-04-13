import { useEffect, useRef, type CSSProperties } from "react";

import type {
	PuzzleState,
	RenderModel,
	UserProfile,
} from "./firebaseTypes";

type RemoteSelection = {
	uid: string;
	color: string;
	selectedCellIndex: number | null;
};

type CrosswordGridProps = {
	puzzle: RenderModel;
	isSmallScreen: boolean;
	selectedCellIndex: number | null;
	primaryHighlightedCellIndexes: Set<number>;
	secondaryHighlightedCellIndexes: Set<number>;
	activeClueLabel: string;
	activeClueText: string;
	puzzleState: PuzzleState;
	verifiedIncorrectCellIndexes: Set<number>;
	hideIncorrectStyling: boolean;
	proximityHintIntensityByCellIndex: Map<number, number>;
	guessOwners: Record<string, UserProfile | undefined>;
	remoteSelections: RemoteSelection[];
	showOwnership: boolean;
	onSelectCell: (cellIndex: number) => void;
	onUpdateGuess: (cellIndex: number, value: string) => void;
	onDeleteGuess: (cellIndex: number) => void;
	onMoveSelection: (cellIndex: number, key: string) => void;
	onJumpSelection: (cellIndex: number, key: string) => void;
	onRequestJumpToClue: () => void;
};

export default function CrosswordGrid({
	puzzle,
	isSmallScreen,
	selectedCellIndex,
	primaryHighlightedCellIndexes,
	secondaryHighlightedCellIndexes,
	activeClueLabel,
	activeClueText,
	puzzleState,
	verifiedIncorrectCellIndexes,
	hideIncorrectStyling,
	proximityHintIntensityByCellIndex,
	guessOwners,
	remoteSelections,
	showOwnership,
	onSelectCell,
	onUpdateGuess,
	onDeleteGuess,
	onMoveSelection,
	onJumpSelection,
	onRequestJumpToClue,
}: CrosswordGridProps) {
	const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const mobileInputRef = useRef<HTMLInputElement | null>(null);

	const focusMobileInput = () => {
		const input = mobileInputRef.current;
		if (!input) {
			return;
		}

		input.focus({ preventScroll: true });
		const inputLength = input.value.length;
		input.setSelectionRange(inputLength, inputLength);
	};

	const clearMobileInput = () => {
		if (mobileInputRef.current) {
			mobileInputRef.current.value = "";
		}
	};

	useEffect(() => {
		if (selectedCellIndex === null) {
			return;
		}

		if (isSmallScreen) {
			focusMobileInput();
			return;
		}

		cellRefs.current[selectedCellIndex]?.focus();
	}, [isSmallScreen, selectedCellIndex]);

	return (
		<section className="crossword-board-panel" aria-label="Game board with clue bar">
			<div className="crossword-clue-bar">
				<div className="crossword-clue-bar__number">{activeClueLabel}</div>
				<div className="crossword-clue-bar__text">{activeClueText}</div>
			</div>
			<input
				ref={mobileInputRef}
				type="text"
				className="crossword-mobile-input"
				inputMode="text"
				autoCapitalize="characters"
				autoComplete="off"
				autoCorrect="off"
				spellCheck={false}
				aria-label="Crossword letter input"
				onBlur={() => {
					clearMobileInput();
				}}
				onBeforeInput={(event) => {
					if (selectedCellIndex === null) {
						clearMobileInput();
						return;
					}

					const nativeEvent = event.nativeEvent as InputEvent;
					if (
						nativeEvent.inputType === "deleteContentBackward" ||
						nativeEvent.inputType === "deleteContentForward"
					) {
						event.preventDefault();
						onDeleteGuess(selectedCellIndex);
						clearMobileInput();
						return;
					}

					if (!nativeEvent.inputType.startsWith("insert")) {
						return;
					}

					const insertedText = (nativeEvent.data ?? "")
						.replace(/[^a-z0-9]/gi, "")
						.toUpperCase();
					if (!insertedText) {
						event.preventDefault();
						clearMobileInput();
						return;
					}

					event.preventDefault();
					const currentValue =
						puzzleState.guesses[String(selectedCellIndex)]?.value ?? "";
					const isRebusCell =
						(puzzle.cells[selectedCellIndex]?.type ?? 1) !== 1;
					onUpdateGuess(
						selectedCellIndex,
						isRebusCell ? `${currentValue}${insertedText}` : insertedText,
					);
					clearMobileInput();
				}}
				onInput={() => {
					clearMobileInput();
				}}
				onKeyDown={(event) => {
					if (selectedCellIndex === null) {
						return;
					}

					if (event.key === "Backspace" || event.key === "Delete") {
						event.preventDefault();
						onDeleteGuess(selectedCellIndex);
						clearMobileInput();
						return;
					}

					if (
						event.key === "ArrowUp" ||
						event.key === "ArrowDown" ||
						event.key === "ArrowLeft" ||
						event.key === "ArrowRight"
					) {
						event.preventDefault();
						if (event.metaKey) {
							onJumpSelection(selectedCellIndex, event.key);
							return;
						}
						onMoveSelection(selectedCellIndex, event.key);
						return;
					}

					if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
						event.preventDefault();
						onRequestJumpToClue();
						return;
					}

					if (/^[a-z0-9]$/i.test(event.key)) {
						event.preventDefault();
						const currentValue =
							puzzleState.guesses[String(selectedCellIndex)]?.value ?? "";
						const isRebusCell =
							(puzzle.cells[selectedCellIndex]?.type ?? 1) !== 1;
						onUpdateGuess(
							selectedCellIndex,
							isRebusCell
								? `${currentValue}${event.key.toUpperCase()}`
								: event.key.toUpperCase(),
						);
						clearMobileInput();
					}
				}}
			/>

			<div
				className="crossword-grid"
				role="grid"
				aria-label="Crossword puzzle grid"
				style={{
					gridTemplateColumns: `repeat(${puzzle.dimensions.width}, 1fr)`,
				}}
			>
				{puzzle.cells.map((cell) => {
					const cellIndex = cell.index;
					const isBlock = cell.isBlock;
					const annotation = puzzleState.cellAnnotations[String(cellIndex)];
					const guessEntry = puzzleState.guesses[String(cellIndex)];
					const guessOwner = guessEntry?.guesserId
						? guessOwners[guessEntry.guesserId]
						: undefined;
					const remoteSelectionsForCell = remoteSelections.filter(
						(entry) => entry.selectedCellIndex === cellIndex,
					);
					const remoteSelectionOutline =
						remoteSelectionsForCell.length > 0
							? {
									boxShadow: remoteSelectionsForCell
										.map(
											(entry, index) =>
												`inset 0 0 0 ${index + 2}px ${entry.color}`,
										)
										.join(", "),
							  }
							: undefined;
					const hintIntensity =
						proximityHintIntensityByCellIndex.get(cellIndex) ?? 0;
					const className = [
						"crossword-grid__cell",
						isBlock ? "crossword-grid__cell--block" : "",
						secondaryHighlightedCellIndexes.has(cellIndex)
							? "crossword-grid__cell--secondary-highlighted"
							: "",
						primaryHighlightedCellIndexes.has(cellIndex)
							? "crossword-grid__cell--highlighted"
							: "",
						selectedCellIndex === cellIndex
							? "crossword-grid__cell--selected"
							: "",
						annotation?.status === "correct"
							? "crossword-grid__cell--correct"
							: "",
						!hideIncorrectStyling &&
						annotation?.status === "incorrect"
							? "crossword-grid__cell--incorrect"
							: "",
						!hideIncorrectStyling &&
						verifiedIncorrectCellIndexes.has(cellIndex)
							? "crossword-grid__cell--incorrect"
							: "",
						annotation?.revealed ? "crossword-grid__cell--revealed" : "",
					]
						.filter(Boolean)
						.join(" ");

					if (isBlock) {
						return (
							<div
								key={cellIndex}
								className={className}
								role="gridcell"
								aria-readonly="true"
							/>
						);
					}

					return (
						<button
							key={cellIndex}
							ref={(element) => {
								cellRefs.current[cellIndex] = element;
							}}
							type="button"
							className={className}
							role="gridcell"
							aria-selected={selectedCellIndex === cellIndex}
							tabIndex={selectedCellIndex === cellIndex ? 0 : -1}
							onClick={() => onSelectCell(cellIndex)}
							onPointerDown={(event) => {
								if (!isSmallScreen) {
									return;
								}

								event.preventDefault();
								focusMobileInput();
							}}
							style={{
								...remoteSelectionOutline,
								"--crossword-cell-hint-overlay": `rgba(210, 50, 50, ${hintIntensity.toFixed(
									3,
								)})`,
							} as CSSProperties}
							onKeyDown={(event) => {
								const currentValue = guessEntry?.value ?? "";
								const isRebusCell = (cell.type ?? 1) !== 1;

								if (event.key === "Backspace" || event.key === "Delete") {
									event.preventDefault();
									if (isRebusCell && currentValue.length > 1) {
										onUpdateGuess(
											cellIndex,
											currentValue.slice(0, -1),
										);
										return;
									}
									onDeleteGuess(cellIndex);
									return;
								}

								if (
									event.key === "ArrowUp" ||
									event.key === "ArrowDown" ||
									event.key === "ArrowLeft" ||
									event.key === "ArrowRight"
								) {
									event.preventDefault();
									if (event.metaKey) {
										onJumpSelection(cellIndex, event.key);
										return;
									}
									onMoveSelection(cellIndex, event.key);
									return;
								}

								if (event.metaKey && event.key.toLowerCase() === "j") {
									event.preventDefault();
									onRequestJumpToClue();
									return;
								}

								if (/^[a-z0-9]$/i.test(event.key)) {
									event.preventDefault();
									onUpdateGuess(
										cellIndex,
										isRebusCell
											? `${currentValue}${event.key.toUpperCase()}`
											: event.key.toUpperCase(),
									);
								}
							}}
						>
							{cell.label ? (
								<span className="crossword-grid__number">{cell.label}</span>
							) : null}
							<span
								className="crossword-grid__letter"
								style={
									showOwnership && guessOwner
										? { color: guessOwner.color }
										: undefined
								}
							>
								{guessEntry?.value ?? ""}
							</span>
						</button>
					);
				})}
			</div>
		</section>
	);
}
