import {
	collection,
	doc,
	getDoc,
	limit,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	writeBatch,
	deleteField,
	increment,
	type DocumentData,
	type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useRef, useState } from "react";

import {
	firestore,
	firebaseAuth,
	functions,
	getFirebaseConfigError,
} from "../firebase";
import type {
	CalendarStatusMap,
	CellAnnotation,
	CheckRevealScope,
	Direction,
	GuessEntry,
	PresenceState,
	PuzzleMetadata,
	PuzzleState,
	RenderModel,
	UserProfile,
} from "./firebaseTypes";

const PRESENCE_HEARTBEAT_MS = 20_000;
const ACTIVE_USER_WINDOW_MS = 3 * 60 * 1000;

type Credentials = {
	email: string;
	password: string;
	username?: string;
	color?: string;
};

function getReadableErrorMessage(
	caughtError: unknown,
	fallbackMessage: string,
) {
	if (
		caughtError &&
		typeof caughtError === "object" &&
		"message" in caughtError &&
		typeof (caughtError as { message?: unknown }).message === "string"
	) {
		const message = (caughtError as { message: string }).message.trim();
		if (message) {
			return message.replace(/^functions\/[a-z-]+:\s*/i, "").trim();
		}
	}

	return fallbackMessage;
}

function wait(ms: number) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function snapshotDate(value: unknown) {
	if (
		value &&
		typeof value === "object" &&
		"toDate" in value &&
		typeof (value as { toDate: () => Date }).toDate === "function"
	) {
		return (value as { toDate: () => Date }).toDate();
	}

	return value instanceof Date ? value : null;
}

function normalizeProfile(snapshot: QueryDocumentSnapshot<DocumentData>): UserProfile {
	const data = snapshot.data();
	return {
		id: snapshot.id,
		email: String(data.email ?? ""),
		username: String(data.username ?? ""),
		initial: String(data.initial ?? ""),
		color: String(data.color ?? "#3373D4"),
		createdAt: snapshotDate(data.createdAt),
		updatedAt: snapshotDate(data.updatedAt),
		lastSeenAt: snapshotDate(data.lastSeenAt),
	};
}

function normalizePuzzleMetadata(
	snapshot:
		| QueryDocumentSnapshot<DocumentData>
		| {
				id: string;
				data: () => DocumentData | undefined;
		  },
): PuzzleMetadata {
	const data = snapshot.data() ?? {};
	return {
		id: snapshot.id,
		publicationDate: String(data.publicationDate ?? snapshot.id),
		nytPuzzleId:
			typeof data.nytPuzzleId === "number" ? data.nytPuzzleId : null,
		title: String(data.title ?? "The Crossword"),
		constructors: Array.isArray(data.constructors)
			? data.constructors.map(String)
			: [],
		editor: data.editor ? String(data.editor) : null,
		importedAt: snapshotDate(data.importedAt),
		importedBy: data.importedBy ? String(data.importedBy) : null,
		lastWorkedAt: snapshotDate(data.lastWorkedAt),
		lastEditedBy: data.lastEditedBy ? String(data.lastEditedBy) : null,
		completionState:
			data.completionState === "complete" ? "complete" : "in_progress",
		completedAt: snapshotDate(data.completedAt),
	};
}

function normalizeRenderModel(data: DocumentData | undefined): RenderModel | null {
	if (!data) {
		return null;
	}

	return {
		title: String(data.title ?? "The Crossword"),
		dimensions: {
			height: Number(data.dimensions?.height ?? 0),
			width: Number(data.dimensions?.width ?? 0),
		},
		board: String(data.board ?? ""),
		cells: Array.isArray(data.cells)
			? data.cells.map((cell, index) => ({
					index: Number(cell.index ?? index),
					label: cell.label ? String(cell.label) : null,
					type: typeof cell.type === "number" ? cell.type : null,
					isBlock: Boolean(cell.isBlock),
					clueIds: Array.isArray(cell.clueIds)
						? cell.clueIds.map(Number)
						: [],
			  }))
			: [],
		clues: Array.isArray(data.clues)
			? data.clues.map((clue, index) => ({
					id: Number(clue.id ?? index),
					direction: clue.direction === "Down" ? "Down" : "Across",
					label: String(clue.label ?? ""),
					text: String(clue.text ?? ""),
					cellIndexes: Array.isArray(clue.cellIndexes)
						? clue.cellIndexes.map(Number)
						: [],
			  }))
			: [],
		clueLists: Array.isArray(data.clueLists)
			? data.clueLists.map((list) => ({
					name: String(list.name ?? ""),
					clues: Array.isArray(list.clues) ? list.clues.map(Number) : [],
			  }))
			: [],
		source: "nyt",
		sourceFetchedAt: snapshotDate(data.sourceFetchedAt),
	};
}

