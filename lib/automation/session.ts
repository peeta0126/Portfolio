import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password,salt,64).toString("hex")}`;
}
export function checkPassword(password: string, hash: string) {
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash)) return false;
  const [salt,expected] = hash.split(":");
  const actual = scryptSync(password,salt,64);
  return timingSafeEqual(actual,Buffer.from(expected,"hex"));
}
export function signSession(secret: string, passwordHash: string, expires = Date.now()+8*3600000) {
  const payload = Buffer.from(JSON.stringify({role:"admin",expires})).toString("base64url");
  return `${payload}.${createHmac("sha256",secret+passwordHash).update(payload).digest("base64url")}`;
}
export function validSession(token: string, secret: string, passwordHash: string, now = Date.now()) {
  try {
    if (secret.length<32 || !passwordHash) return false;
    const [payload,sig,...rest] = token.split(".");
    if (rest.length || !payload || !sig) return false;
    const expected = createHmac("sha256",secret+passwordHash).update(payload).digest();
    const supplied = Buffer.from(sig,"base64url");
    if (expected.length!==supplied.length || !timingSafeEqual(expected,supplied)) return false;
    const value = JSON.parse(Buffer.from(payload,"base64url").toString());
    return value.role === "admin" && Number.isFinite(value.expires) && value.expires>now && value.expires<=now+8*3600000;
  } catch { return false; }
}
export function safeEqual(left: string, right: string) {
  const a=Buffer.from(left), b=Buffer.from(right);
  return a.length===b.length && timingSafeEqual(a,b);
}
