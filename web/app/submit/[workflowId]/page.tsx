"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { appPageClass, emptyStateClass, errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, formActionClass, loadingMessageClass, narrowContentWrapperClass, pageHeaderClass, pageHeadingClass, pageIntroClass, pageLabelClass, panelClass, panelTextClass, panelTitleClass, primaryActionClass, secondaryActionClass } from "@/app/components/ui";

type FieldType = "TEXT" | "TEXTAREA" | "NUMBER"
    | "DATE" | "EMAIL" | "RADIO"
    | "PHONE" | "SELECT" | "CHECKBOX";

type WorkflowField = {
    id: string;
    pageId: string;
    label: string;
    fieldType: FieldType;
    required: boolean;
    placeholder: string | null;
    helpText: string | null;
    order: number;
    options: unknown | null;
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
    pages: WorkflowPage[];
};

export default function SubmissionDefaultPage() {
    const router = useRouter();
    const params = useParams();

    const workflowId = Array.isArray(params.workflowId)
        ? params.workflowId[0]
        : params.workflowId;

    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const [answers, setAnswers] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function loadWorkflow() {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to load workflow");
            }

            const data: Workflow = await response.json();

            const sortedPages = [...data.pages]
                .sort((a, b) => a.order - b.order)
                .map((page) => ({
                    ...page,
                    fields: [...page.fields]
                        .sort((a, b) => a.order - b.order),
                }));

            setWorkflow({
                ...data,
                pages: sortedPages
            });

        }
        catch (error) {
            console.error("Fail to load workflow", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Fail to load workflow");
            }
        }
        finally {
            setLoading(false);
        }
    }

    async function handleSubmission() {
        try {
            //Remove an old error if the client tries again
            setErrorMessage("");
            setSubmitting(true);

            const token = localStorage.getItem("token");

            if (!token) {
                router.push('/login');
                return;
            }

            if (!workflow) return;

            const requiredWorkflowFields = workflow.pages.flatMap(page => page.fields).filter(field => field.required);

            const allRequiredFieldAnswered = requiredWorkflowFields.every((field) => {
                const value = answers[field.id];
                return value && value.trim() !== "";
            })

            if (!allRequiredFieldAnswered) {
                setErrorMessage("Please complete every required field before submitting");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    workflowId: workflow.id,
                    answers,
                })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to submit the answers");
            }

            const createdSubmission = await res.json();

            //After submission, we redirect the client to the application status
            router.push(`/my_submissions/${createdSubmission.newSubmission.id}`);
        }
        catch (error) {
            console.error("Failed to submit answers", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Something went wrong while submitting your answers");
            }
        }
        finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        if (workflowId) loadWorkflow();

    }, [workflowId]);

    if (loading) {
        return (
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <p className={loadingMessageClass}>
                        Loading workflow...
                    </p>
                </section>
            </main>
        )
    }

    if (!workflow) {
        return (
            <main>
                <section>
                    <div>
                        No workflow was found.
                    </div>
                    <div>
                        <Link href="/portal/start" className={secondaryActionClass}>
                            Back to workflows
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    if (workflow.pages.length === 0) {
        return (
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <div className={emptyStateClass}>
                        This workflow does not have pages yet
                    </div>
                    <div className="mt-4">
                        <Link href="/portal/start" className={secondaryActionClass}>
                            Back to workflows
                        </Link>
                    </div>
                </section>
            </main>
        );
    };
    const currentPage = workflow.pages[currentPageIndex];

    const isFirstPage = currentPageIndex === 0;
    const isLastPage = currentPageIndex === workflow.pages.length - 1;

    const pageProgress = Math.round(((currentPageIndex + 1) / workflow.pages.length) * 100);

    function handlePreviousPage() {
        if (isFirstPage) return;

        setCurrentPageIndex((prev) => prev - 1);
    }

    function handleNextPage() {
        if (isLastPage) return;

        setCurrentPageIndex((prev) => prev + 1);
    }

    return (
        <main className={appPageClass}>
            <section className={narrowContentWrapperClass}>
                <div>
                    <Link href="/portal/start" className={secondaryActionClass}>
                        Back to workflows
                    </Link>
                </div>

                <header className="mb-6 space-y-2">
                    <p className={pageLabelClass}>
                        Intake Workflow
                    </p>

                    <h1 className={pageHeadingClass}>
                        {workflow.name}
                    </h1>
                    <p className={pageIntroClass}>
                        Complete each step before submitting your application for review.
                    </p>
                </header>
                <div className={panelClass}>
                    <div className="mb-6">
                        <div className="flex items-center justify-between gap-4 text-sm text-[#66736d]">
                            <span>
                                Page {currentPageIndex + 1} of {workflow.pages.length}
                            </span>

                            <span>
                                {pageProgress} % complete
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4eee8]">
                            <div
                                className="h-full rounded-full bg-[#1c5a4b]"
                                style={{ width: `${pageProgress}%` }}
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <p className={pageLabelClass}>
                            Current Page
                        </p>
                        <h2 className={`${panelTitleClass}`}>
                            {currentPage.title}
                        </h2>
                        <p className={`${panelTextClass} mt-2 text-lg`}>
                            Enter your answers below. You can go back to review previous fields before submitting.
                        </p>
                    </div>

                    {
                        currentPage.fields.map((field) =>
                            <div key={field.id} className={fieldGroupClass}>
                                <div>
                                    <label htmlFor={field.id} className={fieldLabelClass}>
                                        {field.label}
                                    </label>
                                    <input
                                        id={field.id}
                                        type="text"
                                        value={answers[field.id] || ""}
                                        onChange={(e) =>
                                            setAnswers((prev) => ({
                                                ...prev,
                                                [field.id]: e.target.value,
                                            }))
                                        }
                                        placeholder={field.placeholder || ""}
                                        className={fieldInputClass}
                                    />

                                    {field.helpText && <p>{field.helpText}</p>}
                                </div>
                            </div>
                        )
                    }
                    {errorMessage && (
                        <p role="alert" className={errorMessageClass} >
                            {errorMessage}
                        </p>
                    )}

                    <div className={formActionClass}>
                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={isFirstPage}
                            className={secondaryActionClass}
                        >
                            Previous
                        </button>

                        {!isLastPage ? (
                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={isLastPage}
                                className={secondaryActionClass}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                onClick={handleSubmission}
                                disabled={submitting}
                                className={primaryActionClass}
                            >
                                {submitting ? "Submitting..." : "Submit application"}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );

}