-- CreateTable
CREATE TABLE "SubmissionActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "submissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionActivity_submissionId_idx" ON "SubmissionActivity"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionActivity_userId_idx" ON "SubmissionActivity"("userId");

-- AddForeignKey
ALTER TABLE "SubmissionActivity" ADD CONSTRAINT "SubmissionActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionActivity" ADD CONSTRAINT "SubmissionActivity_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
