import { randomBytes, scryptSync } from "node:crypto";

export function hashSecret(password: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(password.normalize(), salt, 64);

    return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function compareSecret(
  password: string,
  hashedSecret: string,
): boolean {
    const [salt, hash] = hashedSecret.split(":");
    const derivedHash = scryptSync(password.normalize(), Buffer.from(salt, "hex"), 64);

    return derivedHash.toString("hex") === hash;
}

export function generateToken() {
    return Buffer.from(randomBytes(64))
                 .toString("hex");
}