function normalizeState(data: DocumentData | undefined): PuzzleState {
	const guesses: Record<string, GuessEntry> = Object.fromEntries(
		Object.entries(data?.guesses ?? {}).map(([cellIndex, guess]) => [
			cellIndex,
			{
				value: String((guess as DocumentData)?.value ?? ""),
				guesserId: String((guess as DocumentData)?.guesserId ?? ""),
				updatedAt: snapshotDate((guess as DocumentData)?.updatedAt),
				origin:
					(guess as DocumentData)?.origin === "reveal"
						? "reveal"
						: "manual",
			},
		]),
	);

	const cellAnnotations: Record<string, CellAnnotation> = Object.fromEntries(
		Object.entries(data?.cellAnnotations ?? {}).map(([cellIndex, annotation]) => [
			cellIndex,
			{
				status:
					(annotation as DocumentData)?.status === "correct"
						? "correct"
						: "incorrect",
				checkedAt: snapshotDate((annotation as DocumentData)?.checkedAt),
				checkedBy: (annotation as DocumentData)?.checkedBy
					? String((annotation as DocumentData)?.checkedBy)
					: null,
				revealed: Boolean((annotation as DocumentData)?.revealed),
				revealedAt: snapshotDate((annotation as DocumentData)?.revealedAt),
				revealedBy: (annotation as DocumentData)?.revealedBy
					? String((annotation as DocumentData)?.revealedBy)
					: null,
			},
		]),
	);

	return {
		guesses,
		cellAnnotations,
		updatedAt: snapshotDate(data?.updatedAt),
		lastEditedBy: data?.lastEditedBy ? String(data.lastEditedBy) : null,
		revision: Number(data?.revision ?? 0),
	};
}

function normalizePresence(data: DocumentData | undefined): PresenceState {
	return {
		users: Object.fromEntries(
			Object.entries(data?.users ?? {}).map(([uid, entry]) => [
				uid,
				{
					username: String((entry as DocumentData)?.username ?? ""),
					initial: String((entry as DocumentData)?.initial ?? ""),
					color: String((entry as DocumentData)?.color ?? "#3373D4"),
					selectedCellIndex:
						typeof (entry as DocumentData)?.selectedCellIndex === "number"
							? Number((entry as DocumentData)?.selectedCellIndex)
							: null,
					selectedDirection:
						(entry as DocumentData)?.selectedDirection === "Down"
							? "Down"
							: "Across",
					lastSeenAt: snapshotDate((entry as DocumentData)?.lastSeenAt),
					isViewing: Boolean((entry as DocumentData)?.isViewing),
				},
			]),
		),
	};
}

function getMonthRange(viewDate: Date) {
	const year = viewDate.getFullYear();
	const month = viewDate.getMonth();
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0);

	return {
		start: start.toISOString().slice(0, 10),
		end: end.toISOString().slice(0, 10),
	};
}

