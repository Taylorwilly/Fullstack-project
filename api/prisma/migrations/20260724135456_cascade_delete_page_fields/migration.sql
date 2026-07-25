-- DropForeignKey
ALTER TABLE "WorkflowField" DROP CONSTRAINT "WorkflowField_pageId_fkey";

-- AddForeignKey
ALTER TABLE "WorkflowField" ADD CONSTRAINT "WorkflowField_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WorkflowPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
