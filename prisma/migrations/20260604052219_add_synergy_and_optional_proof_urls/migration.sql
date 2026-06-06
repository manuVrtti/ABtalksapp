/*
  Warnings:

  - You are about to drop the column `youtubeUrl` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "youtubeUrl",
ALTER COLUMN "githubUrl" DROP NOT NULL;
