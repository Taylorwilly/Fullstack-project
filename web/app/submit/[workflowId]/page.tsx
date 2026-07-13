"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { appPageClass, emptyStateClass, errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, formActionClass, loadingMessageClass, narrowContentWrapperClass, pageHeaderClass, pageHeadingClass, pageIntroClass, pageLabelClass, panelClass, panelTextClass, panelTitleClass, primaryActionClass, secondaryActionClass } from "@/app/components/ui";

type Step = {
    id: string;
    workflowId: string;
    title: string;
    order: number;
};

type Workflow = {
    id: string;
    name: string;
    steps: Step[];
};

export default function SubmissionDefaultPage() {
    const router = useRouter();
    const params = useParams();
    const workflowId = Array.isArray(params.workflowId)
        ? params.workflowId[0]
        : params.workflowId;

    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState("");

    async function loadWorkflow() {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to load workflow");
            }

            const data: Workflow = await response.json();
            const sortedSteps = [...data.steps].sort((a, b) => a.order - b.order);

            setWorkflow({
                ...data,
                steps: sortedSteps
            });

        }
        catch (error) {
            console.error("Fail to load workflow", error);

            if (error instanceof Error) {
                setSubmissionError(error.message);
            }
            else {
                setSubmissionError("Fail to load workflow");
            }
        }
        finally {
            setLoading(false);
        }
    }

    async function handleSubmission() {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                router.push('/login');
                return;
            }
            //Remove an old error if the client tries again
            setSubmissionError("");

            setSubmitting(true);

            if (!workflow) return;

            if (Object.keys(answers).length === 0) {
                setSubmissionError("Please answer every workflow step before submitting");
                return;
            };

            const allStepAnswered = workflow.steps.every((step) => {
                const value = answers[step.id];
                return value && value.trim() !== "";
            })
            if (!allStepAnswered) {
                setSubmissionError("Please answer every workflow step before submitting");
                return;
            };



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
                setSubmissionError(error.message);
            }
            else {
                setSubmissionError("Something went wrong while submitting your answers");
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

    if (workflow.steps.length === 0) {
        return (
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <div className={emptyStateClass}>
                        This workflow does not have steps yet
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

    const currentStep = workflow.steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === workflow.steps.length - 1;
    const progressPercentage = Math.round(((currentStepIndex + 1) / workflow.steps.length) * 100);

    function handlePrevious() {
        if (isFirstStep) return;
        setCurrentStepIndex((prev) => prev - 1);
    };
    function handleNext() {
        if (isLastStep) return;
        setCurrentStepIndex((prev) => prev + 1);
    };

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
                                Step {currentStepIndex + 1} of {workflow.steps.length}
                            </span>

                            <span>
                                {progressPercentage} % complete
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4eee8]">
                            <div
                                className="h-full rounded-full bg-[#1c5a4b]"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <p className={pageLabelClass}>
                            Current Step
                        </p>
                        <h2 className={`${panelTitleClass}`}>
                            {currentStep.title}
                        </h2>
                        <p className={`${panelTextClass} mt-2 text-lg`}>
                            Enter your answer below. You can go back to review previous steps before submitting.
                        </p>
                    </div>

                    <div className={fieldGroupClass}>
                        <label htmlFor={currentStep.id} className={fieldLabelClass}>
                            Your answer
                        </label>
                        <input
                            id={currentStep.id}
                            type="text"
                            value={answers[currentStep.id] || ""}
                            onChange={(e) =>
                                setAnswers((prev) => ({
                                    ...prev,
                                    [currentStep.id]: e.target.value,
                                }))
                            }
                            placeholder="Enter your name here"
                            className={fieldInputClass}
                        />
                    </div>
                    {submissionError && (
                        <p role="alert" className={errorMessageClass} >
                            {submissionError}
                        </p>
                    )}

                    <div className={formActionClass}>
                        <button
                            type="button"
                            onClick={handlePrevious}
                            disabled={isFirstStep}
                            className={secondaryActionClass}
                        >
                            Previous
                        </button>

                        {!isLastStep ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={isLastStep}
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
                                {submitting ? "Submitting..." : "Submit appllication"}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );

}