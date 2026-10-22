"use client";
// Core client flows of Quỹ Nhóm, independent of any UI. A page only wires buttons to these.
//   create  -> POST /api/payouts                         (treasurer; public title + amount)
//   seal    -> 2 enclave approvals (WRITE + READ policy) -> encrypt in browser -> POST ciphertext + commitment
//   release -> refresh token -> READ policy (needs role payout-<id>) -> decrypt via Tide -> mock bank
import { makeApiFetch, postJson, getJson, type SecureFetch } from "@/lib/treasury/apiFetch";
import { signPolicy, sealInstruction, openInstruction } from "@/lib/treasury/tideCrypto";
import { commitmentOf, newNonce, type PayoutInstruction } from "@/lib/treasury/instruction";
import { TREASURER_SUBJECT, payoutSubject } from "@/lib/treasury/policyShape";

export type PayoutStatus = "DRAFT" | "SEALED" | "RELEASED" | "REJECTED";
export interface Payout {
  id: string; title: string; amount_public: string; status: PayoutStatus; requested_by: string;
  released_by: string | null; has_sealed: boolean; policies: { subject: string; access: string }[];
}
export interface Transfer { id: number; payout_id: string; recipient: string; account: string; amount: string; executed_by: string }

type Step = (message: string) => void;

export function createTreasuryClient(secureFetch: SecureFetch | undefined, opts: { refreshToken?: () => Promise<unknown> } = {}) {
  const api = makeApiFetch(secureFetch);
  const sf = secureFetch as SecureFetch;

  return {
    list: () => getJson<{ payouts: Payout[]; transfers: Transfer[] }>(api, "/api/payouts"),

    create: (title: string, amount: number) => postJson<{ id: string }>(api, "/api/payouts", { title, amount }),

    /** Treasurer seals the bank instruction. Call from a click: it opens the enclave twice. */
    async seal(p: Pick<Payout, "id" | "amount_public">, dest: { recipient: string; account: string }, step: Step = () => {}) {
      const recordId = p.id;
      step(`${recordId}: ký policy GHI (thủ quỹ được niêm phong) — xác nhận trong popup Tide`);
      const writeB64 = await signPolicy(sf, { recordId, subject: TREASURER_SUBJECT, access: "write" });
      await postJson(api, "/api/payouts/policies", { recordId, access: "write", policyB64: writeB64 });

      step(`${recordId}: ký policy ĐỌC (chỉ người giữ role ${recordId})`);
      const readB64 = await signPolicy(sf, { recordId, subject: payoutSubject(recordId), access: "read" });
      await postJson(api, "/api/payouts/policies", { recordId, access: "read", policyB64: readB64 });

      const ins: PayoutInstruction = {
        payoutId: recordId, recipient: dest.recipient.trim(), account: dest.account.trim(),
        amount: Number(p.amount_public), nonce: newNonce(),
      };
      step(`${recordId}: mã hóa lệnh chi trong trình duyệt (mạng Tide)`);
      const sealed = await sealInstruction(writeB64, ins);
      const commitment = await commitmentOf(ins);
      await postJson(api, "/api/payouts/seal", { recordId, sealed, commitment });
      step(`${recordId}: đã niêm phong. Server chỉ giữ ciphertext + commitment.`);
    },

    /** Works ONLY if a quorum of treasurers granted realm role payout-<id> to this user via IGA. */
    async release(payoutId: string, step: Step = () => {}): Promise<PayoutInstruction> {
      await opts.refreshToken?.(); // roles committed by the quorum appear after a refresh (can lag ~120 s)
      step(`${payoutId}: xin policy ĐỌC…`);
      const { policyB64 } = await getJson<{ policyB64: string }>(api, `/api/payouts/policies?recordId=${payoutId}&access=read`);
      const { sealed } = await getJson<{ sealed: string }>(api, `/api/payouts/seal?recordId=${payoutId}`);
      step(`${payoutId}: nhờ mạng Tide giải mã…`);
      const ins = await openInstruction(payoutId, policyB64, sealed);
      step(`${payoutId}: mạng Tide cho phép giải mã — gửi lệnh tới ngân hàng`);
      await postJson(api, "/api/mock-bank", { payoutId, instruction: ins });
      return ins;
    },
  };
}
