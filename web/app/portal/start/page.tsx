"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { appPageClass, contentWrapperClass, emptyStateClass, errorMessageClass, listPanelClass, listRowActionClass, listRowClass, listRowContentClass, listRowMetaClass, listRowTitleClass, loadingMessageClass, pageHeaderClass, pageHeaderTextClass, pageHeadingClass, pageIntroClass, pageLabelClass, primaryActionClass, secondaryActionClass } from "@/app/components/ui";


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
        <main className={appPageClass}>
            <section className={contentWrapperClass}>
                <header className={pageHeaderClass}>
                    <div className={pageHeaderTextClass}>
                        <p className={pageLabelClass}>
                            Client Portal
                        </p>
                        <h1 className={pageHeadingClass}>
                            Start an intake workflow
                        </h1>
                        <p className={pageIntroClass}>
                            Choose an available intake workflow, complete the form, and submit your information for review.
                        </p>
                    </div>
                    <Link href="/my_submissions" className={secondaryActionClass}>
                        View my submissions
                    </Link>
                </header>

                {
                    errorMessage ? (
                        <p className={errorMessageClass}>
                            {errorMessage}
                        </p>
                    ) : loading ? (
                        <p className={loadingMessageClass}>
                            Loading workflows...
                        </p>
                    ) : workflows.length === 0 ? (
                        <div className={emptyStateClass}>
                            No intake workflows are available right now.
                        </div>
                    ) : (
                        <div className={listPanelClass}>
                            {workflows.map((workflow) => (
                                <div key={workflow.id} className={listRowClass}>
                                    <div className={listRowContentClass}>
                                        <h2 className={listRowTitleClass}>
                                            {workflow.name}
                                        </h2>
                                        <p className={listRowMetaClass}>
                                            Complete this workflow to submit your intake information.
                                        </p>
                                    </div>

                                    <div className={listRowActionClass}>
                                        <Link
                                            href={`/submit/${workflow.id}`}
                                            className={primaryActionClass}
                                        >
                                            Start application
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </section>
        </main>
    );
}
