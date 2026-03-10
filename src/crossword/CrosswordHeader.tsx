import type { NYTPuzzle } from "./nyt";

type CrosswordHeaderProps = {
	puzzle: NYTPuzzle | null;
};

function formatPublicationDate(publicationDate: string) {
	const parsedDate = new Date(publicationDate);

	if (Number.isNaN(parsedDate.getTime())) {
		return publicationDate;
	}

	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(parsedDate);
}

export default function CrosswordHeader({ puzzle }: CrosswordHeaderProps) {
	const publicationDate = puzzle
		? formatPublicationDate(puzzle.publicationDate)
		: "Loading puzzle…";
	const constructors = puzzle?.constructors.join(", ");

	return (
		<>
			<header className="crossword-site-header">
				<div className="crossword-site-header__brand">
					<button
						type="button"
						className="crossword-icon-button crossword-icon-button--menu"
						aria-label="Open navigation"
					>
						<span />
						<span />
						<span />
					</button>
					<a
						href="/"
						className="crossword-site-header__logo"
						aria-label="Games home"
					>
						<span className="crossword-site-header__logo-mark">
							T
						</span>
						<span className="crossword-site-header__logo-text">
							Games
						</span>
					</a>
				</div>
			</header>

			<section className="crossword-titlebar">
				<div className="crossword-titlebar__details">
					<div className="crossword-titlebar__heading">
						<h1>The Crossword</h1>
						<p>{publicationDate}</p>
					</div>
					<div className="crossword-titlebar__byline">
						{constructors ? <span>By {constructors}</span> : null}
						{puzzle?.editor ? (
							<span>Edited by {puzzle.editor}</span>
						) : null}
						{puzzle?.copyright ? (
							<span>Copyright {puzzle.copyright}</span>
						) : null}
					</div>
				</div>
				<button type="button" className="crossword-print-button">
					<span
						className="crossword-print-button__icon"
						aria-hidden="true"
					/>
					<span>Print</span>
				</button>
			</section>
		</>
	);
}
