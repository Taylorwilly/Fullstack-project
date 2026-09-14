/*
  Warnings:

  - You are about to drop the column `stepId` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - Added the required column `fieldId` to the `SubmissionAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SubmissionAnswer" DROP CONSTRAINT "SubmissionAnswer_stepId_fkey";

-- AlterTable
ALTER TABLE "SubmissionAnswer" DROP COLUMN "stepId",
ADD COLUMN     "fieldId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "WorkflowField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
