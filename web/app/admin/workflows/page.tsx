"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { primaryActionClass } from "@/app/components/ui";
import DeleteWorkflowButton from "./DeleteWorkflowButton";

type Workflow = {
    id: string;
    name: string;
};

export default function WorkflowPage() {

    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    async function loadWorkflows() {
        try {

            setLoading(true);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows`);

            if (!response.ok) {
                throw new Error("Unable to load workflows");
            }
            const data = await response.json();
            setWorkflows(data);
            setErrorMessage("");
        }

        catch (error) {
            console.error("Failed to load workflow", error);
            setErrorMessage("We could not load workflows. Make sure the api is running");
        }
        finally {
            setLoading(false);
        }

    }
    useEffect(() => {
        loadWorkflows();
    }, []);

    return (
        <section className="mx-auto max-w-5xl">
            <header className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Workflows
                </h1>
                <p className="mt-2 max-w-2xl text-slate-600">
                    Create and manage the intake workflows that clients will complete
                </p>
            </header>

            <section className="mt-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Your workflows
                    </h2>
                    {!loading && !errorMessage &&
                        <p className="text-sm text-slate-500">
                            Total: {workflows.length}
                        </p>
                    }
                </div>

                {errorMessage ? (
                    <div
                        role="alert"
                        className="mt-4 rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
                        {errorMessage}
                    </div>
                )

                    : loading ?
                        (
                            <div className="mt-4 text-sm text-slate-600 rounded-md border border-slate-300 bg-white p-4">
                                Loading workflows...
                            </div>
                        )
                        : workflows.length === 0 ?
                            (
                                <div className="mt-4 border border-slate-300  rounded-md border-dashed bg-white px-5 py-8">
                                    <h3 className="font-semibold text-slate-900">
                                        No workflows yet
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-600 max-w-lg">
                                        Create your first workflow to begin collecting client information.
                                    </p>
                                    <Link href="/admin/workflows/new" className={`${primaryActionClass} mt-4`}>
                                        Create your first workflow
                                    </Link>
                                </div>
                            )
                            : (
                                <div className="mt-4 border border-slate-300 rounded-md bg-white overflow-hidden">
                                    <div className="flex justify-between items-center border-b border-slate-200 bg-slate-200 px-5 py-3 text-sm font-medium text-slate-600">
                                        <span>
                                            Workflows
                                        </span>
                                        <span>
                                            Actions
                                        </span>
                                    </div>

                                    <ul className=" divide-y divide-slate-200">
                                        {
                                            workflows.map(workflow => (
                                                <li
                                                    key={workflow.id}
                                                    className="flex flex-wrap justify-between items-center px-5 py-4 gap-4  hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <h3 className="text-base font-medium text-slate-900">
                                                            {workflow.name}
                                                        </h3>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Link
                                                            href={`/admin/workflows/${workflow.id}`}
                                                            className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline hover:text-slate-950"
                                                        >
                                                            Open
                                                        </Link>

                                                        <DeleteWorkflowButton
                                                            workflowId={workflow.id}
                                                            onDeleted={() =>
                                                                setWorkflows(previousWorkflows => previousWorkflows.filter(
                                                                    item => item.id !== workflow.id
                                                                ))
                                                            }
                                                        />
                                                    </div>
                                                </li>
                                            )
                                            )
                                        }
                                    </ul>
                                </div>
                            )
                }
            </section>
        </section>
    );
}
