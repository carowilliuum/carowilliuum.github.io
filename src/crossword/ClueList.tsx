import type { CrosswordClue } from "./data";

type ClueListProps = {
	title: string;
	clues: CrosswordClue[];
};

export default function ClueList({ title, clues }: ClueListProps) {
	return (
		<section className="crossword-clues__section" aria-label={`${title} clues`}>
			<h2 className="crossword-clues__title">{title}</h2>
			<ol className="crossword-clues__list">
				{clues.map((clue) => {
					const className = [
						"crossword-clues__item",
						clue.filled ? "crossword-clues__item--filled" : "",
						clue.selected ? "crossword-clues__item--selected" : "",
						clue.highlighted ? "crossword-clues__item--highlighted" : "",
					]
						.filter(Boolean)
						.join(" ");

					return (
						<li key={`${title}-${clue.number}`} className={className}>
							<span className="crossword-clues__label">{clue.number}</span>
							<span className="crossword-clues__text">{clue.text}</span>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
