// Shows whether you can start a run right now.   node quota.mjs
import { BASE, headers } from "./client.mjs";

const res = await fetch(`${BASE}/api/runs/quota`, { headers: headers() });
const q = await res.json();
if (!res.ok) {
  console.error(q.message || `HTTP ${res.status}`);
  process.exit(1);
}
const resets = new Date(q.resetsAt);
const state = q.budgetUsedUp
  ? "Today's shared budget is used up."
  : q.runsLeft === 0
    ? "You've used today's free run."
    : q.busy || q.budgetHeld
      ? "Another run is in progress; try again in a minute."
      : "Ready.";
console.log(`${state}  Runs left today: ${q.runsLeft ?? "unlimited (admin)"} of ${q.runsPerDay}.  Resets ${resets.toISOString()} (${resets.toLocaleString()} local).`);
