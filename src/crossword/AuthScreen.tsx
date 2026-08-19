import { useEffect, useState, type ReactNode } from "react";

type AuthScreenProps = {
	isBusy: boolean;
	isVerifyingPasswordResetCode: boolean;
	error: string | null;
	onLogin: (input: { email: string; password: string }) => Promise<void>;
	onCreateAccount: (input: {
		email: string;
		password: string;
		username: string;
		color: string;
	}) => Promise<void>;
	onRequestPasswordReset: (email: string) => Promise<boolean>;
	onResetPassword: (input: {
		oobCode: string;
		password: string;
	}) => Promise<boolean>;
	onClearPendingPasswordReset: () => void;
	passwordResetCode: string | null;
	passwordResetEmail: string | null;
};

const DEFAULT_COLORS = ["#46F26C", "#3373D4", "#F25E46", "#E4A02C", "#8B5CF6"];

export default function AuthScreen({
	isBusy,
	isVerifyingPasswordResetCode,
	error,
	onLogin,
	onCreateAccount,
	onRequestPasswordReset,
	onResetPassword,
	onClearPendingPasswordReset,
	passwordResetCode,
	passwordResetEmail,
}: AuthScreenProps) {
	const [mode, setMode] = useState<"login" | "create" | "forgot" | "reset">(
		passwordResetCode ? "reset" : "login",
	);
	const [notice, setNotice] = useState<string | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);

	useEffect(() => {
		setLocalError(null);
		if (passwordResetCode) {
			setMode("reset");
			return;
		}

		setMode((current) => (current === "reset" ? "login" : current));
	}, [passwordResetCode]);

	const activeError = localError ?? error;
	const isTabMode = mode === "login" || mode === "create";
	const title =
		mode === "create"
			? "Create account"
			: mode === "forgot"
				? "Reset password"
				: mode === "reset"
					? "Choose a new password"
					: "Welcome back";
	const body =
		mode === "forgot"
			? "Enter the email you use for the crossword and Firebase will send a reset link."
			: mode === "reset"
				? `Set a new password${passwordResetEmail ? ` for ${passwordResetEmail}` : ""}.`
				: "One shared grid. Live collaboration. Allowed emails only.";

	return (
		<div className="crossword-auth-shell">
			<div className="crossword-auth-card">
				<p className="crossword-auth-card__eyebrow">collab crossword</p>
				<h1>{title}</h1>
				<p className="crossword-auth-card__body">{body}</p>
				{isTabMode ? (
					<div className="crossword-auth-card__tabs" role="tablist">
						<button
							type="button"
							className={
								mode === "login"
									? "crossword-auth-card__tab crossword-auth-card__tab--active"
									: "crossword-auth-card__tab"
							}
							onClick={() => {
								setLocalError(null);
								setNotice(null);
								setMode("login");
							}}
						>
							Login
						</button>
						<button
							type="button"
							className={
								mode === "create"
									? "crossword-auth-card__tab crossword-auth-card__tab--active"
									: "crossword-auth-card__tab"
							}
							onClick={() => {
								setLocalError(null);
								setNotice(null);
								setMode("create");
							}}
						>
							Create Account
						</button>
					</div>
				) : (
					<button
						type="button"
						className="crossword-auth-form__link"
						onClick={() => {
							setLocalError(null);
							setNotice(null);
							if (mode === "reset") {
								onClearPendingPasswordReset();
							}
							setMode("login");
						}}
					>
						Back to login
					</button>
				)}
				{notice ? <p className="crossword-auth-form__success">{notice}</p> : null}
				{mode === "login" ? (
					<AuthForm
						isBusy={isBusy}
						error={activeError}
						submitLabel="Login"
						fields={["email", "password"]}
						footer={
							<button
								type="button"
								className="crossword-auth-form__link"
								onClick={() => {
									setLocalError(null);
									setNotice(null);
									setMode("forgot");
								}}
							>
								Forgot password?
							</button>
						}
						onSubmit={(values) =>
							onLogin({
								email: values.email,
								password: values.password,
							})
						}
					/>
				) : (
					<>
						{mode === "create" ? (
							<AuthForm
								isBusy={isBusy}
								error={activeError}
								submitLabel="Create Account"
								fields={["email", "password", "username", "color"]}
								defaultColor={DEFAULT_COLORS[0]}
								colorOptions={DEFAULT_COLORS}
								onSubmit={(values) =>
									onCreateAccount({
										email: values.email,
										password: values.password,
										username: values.username,
										color: values.color,
									})
								}
							/>
						) : null}
						{mode === "forgot" ? (
							<AuthForm
								isBusy={isBusy}
								error={activeError}
								submitLabel="Send Reset Email"
								fields={["email"]}
								onSubmit={async (values) => {
									setLocalError(null);
									const didSend = await onRequestPasswordReset(values.email);
									if (!didSend) {
										return;
									}

									setNotice(
										`If an account exists for ${values.email}, a reset link is on the way.`,
									);
									setMode("login");
								}}
							/>
						) : null}
						{mode === "reset" ? (
							<AuthForm
								isBusy={isBusy || isVerifyingPasswordResetCode}
								error={activeError}
								submitLabel={
									isVerifyingPasswordResetCode
										? "Checking Link…"
										: "Set New Password"
								}
								fields={["password", "confirmPassword"]}
								onSubmit={async (values) => {
									setLocalError(null);
									if (!passwordResetCode) {
										setLocalError(
											"This password reset link is invalid or has expired.",
										);
										return;
									}

									if (values.password !== values.confirmPassword) {
										setLocalError("Passwords do not match.");
										return;
									}

									const didReset = await onResetPassword({
										oobCode: passwordResetCode,
										password: values.password,
									});
									if (!didReset) {
										return;
									}

									setNotice("Password updated. Log in with your new password.");
									setMode("login");
								}}
							/>
						) : null}
					</>
				)}
			</div>
		</div>
	);
}

