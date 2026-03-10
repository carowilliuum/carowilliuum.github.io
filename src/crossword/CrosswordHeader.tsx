import { crosswordMeta } from "./data";

export default function CrosswordHeader() {
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
					<a href="/" className="crossword-site-header__logo" aria-label="Games home">
						<span className="crossword-site-header__logo-mark">T</span>
						<span className="crossword-site-header__logo-text">Games</span>
					</a>
				</div>
			</header>

			<section className="crossword-titlebar">
				<div className="crossword-titlebar__details">
					<div className="crossword-titlebar__heading">
						<h1>{crosswordMeta.title}</h1>
						<p>{crosswordMeta.date}</p>
					</div>
					<div className="crossword-titlebar__byline">
						<span>&ldquo;{crosswordMeta.puzzleTitle}&rdquo;</span>
						<span>By {crosswordMeta.author}</span>
						<span>Edited by {crosswordMeta.editor}</span>
					</div>
				</div>
				<button type="button" className="crossword-print-button">
					<span className="crossword-print-button__icon" aria-hidden="true" />
					<span>Print</span>
				</button>
			</section>
		</>
	);
}
