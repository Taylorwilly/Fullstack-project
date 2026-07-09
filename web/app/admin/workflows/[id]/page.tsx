{ /*The Dynamic Page */ }

import { cardClass } from "@/app/components/ui";
import AddStepForm from "./AddStepForm";
import DeleteStepButton from "./DeleteStepButton";
import EditStepButton from "./EditStepButton";
import EditWorkflow from "./EditWorkFlowName";
import MoveStepButton from "./MoveStepButtons";

type Props = {
    params: Promise<{ id: string }>;
}

type WorkflowStep = {
    id: string;
    workflowId: string;
    title: string;
    order: number;
}
type Workflow = {
    id: string;
    name: string;
    steps: WorkflowStep[];
}

export default async function WorkFlowDefaultPage({ params }: Props) {
    const { id } = await params;
    {/* Fetching server for workflow/:id */ }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${id}`, { cache: "no-store" });
    if (!res.ok) {
        return (
            <section className="mx-auto max-w-4xl">
                <div className={`${cardClass} mt-6`}>
                    <h1 className="text-3xl font-bold text-slate-900">Workflow not found</h1>
                    <p className="mt-2 text-gray-600">No workflow exists for ID: {id}</p>
                </div>
            </section>
        );
    }
    const workflow: Workflow = await res.json();

    return (
        <section className="min-h-screen p-8">

            <div className="mx-auto max-w-2xl">
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

            </div>
        </section>
    )


}