type AuthFormProps = {
	isBusy: boolean;
	error: string | null;
	submitLabel: string;
	fields: Array<"email" | "password" | "confirmPassword" | "username" | "color">;
	defaultColor?: string;
	colorOptions?: string[];
	footer?: ReactNode;
	onSubmit: (values: Record<string, string>) => Promise<void>;
};

function AuthForm({
	isBusy,
	error,
	submitLabel,
	fields,
	defaultColor,
	colorOptions = [],
	footer,
	onSubmit,
}: AuthFormProps) {
	const [values, setValues] = useState<Record<string, string>>({
		email: "",
		password: "",
		confirmPassword: "",
		username: "",
		color: defaultColor ?? "#46F26C",
	});

	return (
		<form
			className="crossword-auth-form"
			onSubmit={(event) => {
				event.preventDefault();
				void onSubmit(values);
			}}
		>
			{fields.includes("email") ? (
				<label className="crossword-auth-form__field">
					<span>Email</span>
					<input
						type="email"
						value={values.email}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								email: event.target.value,
							}))
						}
						required
					/>
				</label>
			) : null}
			{fields.includes("password") ? (
				<label className="crossword-auth-form__field">
					<span>Password</span>
					<input
						type="password"
						value={values.password}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								password: event.target.value,
							}))
						}
						required
					/>
				</label>
			) : null}
			{fields.includes("confirmPassword") ? (
				<label className="crossword-auth-form__field">
					<span>Confirm Password</span>
					<input
						type="password"
						value={values.confirmPassword}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								confirmPassword: event.target.value,
							}))
						}
						required
					/>
				</label>
			) : null}
			{fields.includes("username") ? (
				<label className="crossword-auth-form__field">
					<span>Username</span>
					<input
						type="text"
						value={values.username}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								username: event.target.value,
							}))
						}
						required
					/>
				</label>
			) : null}
			{fields.includes("color") ? (
				<div className="crossword-auth-form__field">
					<span>Profile Color</span>
					<div className="crossword-color-picker" role="radiogroup">
						{colorOptions.map((color) => (
							<button
								key={color}
								type="button"
								className={
									values.color === color
										? "crossword-color-picker__swatch crossword-color-picker__swatch--selected"
										: "crossword-color-picker__swatch"
								}
								style={{ backgroundColor: color }}
								onClick={() =>
									setValues((current) => ({
										...current,
										color,
									}))
								}
								aria-label={`Select ${color}`}
							/>
						))}
					</div>
				</div>
			) : null}
			{error ? <p className="crossword-auth-form__error">{error}</p> : null}
			{footer ? <div className="crossword-auth-form__footer">{footer}</div> : null}
			<button
				type="submit"
				className="crossword-auth-form__submit"
				disabled={isBusy}
			>
				{isBusy ? "Working…" : submitLabel}
			</button>
		</form>
	);
}
