import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

initializeApp();

const db = getFirestore();
const auth = getAuth();
const nytCookie = defineSecret("NYT_CROSSWORD_COOKIE");

type Direction = "Across" | "Down";
type SelectionScope = "cell" | "word" | "puzzle";

type NYTPuzzleResponse = {
	body?: Array<{
		board?: string;
		cells?: Array<{
			answer?: string;
			clues?: number[];
			label?: string;
			type?: number;
		}>;
		clueLists?: Array<{
			clues: number[];
			name: string;
		}>;
		clues?: Array<{
			cells: number[];
			direction: Direction;
			label: string;
			text: Array<{ plain: string }>;
		}>;
		dimensions?: {
			height: number;
			width: number;
		};
		title?: string;
	}>;
	constructors?: string[];
	editor?: string;
	id?: number;
	publicationDate?: string;
	title?: string;
};

type NYTPuzzleBody = NonNullable<NYTPuzzleResponse["body"]>[number];

type RenderCell = {
	index: number;
	label: string | null;
	type: number | null;
	isBlock: boolean;
	clueIds: number[];
};

type RenderClue = {
	id: number;
	direction: Direction;
	label: string;
	text: string;
	cellIndexes: number[];
};

type RenderModel = {
	title: string;
	dimensions: {
		height: number;
		width: number;
	};
	board: string;
	cells: RenderCell[];
	clues: RenderClue[];
	clueLists: Array<{
		name: string;
		clues: number[];
	}>;
	source: "nyt";
	sourceFetchedAt: Timestamp;
};

