-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "rapydWalletId" TEXT;

-- CreateIndex
CREATE INDEX "Account_rapydWalletId_idx" ON "Account"("rapydWalletId");