export function useCollaborativePuzzle() {
	const [authReady, setAuthReady] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
	const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);
	const [puzzleMeta, setPuzzleMeta] = useState<PuzzleMetadata | null>(null);
	const [renderModel, setRenderModel] = useState<RenderModel | null>(null);
	const [puzzleState, setPuzzleState] = useState<PuzzleState>({
		guesses: {},
		cellAnnotations: {},
		revision: 0,
	});
	const [presence, setPresence] = useState<PresenceState>({ users: {} });
	const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(
		null,
	);
	const [selectedDirection, setSelectedDirection] =
		useState<Direction>("Across");
	const [monthViewDate, setMonthViewDate] = useState(() => new Date());
	const [monthStatuses, setMonthStatuses] = useState<CalendarStatusMap>({});
	const [error, setError] = useState<string | null>(getFirebaseConfigError());
	const [isBusy, setIsBusy] = useState(false);
	const [pendingGuessWriteCount, setPendingGuessWriteCount] = useState(0);
	const [showCongrats, setShowCongrats] = useState(false);
	const previousCompletionState = useRef<string | null>(null);

	useEffect(() => {
		if (!firebaseAuth) {
			setAuthReady(true);
			return;
		}

		return onAuthStateChanged(firebaseAuth, (nextUser) => {
			setUser(nextUser);
			setAuthReady(true);
		});
	}, []);

	useEffect(() => {
		if (!firestore || !user) {
			setProfiles({});
			return;
		}

		return onSnapshot(collection(firestore, "users"), (snapshot) => {
			const nextProfiles = Object.fromEntries(
				snapshot.docs.map((docSnapshot) => [
					docSnapshot.id,
					normalizeProfile(docSnapshot),
				]),
			);
			setProfiles(nextProfiles);
		});
	}, [user]);

	useEffect(() => {
		if (!firestore || !user) {
			setMonthStatuses({});
			return;
		}

		const range = getMonthRange(monthViewDate);
		const puzzleQuery = query(
			collection(firestore, "puzzles"),
			where("publicationDate", ">=", range.start),
			where("publicationDate", "<=", range.end),
			orderBy("publicationDate", "asc"),
		);

		return onSnapshot(puzzleQuery, (snapshot) => {
			const statuses = Object.fromEntries(
				snapshot.docs.map((docSnapshot) => {
					const metadata = normalizePuzzleMetadata(docSnapshot);
					return [
						metadata.publicationDate,
						{
							completionState: metadata.completionState,
							lastWorkedAt: metadata.lastWorkedAt,
						},
					];
				}),
			);
			setMonthStatuses(statuses);
		});
	}, [monthViewDate, user]);

	useEffect(() => {
		if (!firestore || !user) {
			setActivePuzzleId(null);
			return;
		}

		const latestPuzzleQuery = query(
			collection(firestore, "puzzles"),
			orderBy("lastWorkedAt", "desc"),
			limit(1),
		);

		return onSnapshot(latestPuzzleQuery, (snapshot) => {
			const latestPuzzle = snapshot.docs[0];
			if (!latestPuzzle) {
				setActivePuzzleId(null);
				setPuzzleMeta(null);
				setRenderModel(null);
				return;
			}

			setActivePuzzleId((current) => current ?? latestPuzzle.id);
		});
	}, [user]);

	useEffect(() => {
		if (!firestore || !activePuzzleId || !user) {
			setPuzzleMeta(null);
			setRenderModel(null);
			setPuzzleState({ guesses: {}, cellAnnotations: {}, revision: 0 });
			setPresence({ users: {} });
			return;
		}

		const unsubscribers = [
			onSnapshot(doc(firestore, "puzzles", activePuzzleId), (snapshot) => {
				if (!snapshot.exists()) {
					setPuzzleMeta(null);
					return;
				}

				const metadata = normalizePuzzleMetadata({
					id: snapshot.id,
					data: () => snapshot.data(),
				});
				setPuzzleMeta(metadata);

				if (
					previousCompletionState.current === "in_progress" &&
					metadata.completionState === "complete"
				) {
					setShowCongrats(true);
				}

				previousCompletionState.current = metadata.completionState;
			}),
			onSnapshot(
				doc(firestore, "puzzles", activePuzzleId, "content", "renderModel"),
				(snapshot) => {
					setRenderModel(normalizeRenderModel(snapshot.data()));
				},
			),
			onSnapshot(
				doc(firestore, "puzzles", activePuzzleId, "state", "current"),
				(snapshot) => {
					const normalizedState = normalizeState(snapshot.data());
					setPuzzleState(normalizedState);
				},
			),
			onSnapshot(
				doc(firestore, "puzzles", activePuzzleId, "presence", "current"),
				(snapshot) => {
					setPresence(normalizePresence(snapshot.data()));
				},
			),
		];

		return () => {
			for (const unsubscribe of unsubscribers) {
				unsubscribe();
			}
		};
	}, [activePuzzleId, user]);

	useEffect(() => {
		if (!renderModel) {
			setSelectedCellIndex(null);
			return;
		}

		const firstPlayableCell = renderModel.cells.find((cell) => !cell.isBlock);
		setSelectedCellIndex((current) =>
			current !== null ? current : firstPlayableCell?.index ?? null,
		);
	}, [renderModel]);

	const currentProfile = useMemo(() => {
		if (!user) {
			return null;
		}

		return profiles[user.uid] ?? null;
	}, [profiles, user]);

	useEffect(() => {
		if (!firestore || !user || !activePuzzleId || !currentProfile) {
			return;
		}

		const presenceRef = doc(
			firestore,
			"puzzles",
			activePuzzleId,
			"presence",
			"current",
		);

		let isUnmounted = false;

		async function syncPresence() {
			if (isUnmounted) {
				return;
			}

			await setDoc(
				presenceRef,
				{
					users: {
						[user.uid]: {
							username: currentProfile.username,
							initial: currentProfile.initial,
							color: currentProfile.color,
							selectedCellIndex,
							selectedDirection,
							lastSeenAt: serverTimestamp(),
							isViewing: true,
						},
					},
				},
				{ merge: true },
			);
		}

		void syncPresence();
		const intervalId = window.setInterval(() => {
			void syncPresence();
		}, PRESENCE_HEARTBEAT_MS);

		return () => {
			isUnmounted = true;
			window.clearInterval(intervalId);
			void setDoc(
				presenceRef,
				{
					users: {
						[user.uid]: {
							username: currentProfile.username,
							initial: currentProfile.initial,
							color: currentProfile.color,
							selectedCellIndex,
							selectedDirection,
							lastSeenAt: serverTimestamp(),
							isViewing: false,
						},
					},
				},
				{ merge: true },
			);
		};
	}, [
		activePuzzleId,
		currentProfile,
		selectedCellIndex,
		selectedDirection,
		user,
	]);

	async function signIn(credentials: Credentials) {
		if (!firebaseAuth) {
			setError(getFirebaseConfigError());
			return;
		}

		setIsBusy(true);
		setError(null);

		try {
			await signInWithEmailAndPassword(
				firebaseAuth,
				credentials.email,
				credentials.password,
			);
		} catch (caughtError) {
			console.error("Sign in failed", caughtError);
			setError(
				getReadableErrorMessage(caughtError, "Unable to sign in."),
			);
		} finally {
			setIsBusy(false);
		}
	}

	async function createAccount(credentials: Credentials) {
		if (!functions || !firebaseAuth) {
			setError(getFirebaseConfigError());
			return;
		}

		setIsBusy(true);
		setError(null);

		try {
			const createAllowedAccount = httpsCallable(functions, "createAllowedAccount");
			await createAllowedAccount({
				email: credentials.email,
				password: credentials.password,
				username: credentials.username,
				color: credentials.color,
			});
			await signInWithEmailAndPassword(
				firebaseAuth,
				credentials.email,
				credentials.password,
			);
		} catch (caughtError) {
			console.error("Create account failed", caughtError);
			setError(
				getReadableErrorMessage(caughtError, "Unable to create account."),
			);
		} finally {
			setIsBusy(false);
		}
	}

	async function openPuzzle(date: string) {
		if (!firestore || !functions || !user) {
			setError(getFirebaseConfigError());
			return;
		}

		setIsBusy(true);
		setError(null);

		try {
			const puzzleRef = doc(firestore, "puzzles", date);
			const puzzleSnapshot = await getDoc(puzzleRef);

			if (!puzzleSnapshot.exists()) {
				const ensurePuzzle = httpsCallable(functions, "ensurePuzzle");
				await ensurePuzzle({ date });
			}

			setActivePuzzleId(date);
		} catch (caughtError) {
			console.error("Open puzzle failed", caughtError);
			setError(
				getReadableErrorMessage(
					caughtError,
					"Unable to open the selected puzzle.",
				),
			);
		} finally {
			setIsBusy(false);
		}
	}

	async function updateGuess(cellIndex: number, value: string) {
		if (!firestore || !user || !activePuzzleId) {
			return;
		}

		const stateRef = doc(firestore, "puzzles", activePuzzleId, "state", "current");
		const metadataRef = doc(firestore, "puzzles", activePuzzleId);
		const batch = writeBatch(firestore);
		const guessValue = value.toUpperCase();

		setPuzzleState((current) => ({
			...current,
			guesses: {
				...current.guesses,
				[String(cellIndex)]: {
					value: guessValue,
					guesserId: user.uid,
					updatedAt: new Date(),
					origin: "manual",
				},
			},
			cellAnnotations: Object.fromEntries(
				Object.entries(current.cellAnnotations).filter(
					([entryCellIndex]) => entryCellIndex !== String(cellIndex),
				),
			),
		}));

		batch.set(
			stateRef,
			{
				guesses: {
					[cellIndex]: {
						value: guessValue,
						guesserId: user.uid,
						updatedAt: serverTimestamp(),
						origin: "manual",
					},
				},
				cellAnnotations: {
					[cellIndex]: deleteField(),
				},
				updatedAt: serverTimestamp(),
				lastEditedBy: user.uid,
				revision: increment(1),
			},
			{ merge: true },
		);
		batch.set(
			metadataRef,
			{
				lastWorkedAt: serverTimestamp(),
				lastEditedBy: user.uid,
			},
			{ merge: true },
		);
		setPendingGuessWriteCount((current) => current + 1);
		try {
			await batch.commit();
		} finally {
			setPendingGuessWriteCount((current) => Math.max(0, current - 1));
		}
	}

	async function deleteGuess(cellIndex: number) {
		await updateGuess(cellIndex, "");
	}

	async function runCheckOrReveal(
		action: "checkSelection" | "revealSelection",
		scope: CheckRevealScope,
	) {
		if (
			!functions ||
			!activePuzzleId ||
			selectedCellIndex === null ||
			!user
		) {
			if (action === "checkSelection" && scope === "puzzle") {
				console.log("[crossword check] skipped verification request", {
					activePuzzleId,
					selectedCellIndex,
					hasFunctions: Boolean(functions),
					hasUser: Boolean(user),
				});
			}
			return;
		}

		setIsBusy(true);
		setError(null);

		try {
			if (action === "checkSelection" && scope === "puzzle") {
				console.log("[crossword check] requesting backend verification", {
					puzzleId: activePuzzleId,
					selectedCellIndex,
					selectedDirection,
				});
			}

			const callable = httpsCallable(functions, action);
			const result = await callable({
				puzzleId: activePuzzleId,
				scope,
				anchorCellIndex: selectedCellIndex,
				direction: selectedDirection,
			});
			if (action === "checkSelection" && scope === "puzzle") {
				console.log("[crossword check] backend verification returned", {
					puzzleId: activePuzzleId,
					result: result.data,
				});
			}

			if (action === "checkSelection" && firestore && activePuzzleId) {
				for (let attempt = 0; attempt < 8; attempt += 1) {
					const stateSnapshot = await getDoc(
						doc(firestore, "puzzles", activePuzzleId, "state", "current"),
					);
					const normalizedState = normalizeState(stateSnapshot.data());
					const annotationCount = Object.keys(
						normalizedState.cellAnnotations,
					).length;
					if (annotationCount > 0 || attempt === 7) {
						if (annotationCount === 0) {
							console.log(
								"[crossword check] backend verification produced no annotations",
								{
									puzzleId: activePuzzleId,
									attempt,
									revision: normalizedState.revision,
								},
							);
						}
						return normalizedState;
					}

					await wait(150);
				}
			}

			return result.data;
		} catch (caughtError) {
			console.error(`${action} failed`, caughtError);
			setError(
				getReadableErrorMessage(
					caughtError,
					"Unable to update puzzle state.",
				),
			);
			return null;
		} finally {
			setIsBusy(false);
		}
	}

	async function updateProfile(input: { username: string; color: string }) {
		if (!firestore || !user) {
			return;
		}

		await updateDoc(doc(firestore, "users", user.uid), {
			username: input.username.trim(),
			initial: input.username.trim().slice(0, 1).toUpperCase(),
			color: input.color.trim(),
			updatedAt: serverTimestamp(),
			lastSeenAt: serverTimestamp(),
		});
	}

	const activeUsers = useMemo(() => {
		const now = Date.now();
		return Object.entries(presence.users)
			.filter(([, entry]) => {
				if (!entry.isViewing || !entry.lastSeenAt) {
					return false;
				}

				return now - entry.lastSeenAt.getTime() <= ACTIVE_USER_WINDOW_MS;
			})
			.map(([uid, entry]) => ({
				uid,
				...entry,
			}));
	}, [presence.users]);

	return {
		authReady,
		user,
		currentProfile,
		profiles,
		activePuzzleId,
		puzzleMeta,
		renderModel,
		puzzleState,
		presence,
		activeUsers,
		selectedCellIndex,
		selectedDirection,
		monthViewDate,
		monthStatuses,
		error,
		isBusy,
		isSavingGuesses: pendingGuessWriteCount > 0,
		showCongrats,
		setShowCongrats,
		setSelectedCellIndex,
		setSelectedDirection,
		setMonthViewDate,
		signIn,
		createAccount,
		signOut: firebaseAuth ? () => signOut(firebaseAuth) : async () => {},
		openPuzzle,
		updateGuess,
		deleteGuess,
		checkSelection: (scope: CheckRevealScope) =>
			runCheckOrReveal("checkSelection", scope),
		revealSelection: (scope: CheckRevealScope) =>
			runCheckOrReveal("revealSelection", scope),
		updateProfile,
	};
}
