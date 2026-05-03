# Security Spec

## Data Invariants
1. A user profile must only be created or updated by the authenticated user whose `uid` matches the `userId` in the document.
2. Incomes, Expenses, Loans, Assets, Subscriptions, Holdings, Goals, and Insights MUST only belong to the authenticated user.
3. Every document must contain fields exactly matching the blueprint schemas (No ghost fields).
4. `userId` cannot be modified (Immutable).
5. All references to user must match the `request.auth.uid`.

## Disallowed Payloads (Dirty Dozen)
1. Creating profile for another user.
2. Updating another user's profile.
3. Updating profile with a missing required field (e.g. removing `updatedAt`).
4. Omitting the `userId` field.
5. Setting an invalid type (e.g., `age` to a string).
6. Recursive/infinite string inputs (e.g., extremely long strings that break bounds).
7. Missing `createdAt` or `updatedAt` server timestamps on create/update.
8. Trying to change `createdAt` on an update.
9. Injecting a ghost field like `isAdmin: true`.
10. Querying a list of users without specifying `userId == request.auth.uid`.
11. Reading another user's private subcollections (PII leakage).
12. Attempting to bypass limits with deep arrays (though we use subcollections instead of arrays here).
