import CalendarPicker from "./CalendarPicker";
import CrosswordMonogram from "./CrosswordMonogram";
import PixelAvatar, { getPixelAvatarName } from "./PixelAvatar";

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

	const match = publicationDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	const parsedDate = match
		? new Date(
				Number(match[1]),
				Number(match[2]) - 1,
				Number(match[3]),
		  )
		: new Date(publicationDate);

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
						<button
							type="button"
							className="crossword-site-header__current-user"
							onClick={onOpenMenu}
							aria-label="Open profile settings"
						>
							<span
								className="crossword-avatar"
								style={{ backgroundColor: currentProfile.color }}
							>
								{currentProfile.initial}
							</span>
							<span>{currentProfile.username}</span>
						</button>
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
									className="crossword-active-avatar-wrap"
								>
									<span
										className="crossword-active-avatar"
										tabIndex={0}
										aria-label={`${activeUser.username}, ${getPixelAvatarName(
											activeUser.uid,
										)} avatar`}
									>
										<PixelAvatar
											seed={activeUser.uid}
											label={activeUser.username}
											color={activeUser.color}
											className="crossword-active-avatar__sprite"
										/>
									</span>
									<span className="crossword-active-avatar-preview" role="tooltip">
										<span className="crossword-active-avatar-preview__name">
											{activeUser.username}
										</span>
										<PixelAvatar
											seed={activeUser.uid}
											label={activeUser.username}
											color={activeUser.color}
											className="crossword-active-avatar-preview__sprite"
										/>
										<span className="crossword-active-avatar-preview__type">
											{getPixelAvatarName(activeUser.uid)}
										</span>
									</span>
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
