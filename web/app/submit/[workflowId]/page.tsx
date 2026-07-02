"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
            const response = await fetch(`http://localhost:4000/workflows/${workflowId}`);

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

            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:4000/submissions", {
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
        return <main className="min-h-screen p-8">Workflow loading...</main>
    };

    if (!workflow) {
        return <main className="min-h-screen p-8">No workflow found</main>
    };

    if (workflow.steps.length === 0) {
        return (
            <main className="min-h-screen p-8">
                <div>
                    <Link href="/admin/workflows" className="underline text-sm">
                        Back to workflows
                    </Link>

                    <h1>
                        {workflow.name}
                    </h1>
                    <p>
                        This workflow does not have steps yet.
                    </p>
                </div>
            </main>
        );
    };

    const currentStep = workflow.steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === workflow.steps.length - 1;

    function handlePrevious() {
        if (isFirstStep) return;
        setCurrentStepIndex((prev) => prev - 1);
    };
    function handleNext() {
        if (isLastStep) return;
        setCurrentStepIndex((prev) => prev + 1);
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="font-bold mt-4 text-2xl ">
                    {workflow.name}
                </h1>
                <p className="text-gray-600 mt-2">
                    Step {currentStepIndex + 1} of {workflow.steps.length}
                </p>

                <div className="rounded border px-3 mt-3">
                    <div className="text-gray-600">Current Step</div>
                    <h2 className="font-semibold">{currentStep.title}</h2>
                    <input
                        type="text"
                        value={answers[currentStep.id] || ""}
                        onChange={(e) =>
                            setAnswers((prev) => ({
                                ...prev,
                                [currentStep.id]: e.target.value,
                            }))
                        }
                        placeholder="Enter your answer here"
                        className="rounded border px-3"
                    />
                </div>
                {
                    submissionError && (
                        <p
                            role="alert"
                            className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800"
                        >
                            {submissionError}
                        </p>
                    )
                }

                <div className="flex gap-3 mt-4">
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isFirstStep}
                        className="bg-black rounded p-2 text-white disabled:opacity-50"
                    >
                        Previous
                    </button>

                    {
                        !isLastStep ?
                            (<button
                                type="button"
                                onClick={handleNext}
                                className="bg-black text-white px-3 py-2 rounded"
                            >
                                Next
                            </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmission}
                                    disabled={submitting}
                                    className="bg-black text-white px-3 py-2 rounded disabled:opacity-50"
                                >
                                    {submitting ? "Submitting..." : "Submit"}
                                </button>
                            )
                    }
                </div>
            </div>
        </main>
    );

}