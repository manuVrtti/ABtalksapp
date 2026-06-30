-- CreateEnum
CREATE TYPE "RecommendationLevel" AS ENUM ('STRONGLY_RECOMMEND', 'RECOMMEND', 'NEUTRAL', 'DO_NOT_RECOMMEND');

-- AlterTable
ALTER TABLE "RecruiterReview" DROP COLUMN "confidenceRating",
DROP COLUMN "codingRating",
DROP COLUMN "communicationRating",
DROP COLUMN "recommendedRoles",
DROP COLUMN "certifications",
ADD COLUMN "targetRole" TEXT,
ADD COLUMN "skillGroups" JSONB,
ADD COLUMN "certifications" JSONB,
ADD COLUMN "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "experience" JSONB,
ADD COLUMN "communicationScore" INTEGER,
ADD COLUMN "programmingScore" INTEGER,
ADD COLUMN "behaviorScore" INTEGER,
ADD COLUMN "communicationFeedback" TEXT,
ADD COLUMN "programmingFeedback" TEXT,
ADD COLUMN "behaviorFeedback" TEXT,
ADD COLUMN "codingChallenges" JSONB,
ADD COLUMN "areasForGrowth" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "recommendation" "RecommendationLevel",
ADD COLUMN "assessmentDate" TIMESTAMP(3),
ADD COLUMN "interviewerName" TEXT,
ADD COLUMN "challengeRound" TEXT,
ADD COLUMN "abtalksId" TEXT,
ADD COLUMN "logistics" JSONB,
ADD COLUMN "compensation" JSONB;
