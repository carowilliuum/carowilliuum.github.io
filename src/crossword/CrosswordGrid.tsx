import { crosswordGrid, crosswordMeta } from "./data";

export default function CrosswordGrid() {
	return (
		<section className="crossword-board-panel" aria-label="Game board with clue bar">
			<div className="crossword-clue-bar">
				<div className="crossword-clue-bar__number">{crosswordMeta.currentClueNumber}</div>
				<div className="crossword-clue-bar__text">{crosswordMeta.currentClueText}</div>
			</div>

			<div className="crossword-grid" role="grid" aria-label="Crossword puzzle grid">
				{crosswordGrid.flatMap((row, rowIndex) =>
					row.map((cell, columnIndex) => {
						const className = [
							"crossword-grid__cell",
							cell.block ? "crossword-grid__cell--block" : "",
							cell.highlighted ? "crossword-grid__cell--highlighted" : "",
							cell.selected ? "crossword-grid__cell--selected" : "",
						]
							.filter(Boolean)
							.join(" ");

						return (
							<div
								key={`${rowIndex}-${columnIndex}`}
								className={className}
								role="gridcell"
								aria-selected={cell.selected ? "true" : "false"}
							>
								{!cell.block && (
									<>
										{cell.number ? (
											<span className="crossword-grid__number">{cell.number}</span>
										) : null}
										<span className="crossword-grid__letter">{cell.letter}</span>
									</>
								)}
							</div>
						);
					})
				)}
			</div>
		</section>
	);
}
