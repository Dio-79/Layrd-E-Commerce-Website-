// npm run make-admin -- someone@example.com [role]
// Gives an EXISTING account (sign up on the site first) a role in the real
// project. Role defaults to "admin"; also accepts customer, wholesale, user.
import { auth, db, projectId } from "./real-firebase.mjs";

const [email, role = "admin"] = process.argv.slice(2);
const ROLES = ["user", "customer", "wholesale", "admin"];
if (!email || !ROLES.includes(role)) {
  console.error(`Usage: npm run make-admin -- <email> [${ROLES.join("|")}]`);
  process.exit(1);
}

const user = await auth.getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No account for ${email} in ${projectId}. Sign up on the site first.`);
  process.exit(1);
}
await db.collection("users").doc(user.uid).set({ email, role }, { merge: true });
console.log(`${email} is now "${role}" in ${projectId}. Log out and back in to see it.`);
