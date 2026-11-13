// Minimal client for the SYNCRONIX public API. Node.js 18+ (built-in fetch), no dependencies.
import fs from "node:fs";

export const BASE = (process.env.SYNCRONIX_BASE || "https://syncronixai.xyz").replace(/\/$/, "");
const SESSION = new URL("./.syncronix-session", import.meta.url);

// Your private history is tied to an httpOnly cookie the server sets on your first run.
// This example keeps it in a local file (git-ignored) so history.mjs can list your runs.
export const loadCookie = () => {
  try {
    return fs.readFileSync(SESSION, "utf8").trim();
  } catch {
    return "";
  }
};
export const saveCookie = (setCookie) => {
  if (setCookie) fs.writeFileSync(SESSION, setCookie.split(";")[0] + "\n", { mode: 0o600 });
};
export const headers = (extra = {}) => {
  const cookie = loadCookie();
  return { ...extra, ...(cookie ? { cookie } : {}) };
};

/** Parses a Server-Sent Events response body into { event, data } objects. */
export async function* events(body) {
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) yield { event, data: JSON.parse(data) };
    }
  }
}
