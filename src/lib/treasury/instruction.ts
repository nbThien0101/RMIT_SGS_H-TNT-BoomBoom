// The payout instruction that gets sealed, and its commitment. Runs in the browser AND on the server
// (Web Crypto `crypto.subtle` exists in both), so both sides compute the same hash.
//
// Why a commitment: the browser decrypts the instruction and then sends it to the bank. Without a
// check, whoever holds the payout role could send ANY recipient/amount. At seal time the sealing
// treasurer's browser stores sha256(canonical instruction) next to the ciphertext; the bank only pays
// an instruction that hashes to it. The random nonce keeps the hash from leaking a guessable account.
// This is app-level integrity, NOT a substitute for Tide encryption (the ciphertext is still Tide's).

export interface PayoutInstruction {
  payoutId: string;
  recipient: string;
  account: string;
  amount: number;
  nonce: string;
}

/** Fixed key order, so browser and server hash identical bytes. */
export function canonicalInstruction(i: PayoutInstruction): string {
  return JSON.stringify([i.payoutId, i.recipient, i.account, i.amount, i.nonce]);
}

export async function commitmentOf(i: PayoutInstruction): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalInstruction(i)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Shape check for an instruction received from the network or a client. Returns null if invalid. */
export function parseInstruction(x: unknown): PayoutInstruction | null {
  const o = x as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  const { payoutId, recipient, account, amount, nonce } = o;
  if (typeof payoutId !== "string" || typeof recipient !== "string" || typeof account !== "string") return null;
  if (typeof amount !== "number" || !(amount > 0) || typeof nonce !== "string" || !/^[0-9a-f]{32}$/.test(nonce)) return null;
  if (!recipient.trim() || recipient.length > 80 || !account.trim() || account.length > 40) return null;
  return { payoutId, recipient, account, amount, nonce };
}

export const COMMITMENT = /^[0-9a-f]{64}$/;
