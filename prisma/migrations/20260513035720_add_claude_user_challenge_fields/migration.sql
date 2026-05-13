-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "startsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "organization" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "yearsExperience" INTEGER,
ALTER COLUMN "college" DROP NOT NULL,
ALTER COLUMN "graduationYear" DROP NOT NULL;
