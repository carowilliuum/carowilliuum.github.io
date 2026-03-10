import InvisibleString from "./InvisibleString";
import CrosswordPage from "./crossword/CrosswordPage";

export default function App() {
	const route = new URLSearchParams(window.location.search).get("route");
	const pathname = route || window.location.pathname;

	if (pathname.startsWith("/crossword")) {
		return <CrosswordPage />;
	}

	return <InvisibleString />;
}
