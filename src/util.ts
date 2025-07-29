import { randomBytes, scryptSync } from "node:crypto";
import type { ResultWithContext } from "express-validator/lib/chain/index.js";

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

export function handleValidatorError(result: ResultWithContext[]) {
    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return mappedErrors;
    }

    return null;
}