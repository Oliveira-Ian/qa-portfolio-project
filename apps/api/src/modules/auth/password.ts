import bcrypt from 'bcryptjs';

/**
 * `bcryptjs` (pure JS) rather than `bcrypt` (native): this repo is developed on
 * Windows and built inside Alpine containers, and a native addon needs a
 * toolchain in both. The cost difference is irrelevant at this scale.
 */
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * A real bcrypt hash (10 rounds, same as `hashPassword`) with no matching
 * plaintext — `auth.service.ts#login` compares against this when the e-mail
 * doesn't match an account, so "unknown e-mail" costs the same one
 * `bcrypt.compare()` as "wrong password" instead of returning early and
 * finishing measurably faster. A malformed placeholder wouldn't do this:
 * `bcrypt.compare()` against a string that isn't a well-formed hash can
 * short-circuit before doing the actual comparison work.
 */
export const DUMMY_PASSWORD_HASH = '$2b$10$kcbCUa/94v9S9Ehxgv2gGeM2Zeoxf4XNKlqn4xJqm.spz7yVx8XsS';

/**
 * Returns false rather than throwing when the stored value isn't a bcrypt hash
 * — rows created before hashing existed hold plaintext, and those users simply
 * can't sign in until they register again.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
