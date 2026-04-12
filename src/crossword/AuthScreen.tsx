import { useState } from "react";

type AuthScreenProps = {
	isBusy: boolean;
	error: string | null;
	onLogin: (input: { email: string; password: string }) => Promise<void>;
	onCreateAccount: (input: {
		email: string;
		password: string;
		username: string;
		color: string;
	}) => Promise<void>;
};

const DEFAULT_COLORS = ["#46F26C", "#3373D4", "#F25E46", "#E4A02C", "#8B5CF6"];

export default function AuthScreen({
	isBusy,
	error,
	onLogin,
	onCreateAccount,
}: AuthScreenProps) {
	const [mode, setMode] = useState<"login" | "create">("login");

	return (
		<div className="crossword-auth-shell">
			<div className="crossword-auth-card">
				<p className="crossword-auth-card__eyebrow">collab crossword</p>
				<h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
				<p className="crossword-auth-card__body">
					One shared grid. Live collaboration. Allowed emails only.
				</p>
				<div className="crossword-auth-card__tabs" role="tablist">
					<button
						type="button"
						className={
							mode === "login"
								? "crossword-auth-card__tab crossword-auth-card__tab--active"
								: "crossword-auth-card__tab"
						}
						onClick={() => setMode("login")}
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
						onClick={() => setMode("create")}
					>
						Create Account
					</button>
				</div>
				{mode === "login" ? (
					<AuthForm
						isBusy={isBusy}
						error={error}
						submitLabel="Login"
						fields={["email", "password"]}
						onSubmit={(values) =>
							onLogin({
								email: values.email,
								password: values.password,
							})
						}
					/>
				) : (
					<AuthForm
						isBusy={isBusy}
						error={error}
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
				)}
			</div>
		</div>
	);
}

type AuthFormProps = {
	isBusy: boolean;
	error: string | null;
	submitLabel: string;
	fields: Array<"email" | "password" | "username" | "color">;
	defaultColor?: string;
	colorOptions?: string[];
	onSubmit: (values: Record<string, string>) => Promise<void>;
};

function AuthForm({
	isBusy,
	error,
	submitLabel,
	fields,
	defaultColor,
	colorOptions = [],
	onSubmit,
}: AuthFormProps) {
	const [values, setValues] = useState<Record<string, string>>({
		email: "",
		password: "",
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
