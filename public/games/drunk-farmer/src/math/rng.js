// Drunk Farmer — provably fair RNG.
//
// All randomness is derived from a SHA-256 hash of (serverSeed, clientSeed, nonce).
// The server commits to a server seed up front (by publishing its hash); the
// player supplies a client seed. After play the server seed is revealed so the
// player can recompute every outcome and confirm it was not altered.
//
// Depends only on the Web Crypto API (window.crypto / crypto.subtle).

/**
 * Resolve the platform crypto object (browser `window.crypto`, worker `self.crypto`,
 * or a global `crypto`). Throws if none is available.
 * @returns {Crypto}
 */
function getCrypto() {
  const c =
    (typeof globalThis !== 'undefined' && globalThis.crypto) ||
    (typeof window !== 'undefined' && window.crypto) ||
    (typeof self !== 'undefined' && self.crypto);
  if (!c || !c.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
  }
  return c;
}

/**
 * Convert a byte array to a lowercase hex string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Generate a cryptographically random hex string for use as a server seed.
 * @param {number} [byteLength=32] - Number of random bytes (32 → 64 hex chars).
 * @returns {string} Lowercase hex string.
 */
export function generateServerSeed(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Generate a cryptographically random hex string for use as a client seed.
 * @param {number} [byteLength=16] - Number of random bytes (16 → 32 hex chars).
 * @returns {string} Lowercase hex string.
 */
export function generateClientSeed(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Hash the seed triple into a SHA-256 hex digest. This digest is the single
 * source of all randomness for the round/nonce.
 * @param {string} serverSeed
 * @param {string} clientSeed
 * @param {number|string} nonce - Per-bet counter ensuring each bet differs.
 * @returns {Promise<string>} Lowercase 64-char hex digest.
 */
export async function hashSeeds(serverSeed, clientSeed, nonce) {
  const message = `${serverSeed}:${clientSeed}:${nonce}`;
  const data = new TextEncoder().encode(message);
  const digest = await getCrypto().subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

/**
 * Derive a float in [0, 1) from a hex hash, reading 8 hex chars (4 bytes) at the
 * given index. Each index yields an independent value, so one hash provides many
 * draws (index 0, 1, 2, ...).
 * @param {string} hash - Hex digest from hashSeeds().
 * @param {number} [index=0] - Which 4-byte window of the hash to read.
 * @returns {number} Float in [0, 1).
 */
export function seedToFloat(hash, index = 0) {
  const start = (index * 8) % hash.length;
  const slice = hash.slice(start, start + 8).padEnd(8, '0');
  const intVal = parseInt(slice, 16);
  return intVal / 0x100000000; // divide by 2^32 → [0, 1)
}

/**
 * Derive an integer in [min, max] (both inclusive) from a hex hash at the given
 * index, using seedToFloat for the underlying uniform draw.
 * @param {string} hash - Hex digest from hashSeeds().
 * @param {number} index - Which 4-byte window of the hash to read.
 * @param {number} min - Inclusive lower bound.
 * @param {number} max - Inclusive upper bound.
 * @returns {number} Integer in [min, max].
 */
export function seedToInt(hash, index, min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (hi < lo) {
    throw new Error(`seedToInt: empty range (min=${min}, max=${max}).`);
  }
  const span = hi - lo + 1;
  return lo + Math.floor(seedToFloat(hash, index) * span);
}

/**
 * Verify that a seed triple reproduces an expected hash. Used by players to
 * confirm a revealed server seed matches the prior commitment.
 * @param {string} serverSeed
 * @param {string} clientSeed
 * @param {number|string} nonce
 * @param {string} expectedHash - The hash to check against.
 * @returns {Promise<boolean>} True if the recomputed hash matches.
 */
export async function verify(serverSeed, clientSeed, nonce, expectedHash) {
  const actual = await hashSeeds(serverSeed, clientSeed, nonce);
  return actual === String(expectedHash).toLowerCase();
}
