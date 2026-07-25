{ /*The Dynamic Page */ }

import { appPageClass, emptyStateClass, listPanelClass, listRowActionClass, listRowClass, listRowMetaClass, narrowContentWrapperClass, pageLabelClass, panelClass, sectionClass, sectionHeaderClass, sectionTextClass } from "@/app/components/ui";
import AddStepForm from "./AddStepForm";
import DeleteStepButton from "./DeleteStepButton";
import EditStepButton from "./EditStepButton";
import EditWorkflow from "./EditWorkFlowName";
import MoveStepButton from "./MoveStepButtons";
import AddPageForm from "./AddPageForm";
import AddFieldForm from "./AddFieldForm";
import EditPageTitle from "./EditPageTitle";
import DeletePageButton from "./DeletePageButton";
import DeleteFieldButton from "./DeleteFieldButton";
import EditFieldForm from "./EditFieldForm";

type Props = {
    params: Promise<{ id: string }>;
}

type WorkflowStep = {
    id: string;
    workflowId: string;
    title: string;
    order: number;
}
type WorkflowField = {
    id: string;
    pageId: string;
    label: string;
    order: number;
}
type WorkflowPage = {
    id: string;
    workflowId: string;
    title: string;
    order: number;
    fields: WorkflowField[];
}
type Workflow = {
    id: string;
    name: string;
    steps: WorkflowStep[];
    pages: WorkflowPage[];
}

export default async function WorkFlowDefaultPage({ params }: Props) {
    const { id } = await params;
    {/* Fetching server for workflow/:id */ }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${id}`, { cache: "no-store" });
    if (!res.ok) {
        return (
            <section className="mx-auto max-w-4xl">
                <div className={`${panelClass} mt-6`}>
                    <h1 className="text-3xl font-bold text-slate-900">Workflow not found</h1>
                    <p className="mt-2 text-gray-600">No workflow exists for ID: {id}</p>
                </div>
            </section>
        );
    }
    const workflow: Workflow = await res.json();

    return (
        <section className={appPageClass}>
            <div className={narrowContentWrapperClass}>
                <h1 className="text-3xl font-bold">Workflow Detail</h1>
                <p className="mt-2 font-bold text-gray-600">This page shows the workflow and its steps.</p>
                <div className="mt-6 rounded border p-4">
                    <p className="text-sm text-gray-500">Workflow ID</p>
                    <p className="mt-1 font-medium">{workflow.id}</p>
                </div>
                <div className="rounded border mt-6 p-4">
                    <p className="text-sm text-gray-500">Workflow Name</p>
                    <EditWorkflow workflowId={workflow.id} currentName={workflow.name} />
                </div>

                <div className="mt-6">
                    <h2 className="text-xl font-semibold">Steps</h2>
                    {workflow.steps.length === 0 ? (
                        <p className="mt-3 text-gray-600">No steps yet</p>
                    ) : (
                        <ul className="mt-4 space-y-3">

                            {workflow.steps.map((step, index) => (
                                <li key={step.id} className="rounded border p-4">
                                    <div className="text-sm text-gray-500">
                                        Step {step.order}
                                    </div>
                                    <div className="font-medium text-sm">{step.title}</div>

                                    <div className="flex gap-3">
                                        <MoveStepButton
                                            workflowId={workflow.id}
                                            stepId={step.id}
                                            isFirst={index === 0}
                                            isLast={index === workflow.steps.length - 1}
                                        />
                                        <EditStepButton
                                            workflowId={step.workflowId}
                                            stepId={step.id}
                                            currentTitle={step.title}
                                        />
                                        <DeleteStepButton
                                            workflowId={workflow.id}
                                            stepId={step.id}
                                        />

                                    </div>
                                </li>
                            ))}

                        </ul>
                    )
                    }
                </div>

                <AddStepForm workflowId={workflow.id} />

                <section className={sectionClass}>
                    <div className={sectionHeaderClass}>
                        <p className={pageLabelClass}>Form Builder</p>
                        <h2 className={sectionHeaderClass}>
                            Pages and fields
                        </h2>
                        <p className={sectionTextClass}>
                            Organize this workflow into pages and define the information the client will provide.
                        </p>
                    </div>

                    <div className={`${panelClass} mb-6`}>
                        <AddPageForm workflowId={workflow.id} />
                    </div>
                    {
                        workflow.pages.length === 0 ? (
                            <div className={`${emptyStateClass} p-6 text-center`}>
                                <p className={sectionTextClass}>
                                    No pages have been added to this workflow yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {
                                    workflow.pages.map((page) => {
                                        return (
                                            <article key={page.id} className={panelClass}>
                                                <div className="flex flex-col gap-4 border-b border-[#d8ded7] pb-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <p className={pageLabelClass}>
                                                            Page {page.order}
                                                        </p>

                                                        <div className="mt-2">
                                                            <EditPageTitle
                                                                workflowId={workflow.id}
                                                                pageId={page.id}
                                                                currentTitle={page.title}
                                                            />
                                                        </div>
                                                    </div>

                                                    <DeletePageButton
                                                        workflowId={workflow.id}
                                                        pageId={page.id}
                                                        pageTitle={page.title}
                                                    />
                                                </div>

                                                <div className="mt-5">
                                                    <div className={sectionHeaderClass}>
                                                        <h3 className="text-base font-semibold text-[#24332e]">
                                                            Fields
                                                        </h3>

                                                        <p className={sectionTextClass}>
                                                            Fields appear in this order when then client completes the page.
                                                        </p>
                                                    </div>
                                                    {
                                                        page.fields.length === 0 ? (
                                                            <div className={`${emptyStateClass} p-4`}>
                                                                <p className={sectionTextClass}>
                                                                    No fields have been added to this page.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className={listPanelClass}>
                                                                {
                                                                    page.fields.map((field) => {
                                                                        return (
                                                                            <div key={field.id} className={listRowClass}>
                                                                                <div className="min-w-0">
                                                                                    <p className={listRowMetaClass}>
                                                                                        Field {field.order}
                                                                                    </p>

                                                                                    <EditFieldForm
                                                                                        workflowId={workflow.id}
                                                                                        pageId={page.id}
                                                                                        fieldId={field.id}
                                                                                        currentLabel={field.label}
                                                                                    />
                                                                                </div>
                                                                                <div className={listRowActionClass}>
                                                                                    <DeleteFieldButton
                                                                                        workflowId={workflow.id}
                                                                                        pageId={page.id}
                                                                                        fieldId={field.id}
                                                                                        fieldLabel={field.label}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        )}
                                                </div>

                                                <div className="mt-5 border-t border-[#d8ded7] pt-5">
                                                    <AddFieldForm
                                                        workflowId={workflow.id}
                                                        pageId={page.id}
                                                    />
                                                </div>
                                            </article>
                                        );
                                    })}
                            </div>
                        )}
                </section>
            </div>
        </section>
    )


}