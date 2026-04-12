import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();

const allowedEmails = [
	"carolinehughes1717@gmail.com",
	"williamsharpless.2@gmail.com",
];

async function run() {
	for (const email of allowedEmails) {
		await db.doc(`invites/${email}`).set(
			{
				email,
				status: "pending",
				claimedByUid: null,
				claimedAt: null,
				createdAt: new Date(),
			},
			{ merge: true },
		);
	}
}

void run();
