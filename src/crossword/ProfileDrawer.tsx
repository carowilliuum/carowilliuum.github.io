import { useEffect, useState } from "react";

import type { UserProfile } from "./firebaseTypes";

type ProfileDrawerProps = {
	isOpen: boolean;
	profile: UserProfile | null;
	onClose: () => void;
	onSave: (input: { username: string; color: string }) => Promise<void>;
	onSignOut: () => Promise<void>;
};

const PROFILE_COLORS = ["#46F26C", "#3373D4", "#F25E46", "#E4A02C", "#8B5CF6"];

export default function ProfileDrawer({
	isOpen,
	profile,
	onClose,
	onSave,
	onSignOut,
}: ProfileDrawerProps) {
	const [username, setUsername] = useState(profile?.username ?? "");
	const [color, setColor] = useState(profile?.color ?? PROFILE_COLORS[0]);

	useEffect(() => {
		setUsername(profile?.username ?? "");
		setColor(profile?.color ?? PROFILE_COLORS[0]);
	}, [profile]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="crossword-drawer-backdrop" onClick={onClose}>
			<aside
				className="crossword-profile-drawer"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="crossword-profile-drawer__header">
					<h2>Profile</h2>
					<button type="button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="crossword-profile-drawer__content">
					<label className="crossword-auth-form__field">
						<span>Username</span>
						<input
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
						/>
					</label>
					<div className="crossword-auth-form__field">
						<span>Color</span>
						<div className="crossword-color-picker">
							{PROFILE_COLORS.map((entry) => (
								<button
									key={entry}
									type="button"
									className={
										color === entry
											? "crossword-color-picker__swatch crossword-color-picker__swatch--selected"
											: "crossword-color-picker__swatch"
									}
									style={{ backgroundColor: entry }}
									onClick={() => setColor(entry)}
								/>
							))}
						</div>
					</div>
					<button
						type="button"
						className="crossword-auth-form__submit"
						onClick={() => void onSave({ username, color })}
					>
						Save Profile
					</button>
					<button
						type="button"
						className="crossword-profile-drawer__signout"
						onClick={() => void onSignOut()}
					>
						Sign Out
					</button>
				</div>
			</aside>
		</div>
	);
}
