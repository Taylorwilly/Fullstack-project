"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { primaryActionClass } from "@/app/components/ui";


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
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to load workflow");
            }
            const data = await response.json();
            setWorkflows(data);
            setErrorMessage("");
        }

        catch (error) {
            console.error("Failed to load workflow", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("We could not load workflows.");
            }
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
                    Welcome to the client workflows' page
                </h1>
            </header>
            <section className="mt-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Choose an intake form to begin or continue your application.
                    </h2>
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
                        : (
                            <div className="mt-4 border border-slate-300 rounded-md bg-white overflow-hidden">
                                <div className="flex justify-between items-center border-b border-slate-200 bg-slate-200 px-5 py-3 text-sm font-medium text-slate-600">
                                    <span>
                                        Available intake forms
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

                                                    <Link
                                                        href={`/submit/${workflow.id}`}
                                                        className={primaryActionClass}
                                                    >
                                                        Start application
                                                    </Link>
                                                </div>
                                            </li>
                                        )
                                        )
                                    }
                                </ul>
                                {
                                    errorMessage && (
                                        <p
                                            role="alert"
                                            className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800"
                                        >
                                            {errorMessage}
                                        </p>
                                    )
                                }
                            </div>

                        )
                }
            </section>
        </section>
    );
}
