import CalendarPicker from "./CalendarPicker";
import CrosswordMonogram from "./CrosswordMonogram";

import type {
	CalendarStatusMap,
	PuzzleMetadata,
	UserProfile,
} from "./firebaseTypes";

type ActiveUser = {
	uid: string;
	username: string;
	color: string;
};

type CrosswordHeaderProps = {
	puzzle: PuzzleMetadata | null;
	currentProfile: UserProfile | null;
	activeUsers: ActiveUser[];
	monthViewDate: Date;
	monthStatuses: CalendarStatusMap;
	selectedDate: string | null;
	showOwnership: boolean;
	onOpenMenu: () => void;
	onChangeMonth: (nextDate: Date) => void;
	onSelectDate: (date: string) => void;
};

function formatPublicationDate(publicationDate: string | undefined) {
	if (!publicationDate) {
		return "Choose a puzzle";
	}

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

export default function CrosswordHeader({
	puzzle,
	currentProfile,
	activeUsers,
	monthViewDate,
	monthStatuses,
	selectedDate,
	showOwnership,
	onOpenMenu,
	onChangeMonth,
	onSelectDate,
}: CrosswordHeaderProps) {
	return (
		<>
			<header className="crossword-site-header">
				<div className="crossword-site-header__brand">
					<button
						type="button"
						className="crossword-icon-button crossword-icon-button--menu"
						aria-label="Open navigation"
						onClick={onOpenMenu}
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
						<CrosswordMonogram />
						<span
							className="crossword-site-header__logo-divider"
							aria-hidden="true"
						/>
						<span className="crossword-site-header__logo-text">collab</span>
					</a>
				</div>
				<div className="crossword-site-header__meta">
					{currentProfile ? (
						<div className="crossword-site-header__current-user">
							<span
								className="crossword-avatar"
								style={{ backgroundColor: currentProfile.color }}
							>
								{currentProfile.initial}
							</span>
							<span>{currentProfile.username}</span>
						</div>
					) : null}
				</div>
			</header>

			<section className="crossword-titlebar">
				<div className="crossword-titlebar__details">
					<div className="crossword-titlebar__heading">
						<h1>{puzzle?.title ?? "The Crossword"}</h1>
						<h2>{formatPublicationDate(puzzle?.publicationDate)}</h2>
					</div>
					<div className="crossword-titlebar__byline">
						{puzzle?.constructors?.length ? (
							<span>By {puzzle.constructors.join(", ")}</span>
						) : null}
						{puzzle?.editor ? <span>Edited by {puzzle.editor}</span> : null}
					</div>
				</div>
				<div className="crossword-titlebar__controls">
					<CalendarPicker
						value={selectedDate}
						monthViewDate={monthViewDate}
						statuses={monthStatuses}
						onMonthChange={onChangeMonth}
						onSelectDate={onSelectDate}
					/>
					<div className="crossword-active-bar">
						<span className="crossword-active-bar__label">Active now:</span>
						<div className="crossword-active-users">
							{activeUsers.map((activeUser) => (
								<span
									key={activeUser.uid}
									className="crossword-active-user-pill"
									title={activeUser.username}
									style={{
										backgroundColor: activeUser.color,
									}}
								>
									{activeUser.username}
								</span>
							))}
						</div>
					</div>
					{showOwnership ? (
						<div className="crossword-edits-legend">
							<span className="crossword-edits-legend__label">Edits</span>
							{activeUsers.map((activeUser) => (
								<span
									key={`legend-${activeUser.uid}`}
									className="crossword-edits-legend__item"
									style={{ color: activeUser.color }}
								>
									{activeUser.username}
								</span>
							))}
						</div>
					) : null}
				</div>
			</section>
		</>
	);
}
