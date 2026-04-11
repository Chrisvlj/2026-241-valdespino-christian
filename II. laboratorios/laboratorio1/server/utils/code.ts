const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeVoterName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function generatePollCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function isDuplicateKey(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000);
}
