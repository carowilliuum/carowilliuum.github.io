#!/usr/bin/env node

const { spawn } = require("child_process");

const targetUrl = process.argv[2]
	? process.argv[2].replace(/\/$/, "") + "/crossword/"
	: "http://localhost:3000/crossword/";

const platform = process.platform;

if (platform === "darwin") {
	spawn("open", [targetUrl], { stdio: "ignore", detached: true }).unref();
	process.exit(0);
}

if (platform === "win32") {
	spawn("cmd", ["/c", "start", "", targetUrl], {
		stdio: "ignore",
		detached: true,
	}).unref();
	process.exit(0);
}

spawn("xdg-open", [targetUrl], { stdio: "ignore", detached: true }).unref();
