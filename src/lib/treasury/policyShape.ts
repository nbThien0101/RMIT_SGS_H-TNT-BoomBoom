// Shared (browser + server) constants for the two policies each payout gets.
// Values fixed by the ORK contract; they must equal the ones in src/lib/tide/relationship.ts,
// which cannot be imported on the server because it pulls in the browser SDK.
export const RELATIONSHIP_CONTRACT_ID = "RelationshipAttestation:1";
export const ENCRYPT_ROLE = "_tide_encryptor";
export const DECRYPT_ROLE = "_tide_decryptor";

/** WRITE policy subject: every treasurer (client role tide-realm-admin of realm-management) may seal. */
export const TREASURER_SUBJECT = { type: "Role" as const, id: "tide-realm-admin", clientId: "realm-management" };

/** READ policy subject: only holders of realm role `payout-<id>` — granted by a quorum via IGA. */
export const payoutSubject = (payoutId: string) => ({ type: "Role" as const, id: payoutId });
