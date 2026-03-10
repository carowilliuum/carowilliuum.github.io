import type { CrosswordListItem } from "./nyt";

type ClueListProps = {
	title: string;
	clues: CrosswordListItem[];
	markedClueIds: Set<number>;
	selectedClueId: number | null;
	onSelectClue: (clueId: number) => void;
};

export default function ClueList({
	title,
	clues,
	markedClueIds,
	selectedClueId,
	onSelectClue,
}: ClueListProps) {
	return (
		<section className="crossword-clues__section" aria-label={`${title} clues`}>
			<h2 className="crossword-clues__title">{title}</h2>
			<ol className="crossword-clues__list">
				{clues.map((clue) => {
					const className = [
						"crossword-clues__item",
						selectedClueId === clue.id ? "crossword-clues__item--selected" : "",
						markedClueIds.has(clue.id)
							? "crossword-clues__item--marked"
							: "",
					]
						.filter(Boolean)
						.join(" ");

					return (
						<li key={`${title}-${clue.id}`} className={className}>
							<button
								type="button"
								className="crossword-clues__button"
								onClick={() => onSelectClue(clue.id)}
							>
								<span className="crossword-clues__label">{clue.label}</span>
								<span className="crossword-clues__text">{clue.text}</span>
							</button>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
