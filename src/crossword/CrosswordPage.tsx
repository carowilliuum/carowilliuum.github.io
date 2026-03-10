import ClueList from "./ClueList";
import CrosswordGrid from "./CrosswordGrid";
import CrosswordHeader from "./CrosswordHeader";
import { acrossClues, crosswordMeta, downClues } from "./data";
import "./crossword.css";

export default function CrosswordPage() {
	return (
		<div className="crossword-page">
			<CrosswordHeader />

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

				<div className="crossword-toolbar__timer">{crosswordMeta.timer}</div>

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
				<CrosswordGrid />
				<section className="crossword-clues" aria-label="Clue lists">
					<ClueList title="Across" clues={acrossClues} />
					<ClueList title="Down" clues={downClues} />
				</section>
			</main>
		</div>
	);
}
