-- Add Recipient.accountLast4 to support masked account display without storing plaintext account numbers.

ALTER TABLE "Recipient" ADD COLUMN "accountLast4" TEXT;

-- Best-effort backfill from historical plaintext accountNumber (if present).
UPDATE "Recipient"
SET "accountLast4" = RIGHT("accountNumber", 4)
WHERE "accountLast4" IS NULL
  AND "accountNumber" IS NOT NULL
  AND LENGTH("accountNumber") >= 4;

