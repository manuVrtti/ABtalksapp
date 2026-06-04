-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "synergyPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "youtubeUrl" TEXT,
ALTER COLUMN "linkedinUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SynergyEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "submissionId" TEXT,
    "enrollmentId" TEXT,
    "dayNumber" INTEGER,
    "rankAtAward" INTEGER,
    "reason" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SynergyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SynergyEvent_submissionId_key" ON "SynergyEvent"("submissionId");

-- CreateIndex
CREATE INDEX "SynergyEvent_userId_idx" ON "SynergyEvent"("userId");

-- CreateIndex
CREATE INDEX "SynergyEvent_createdAt_idx" ON "SynergyEvent"("createdAt");

-- CreateIndex
CREATE INDEX "StudentProfile_synergyPoints_idx" ON "StudentProfile"("synergyPoints" DESC);

-- AddForeignKey
ALTER TABLE "SynergyEvent" ADD CONSTRAINT "SynergyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynergyEvent" ADD CONSTRAINT "SynergyEvent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
