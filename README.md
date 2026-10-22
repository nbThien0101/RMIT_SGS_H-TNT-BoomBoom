# Quỹ Xóm — a neighbourhood fund no one can drain alone

**UNLOCKED Hackathon · Challenge 2 · built on TideCloak**

## The possibility
A street association pools money for repairs and emergencies. Today one treasurer, one bank login, or one server admin can move it. With Quỹ Xóm, **a payout exists only when a quorum of treasurers agrees** — and that agreement is enforced by the Tide network, not by our code.

## The constraint we removed
In a normal app, "2 of 3 must approve" is an `if` statement plus a database flag. Whoever controls the server, the database or the admin account can flip the flag. Authority is concentrated in whoever runs the infrastructure — that is the trust bottleneck.

## How it works
- **Treasurers = TideCloak realm admins with IGA (Quorum-Enforced Governance) on.** With 3 treasurers, any permission change needs 2 enclave signatures.
- **Each payout instruction (recipient, account, amount) is encrypted in the browser** under Tide's built-in `RelationshipAttestation:1` contract. Only holders of role `payout-<id>` can decrypt it. The server stores ciphertext only.
- **Granting `payout-<id>` is a governed change request.** Until a second treasurer approves in their own Tide enclave, the role does not exist in anyone's token, and the network refuses decryption.
- The mock bank pays only the **sealed** amount, to a caller whose network-signed token carries that role.

## What changes
A rogue DB owner sees only ciphertext; editing it breaks decryption; forging `status=RELEASED` moves no money. A single treasurer — even one with full admin rights — cannot grant themselves the role. Authority **emerges** from the quorum instead of living in any one account.

## Honest limits
Amount thresholds are app logic; enforcing them in signing needs a custom Forseti contract, which Tide deploys on request.

**Stack:** Next.js, TideCloak (Docker), PostgreSQL. Setup: `SETUP.md`.
