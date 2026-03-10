const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
	app.use("/api/nyt-crossword", (request, response, next) => {
		if (!process.env.NYT_CROSSWORD_COOKIE) {
			response.status(500).json({
				error:
					"NYT_CROSSWORD_COOKIE is missing. Add it to .env.development.local and restart the dev server.",
			});
			return;
		}

		next();
	});

	app.use(
		"/api/nyt-crossword",
		createProxyMiddleware({
			target: "https://www.nytimes.com",
			changeOrigin: true,
			secure: true,
			pathRewrite: {
				"^/api/nyt-crossword": "/svc/crosswords/v6/puzzle/daily",
			},
			onProxyReq(proxyReq) {
				proxyReq.removeHeader("origin");
				proxyReq.removeHeader("referer");
				proxyReq.setHeader(
					"user-agent",
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
				);

				proxyReq.setHeader("cookie", process.env.NYT_CROSSWORD_COOKIE);
			},
		})
	);
};
