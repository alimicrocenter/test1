# Security Specification: Car Cave (Garage Manager)

## 1. Data Invariants
- A **Vehicle** must have an `ownerId`. Only the owner or a manager/admin can create/update.
- **Service Records** and **Fuel Logs** belong to a vehicle and its owner.
- **Documents** (PII) are strictly restricted to the owner.
- Users cannot change their own `role` from 'OWNER' to 'ADMIN'.

## 2. The "Dirty Dozen" Payloads (Denial Expected)

### Identity Spoofing
1. **Ghost Vehicle**: Create a vehicle with `ownerId` set to another user's UID.
2. **Role Escalation**: Update own user profile to set `role: 'ADMIN'`.

### Integrity Violations
3. **Price Poisoning**: Log fuel with a negative `totalCost`.
4. **Mileage Warp**: Update vehicle mileage to a value lower than its current mileage (Note: implemented via application logic, but rules should ideally guard if possible).
5. **PII Scraping**: Attempt to list all documents in `/documents` without an `ownerId` filter.

### State & Resource Exhaustion
6. **ID Poisoning**: Create a vehicle with a 1MB string as its ID.
7. **Shadow Fields**: Create a service record with an extra `isVerifiedBySpecialist: true` field.
8. **Orphaned Record**: Create a service record for a `vehicleId` that does not exist.

### Relational & Privacy
9. **Document Peek**: As User B, attempt to `get` a document belonging to User A.
10. **Service Hijack**: Create a service record for someone else's vehicle.
11. **Blanket Read**: Query all vehicles without specifying an `ownerId`.
12. **Timestamp Fraud**: Set `createdAt` to a manual date in the past instead of server time.

## 3. Test Runner (Mock Logic)
The `firestore.rules` are verified using the following assertions:
- `allow list` MUST have `resource.data.ownerId == request.auth.uid`.
- `isValid[Entity]` enforces types and constraints.
- `isAdmin()` and `isTechnician()` require server-side doc check.
