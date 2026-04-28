# Security Specification - SuiFren AI

## Data Invariants
- Only the owner of a SuiFren Pet (verified by their Sui wallet address) can perform life-cycle actions (feed, play, sleep).
- Pet stats must be at most 100 and non-negative.
- Chat messages are immutable once written.
- Only the owner can read the private chat history of their pet.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to update another user's pet stats.
2. **Stat Poisoning**: Set hunger to 999 or -50.
3. **Ghost Field Injection**: Add `isVerified: true` to a stats update.
4. **Timestamp Fraud**: Set `updatedAt` to a future date instead of `request.time`.
5. **Relationship Break**: Create a pet without a valid ownerId.
6. **Immutable Breach**: Attempt to change `ownerId` of a pet.
7. **Action Bypass**: Modify `level` directly without reaching the EXP threshold.
8. **Chat Impersonation**: Post a message with `role: 'model'` from a client.
9. **Spam Attack**: Send a message with 10MB of text.
10. **Orphan Write**: Write a message to a non-existent pet.
11. **PII Leak**: Access `/pets` without authentication.
12. **State Shortcutting**: Skipping energy depletion by direct stat injection of `energy: 100`.

## Test Runner Logic
Included in `firestore.rules.test.ts` (conceptual).