function getAuthenticatedUid(request: { auth?: { uid?: string } | null }) {
	const uid = request.auth?.uid;
	if (!uid) {
		throw new HttpsError("unauthenticated", "Authentication required.");
	}

	return uid;
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function buildInitial(value?: string) {
	const trimmed = (value ?? "").trim();
	return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

function getPuzzleTitle(
	payload: NYTPuzzleResponse,
	body: NYTPuzzleBody | undefined,
) {
	return body?.title ?? payload.title ?? "The Crossword";
}

function normalizePuzzle(payload: NYTPuzzleResponse) {
	const body = payload.body?.[0];
	if (!body?.cells || !body.clues || !body.clueLists || !body.dimensions || !payload.publicationDate) {
		throw new HttpsError(
			"internal",
			"NYT payload missing required puzzle fields.",
		);
	}

	const renderModel: RenderModel = {
		title: getPuzzleTitle(payload, body),
		dimensions: body.dimensions,
		board: body.board ?? "",
		cells: body.cells.map((cell, index) => ({
			index,
			label: cell.label ?? null,
			type: typeof cell.type === "number" ? cell.type : null,
			isBlock: !cell.answer,
			clueIds: cell.clues ?? [],
		})),
		clues: body.clues.map((clue, index) => ({
			id: index,
			direction: clue.direction,
			label: clue.label,
			text: clue.text.map((entry) => entry.plain).join(" "),
			cellIndexes: clue.cells,
		})),
		clueLists: body.clueLists.map((list) => ({
			name: list.name,
			clues: list.clues,
		})),
		source: "nyt",
		sourceFetchedAt: Timestamp.now(),
	};

	const answerKey = Object.fromEntries(
		body.cells.flatMap((cell, index) =>
			cell.answer ? [[String(index), cell.answer.toUpperCase()]] : [],
		),
	);

	return {
		puzzleId: payload.publicationDate,
		metadata: {
			publicationDate: payload.publicationDate,
			nytPuzzleId: payload.id ?? null,
			title: renderModel.title,
			constructors: payload.constructors ?? [],
			editor: payload.editor ?? null,
			importedAt: FieldValue.serverTimestamp(),
			lastWorkedAt: FieldValue.serverTimestamp(),
			completionState: "in_progress" as const,
			completedAt: null,
		},
		renderModel,
		answerKey,
	};
}

async function loadRenderModel(puzzleId: string) {
	const snapshot = await db
		.doc(`puzzles/${puzzleId}/content/renderModel`)
		.get();

	if (!snapshot.exists) {
		throw new HttpsError("not-found", "Puzzle render model not found.");
	}

	return snapshot.data() as RenderModel;
}

async function loadAnswerKey(puzzleId: string) {
	const snapshot = await db.doc(`puzzles/${puzzleId}/private/answerKey`).get();

	if (!snapshot.exists) {
		throw new HttpsError("not-found", "Puzzle answer key not found.");
	}

	const data = snapshot.data() as { cellAnswers?: Record<string, string> };
	return data.cellAnswers ?? {};
}

async function loadState(puzzleId: string) {
	const snapshot = await db.doc(`puzzles/${puzzleId}/state/current`).get();
	return (snapshot.data() ?? {
		guesses: {},
		cellAnnotations: {},
	}) as {
		guesses?: Record<
			string,
			{
				value?: string;
				guesserId?: string;
				updatedAt?: Timestamp;
				origin?: "manual" | "reveal";
			}
		>;
		cellAnnotations?: Record<
			string,
			{
				status?: "correct" | "incorrect";
				checkedAt?: Timestamp;
				checkedBy?: string;
				revealed?: boolean;
				revealedAt?: Timestamp;
				revealedBy?: string;
			}
		>;
	};
}

function getAffectedCellIndexes(
	renderModel: RenderModel,
	scope: SelectionScope,
	anchorCellIndex: number,
	direction: Direction,
) {
	if (scope === "puzzle") {
		return renderModel.cells
			.filter((cell) => !cell.isBlock)
			.map((cell) => cell.index);
	}

	if (scope === "cell") {
		return [anchorCellIndex];
	}

	const cell = renderModel.cells[anchorCellIndex];
	const clueId = cell?.clueIds.find(
		(id) => renderModel.clues[id]?.direction === direction,
	);

	if (typeof clueId !== "number") {
		return [anchorCellIndex];
	}

	return renderModel.clues[clueId]?.cellIndexes ?? [anchorCellIndex];
}

export const createAllowedAccount = onCall({ cors: true }, async (request) => {
	const data = request.data as {
		email?: string;
		password?: string;
		username?: string;
		color?: string;
	};

	const email = normalizeEmail(data.email ?? "");
	const password = data.password ?? "";
	const username = (data.username ?? "").trim();
	const color = (data.color ?? "").trim();

	if (!email || !password || !username || !color) {
		throw new HttpsError(
			"invalid-argument",
			"Email, password, username, and color are required.",
		);
	}

	if (password.length < 6) {
		throw new HttpsError(
			"invalid-argument",
			"Password must be at least 6 characters.",
		);
	}

	const inviteRef = db.doc(`invites/${email}`);
	const inviteSnapshot = await inviteRef.get();

	if (!inviteSnapshot.exists) {
		throw new HttpsError(
			"permission-denied",
			"This email is not authorized to create an account.",
		);
	}

	const invite = inviteSnapshot.data() as { status?: string } | undefined;
	if (invite?.status !== "pending") {
		throw new HttpsError(
			"already-exists",
			"This invitation is no longer available.",
		);
	}

	let userRecord;

	try {
		userRecord = await auth.createUser({
			email,
			password,
			displayName: username,
		});
	} catch (caughtError) {
		const errorCode =
			caughtError &&
			typeof caughtError === "object" &&
			"errorInfo" in caughtError &&
			typeof (caughtError as { errorInfo?: { code?: string } }).errorInfo?.code ===
				"string"
				? (caughtError as { errorInfo: { code: string } }).errorInfo.code
				: "";

		if (errorCode === "auth/email-already-exists") {
			throw new HttpsError(
				"already-exists",
				"An account already exists for this email.",
			);
		}

		if (errorCode === "auth/invalid-password") {
			throw new HttpsError(
				"invalid-argument",
				"Password must be at least 6 characters.",
			);
		}

		throw new HttpsError(
			"internal",
			"Unable to create account. Check function logs for details.",
		);
	}

	const userRef = db.doc(`users/${userRecord.uid}`);
	const now = FieldValue.serverTimestamp();

	await db.runTransaction(async (transaction) => {
		transaction.set(userRef, {
			email,
			username,
			initial: buildInitial(username),
			color,
			createdAt: now,
			updatedAt: now,
			lastSeenAt: now,
		});
		transaction.update(inviteRef, {
			status: "claimed",
			claimedByUid: userRecord.uid,
			claimedAt: now,
		});
	});

	return { uid: userRecord.uid, email };
});

export const ensurePuzzle = onCall(
	{ secrets: [nytCookie], cors: true },
	async (request) => {
		const uid = getAuthenticatedUid(request);
		const requestedDate = String(request.data?.date ?? "").trim();

		if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
			throw new HttpsError(
				"invalid-argument",
				"A puzzle date in YYYY-MM-DD format is required.",
			);
		}

		const puzzleRef = db.doc(`puzzles/${requestedDate}`);
		const existing = await puzzleRef.get();

		if (existing.exists) {
			return { puzzleId: requestedDate, imported: false };
		}

		const response = await fetch(
			`https://www.nytimes.com/svc/crosswords/v6/puzzle/daily/${requestedDate}.json`,
			{
				headers: {
					cookie: nytCookie.value(),
					"user-agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
				},
			},
		);

		if (!response.ok) {
			throw new HttpsError(
				"internal",
				`NYT request failed with status ${response.status}.`,
			);
		}

		const payload = (await response.json()) as NYTPuzzleResponse;
		const normalized = normalizePuzzle(payload);
		const batch = db.batch();

		batch.set(puzzleRef, {
			...normalized.metadata,
			importedBy: uid,
			lastEditedBy: uid,
		});
		batch.set(db.doc(`puzzles/${requestedDate}/content/renderModel`), normalized.renderModel);
		batch.set(db.doc(`puzzles/${requestedDate}/private/answerKey`), {
			cellAnswers: normalized.answerKey,
		});
		batch.set(db.doc(`puzzles/${requestedDate}/state/current`), {
			guesses: {},
			cellAnnotations: {},
			updatedAt: FieldValue.serverTimestamp(),
			lastEditedBy: uid,
			revision: 0,
		});
		batch.set(db.doc(`puzzles/${requestedDate}/presence/current`), {
			users: {},
		});
		await batch.commit();

		return { puzzleId: requestedDate, imported: true };
	},
);

export const checkSelection = onCall({ cors: true }, async (request) => {
	const uid = getAuthenticatedUid(request);
	const puzzleId = String(request.data?.puzzleId ?? "");
	const scope = String(request.data?.scope ?? "") as SelectionScope;
	const anchorCellIndex = Number(request.data?.anchorCellIndex ?? -1);
	const direction = String(request.data?.direction ?? "") as Direction;

	if (!puzzleId || Number.isNaN(anchorCellIndex)) {
		throw new HttpsError("invalid-argument", "Puzzle selection is required.");
	}

	const renderModel = await loadRenderModel(puzzleId);
	const answerKey = await loadAnswerKey(puzzleId);
	const state = await loadState(puzzleId);
	const cellIndexes = getAffectedCellIndexes(
		renderModel,
		scope,
		anchorCellIndex,
		direction,
	);

	const updates: Record<string, unknown> = {
		updatedAt: FieldValue.serverTimestamp(),
	};

	for (const cellIndex of cellIndexes) {
		const guess = state.guesses?.[String(cellIndex)]?.value ?? "";
		const answer = answerKey[String(cellIndex)] ?? "";
		if (!answer) {
			continue;
		}

		updates[`cellAnnotations.${cellIndex}`] = {
			status: guess.toUpperCase() === answer.toUpperCase() ? "correct" : "incorrect",
			checkedAt: FieldValue.serverTimestamp(),
			checkedBy: uid,
			revealed: false,
			revealedAt: null,
			revealedBy: null,
		};
	}

	await db.doc(`puzzles/${puzzleId}/state/current`).set(updates, { merge: true });
	return { updated: cellIndexes.length };
});

export const revealSelection = onCall({ cors: true }, async (request) => {
	const uid = getAuthenticatedUid(request);
	const puzzleId = String(request.data?.puzzleId ?? "");
	const scope = String(request.data?.scope ?? "") as SelectionScope;
	const anchorCellIndex = Number(request.data?.anchorCellIndex ?? -1);
	const direction = String(request.data?.direction ?? "") as Direction;

	if (!puzzleId || Number.isNaN(anchorCellIndex)) {
		throw new HttpsError("invalid-argument", "Puzzle selection is required.");
	}

	const renderModel = await loadRenderModel(puzzleId);
	const answerKey = await loadAnswerKey(puzzleId);
	const cellIndexes = getAffectedCellIndexes(
		renderModel,
		scope,
		anchorCellIndex,
		direction,
	);

	const stateRef = db.doc(`puzzles/${puzzleId}/state/current`);
	const updates: Record<string, unknown> = {
		updatedAt: FieldValue.serverTimestamp(),
		lastEditedBy: uid,
		revision: FieldValue.increment(1),
	};

	for (const cellIndex of cellIndexes) {
		const answer = answerKey[String(cellIndex)];
		if (!answer) {
			continue;
		}

		updates[`guesses.${cellIndex}`] = {
			value: answer,
			guesserId: uid,
			updatedAt: FieldValue.serverTimestamp(),
			origin: "reveal",
		};
		updates[`cellAnnotations.${cellIndex}`] = {
			status: "correct",
			checkedAt: FieldValue.serverTimestamp(),
			checkedBy: uid,
			revealed: true,
			revealedAt: FieldValue.serverTimestamp(),
			revealedBy: uid,
		};
	}

	await stateRef.set(updates, { merge: true });

	return { updated: cellIndexes.length };
});

export const syncPuzzleCompletion = onDocumentWritten(
	"puzzles/{puzzleId}/state/current",
	async (event) => {
		const puzzleId = event.params.puzzleId as string;
		const after = event.data?.after;
		if (!after?.exists) {
			return;
		}

		const state = after.data() as {
			guesses?: Record<string, { value?: string; guesserId?: string }>;
			lastEditedBy?: string | null;
		};
		const answerKey = await loadAnswerKey(puzzleId);
		const answerEntries = Object.entries(answerKey);

		const isComplete =
			answerEntries.length > 0 &&
			answerEntries.every(([index, answer]) => {
				const currentGuess = state.guesses?.[index]?.value ?? "";
				return currentGuess.toUpperCase() === answer.toUpperCase();
			});

		await db.doc(`puzzles/${puzzleId}`).set(
			{
				lastWorkedAt: FieldValue.serverTimestamp(),
				lastEditedBy: state.lastEditedBy ?? null,
				completionState: isComplete ? "complete" : "in_progress",
				completedAt: isComplete ? FieldValue.serverTimestamp() : null,
			},
			{ merge: true },
		);
	},
);

export const healthcheck = onRequest((request, response) => {
	response.status(200).json({
		ok: true,
		timestamp: new Date().toISOString(),
		method: request.method,
	});
});
