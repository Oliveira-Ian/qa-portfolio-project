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
