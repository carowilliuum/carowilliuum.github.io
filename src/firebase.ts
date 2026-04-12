import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const config = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const isConfigured = Object.values(config).every(Boolean);

export const firebaseApp = isConfigured ? initializeApp(config) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const functions = firebaseApp ? getFunctions(firebaseApp) : null;

if (
	firebaseApp &&
	process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true" &&
	firestore &&
	firebaseAuth &&
	functions
) {
	connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
	connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099");
	connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export function getFirebaseConfigError() {
	if (isConfigured) {
		return null;
	}

	return "Firebase config is missing. Set the REACT_APP_FIREBASE_* variables before using collaborative mode.";
}
