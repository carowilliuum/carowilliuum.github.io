import { useEffect, useState } from "react";

import type { NYTPuzzle, NYTPuzzleResponse } from "./nyt";

type UseNYTPuzzleResult = {
	data: NYTPuzzle | null;
	isLoading: boolean;
	error: string | null;
};

const DEFAULT_API_BASE =
	process.env.NODE_ENV === "development"
		? "/api/nyt-crossword"
		: "https://www.nytimes.com/svc/crosswords/v6/puzzle/daily";

function normalizePuzzle(response: NYTPuzzleResponse): NYTPuzzle {
	return {
		...response,
		puzzle: response.body[0],
	};
}

function getCookieErrorMessage() {
	return "NYT crossword auth failed. Check `NYT_CROSSWORD_COOKIE` in `.env.development.local` and restart the dev server.";
}

export function useNYTPuzzle(date: string): UseNYTPuzzleResult {
	const [data, setData] = useState<NYTPuzzle | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		const apiBase =
			process.env.REACT_APP_NYT_CROSSWORD_API_BASE ?? DEFAULT_API_BASE;

		async function loadPuzzle() {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(`${apiBase}/${date}.json`, {
					signal: controller.signal,
					credentials: "include",
					headers: {
						Cookie: "NYT-S=0^CB8SNgiKlPzLBhC_3sDNBhoSMS0JvzQXwLQXj2unySsaQeZDIL7fyFAqAh53OMn6sIcGQgUImeDeBxpAOnk-jWTeWclBFlWTz1db6jDfChvafraeW7YTxk8tb7uLdcU_P3g9opmVpC1yVgKQMBsyS3vsJUaJc3CH6jd0DQ==",
					},
				});
				const contentType = response.headers.get("content-type") ?? "";
				const responseText = await response.text();

				if (!response.ok) {
					if (response.status === 403) {
						throw new Error(getCookieErrorMessage());
					}

					if (contentType.includes("application/json")) {
						try {
							const jsonError = JSON.parse(responseText) as {
								error?: string;
							};
							throw new Error(
								jsonError.error ??
									`Request failed with status ${response.status}`,
							);
						} catch {
							throw new Error(
								`Request failed with status ${response.status}`,
							);
						}
					}

					throw new Error(
						`Request failed with status ${response.status}`,
					);
				}

				if (!contentType.includes("application/json")) {
					if (
						responseText.startsWith("<!DOCTYPE") ||
						responseText.startsWith("<html")
					) {
						throw new Error(getCookieErrorMessage());
					}

					throw new Error("NYT crossword response was not JSON");
				}

				const json = JSON.parse(responseText) as NYTPuzzleResponse;

				if (!json.body?.[0]) {
					throw new Error(
						"Puzzle payload did not include a puzzle body",
					);
				}

				setData(normalizePuzzle(json));
			} catch (caughtError) {
				if ((caughtError as DOMException).name === "AbortError") {
					return;
				}

				const message =
					caughtError instanceof Error
						? caughtError.message
						: "Unable to load crossword puzzle";
				setError(message);
				setData(null);
			} finally {
				setIsLoading(false);
			}
		}

		void loadPuzzle();

		return () => {
			controller.abort();
		};
	}, [date]);

	return { data, isLoading, error };
}
