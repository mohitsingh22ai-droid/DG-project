import fs from "fs";
import path from "path";
import os from "os";

/**
 * Resolves the on-disk location of a small local file. All application data lives
 * in Supabase; the only remaining user is the email provider's test-mode capture
 * file (emails recorded instead of sent when EMAIL_PROVIDER=test).
 *
 * Files go in a git-ignored directory (default `.data/`); tests point
 * `W2P_DATA_DIR` at their own directory to stay isolated. On read-only hosts
 * (Vercel) the OS temp directory is used instead.
 *
 * Stores import this module by relative path (not "@/lib/...") so Playwright specs
 * that load a store dynamically can still resolve it.
 */
export function dataFile(fileName: string): string {
  const dir = process.env.W2P_DATA_DIR
    ? path.resolve(process.env.W2P_DATA_DIR)
    : path.join(process.cwd(), ".data");

  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Read-only filesystem (e.g. serverless): fall back to the OS temp directory.
    return path.join(os.tmpdir(), fileName);
  }

  return path.join(dir, fileName);
}
