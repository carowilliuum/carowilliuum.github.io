import { useEffect, useState } from "react";

import PixelAvatar, { getPixelAvatarName } from "./PixelAvatar";
import type { UserProfile } from "./firebaseTypes";

type ProfileDrawerProps = {
	isOpen: boolean;
	profile: UserProfile | null;
	onClose: () => void;
	onSave: (input: { username: string; color: string }) => Promise<void>;
	onSignOut: () => Promise<void>;
};

const DEFAULT_PROFILE_COLOR = "#46F26C";

export default function ProfileDrawer({
	isOpen,
	profile,
	onClose,
	onSave,
	onSignOut,
}: ProfileDrawerProps) {
	const [username, setUsername] = useState(profile?.username ?? "");
	const [color, setColor] = useState(profile?.color ?? DEFAULT_PROFILE_COLOR);

	useEffect(() => {
		setUsername(profile?.username ?? "");
		setColor(profile?.color ?? DEFAULT_PROFILE_COLOR);
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
					{profile ? (
						<div className="crossword-profile-avatar-preview">
							<PixelAvatar
								seed={profile.id}
								label={username || profile.username}
								color={color}
								className="crossword-profile-avatar-preview__sprite"
							/>
							<div>
								<span className="crossword-profile-avatar-preview__label">
									Avatar
								</span>
								<span className="crossword-profile-avatar-preview__name">
									{getPixelAvatarName(profile.id)}
								</span>
							</div>
						</div>
					) : null}
					<label className="crossword-auth-form__field">
						<span>Username</span>
						<input
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
						/>
					</label>
					<label className="crossword-auth-form__field">
						<span>Color</span>
						<div className="crossword-color-wheel">
							<input
								type="color"
								value={color}
								onChange={(event) => setColor(event.target.value)}
								aria-label="Choose profile color"
							/>
							<span>{color.toUpperCase()}</span>
						</div>
					</label>
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
