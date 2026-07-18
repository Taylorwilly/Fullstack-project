-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'EMAIL', 'PHONE', 'RADIO', 'SELECT', 'CHECKBOX');

-- CreateTable
CREATE TABLE "WorkflowPage" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowField" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "placeholder" TEXT,
    "helpText" TEXT,
    "order" INTEGER NOT NULL,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowPage_workflowId_idx" ON "WorkflowPage"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowPage_workflowId_order_key" ON "WorkflowPage"("workflowId", "order");

-- CreateIndex
CREATE INDEX "WorkflowField_pageId_idx" ON "WorkflowField"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowField_pageId_order_key" ON "WorkflowField"("pageId", "order");

-- AddForeignKey
ALTER TABLE "WorkflowPage" ADD CONSTRAINT "WorkflowPage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowField" ADD CONSTRAINT "WorkflowField_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WorkflowPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
