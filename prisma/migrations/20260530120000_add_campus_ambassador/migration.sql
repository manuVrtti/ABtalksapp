-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "isCampusAmbassadorCandidate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ambassadorAppliedAt" TIMESTAMP(3),
ADD COLUMN     "ambassadorDismissedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "StudentProfile_isCampusAmbassadorCandidate_idx" ON "StudentProfile"("isCampusAmbassadorCandidate");
