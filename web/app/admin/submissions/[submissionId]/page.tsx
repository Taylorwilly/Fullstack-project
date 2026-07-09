"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import StatusButton from "./StatusButton";
import { useRouter } from "next/navigation";

type Props = {
    params: Promise<{ submissionId: string }>;
}
type SubmissionStatus = "submitted" | "in_review" | "approved" | "rejected";

type Submission = {
    id: string;
    workflowId: string;
    answers: SubmissionAnswer[];
    status: SubmissionStatus;
}
type SubmissionAnswer = {
    id: string,
    stepId: string,
    value: string,
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

//This function helps us to show the first letter of status in capital to the client
function formatStatus(status: SubmissionStatus) {
    if (status === "in_review") return "In Review";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function SubmissionPage({ params }: Props) {
    const router = useRouter();

    const { submissionId } = use(params);

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [sortedSteps, setSortedStep] = useState<WorkflowStep[]>([]);


    async function loadSubmission() {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const submissionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/submissions/${submissionId}`, {
                cache: "no-store",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });

            if (!submissionRes.ok) {
                const errorData = await submissionRes.json();
                setErrorMessage(errorData.message);
                return;
            }
            const submission = await submissionRes.json();

            const workflowRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${submission.workflowId}`, {
                cache: "no-store",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            })
            if (!workflowRes.ok) {
                const errorData = await workflowRes.json();
                throw new Error(errorData.message || "Failed to load the workflow");
            }

            const workflow = await workflowRes.json();

            const sortedStep = [...workflow.steps].sort((a, b) => a.order - b.order);

            setSubmission(submission);
            setWorkflow(workflow);
            setSortedStep(sortedStep);
        }
        catch (error) {
            console.error("Loading submissions failed", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Loading submissions failed");
            }
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSubmission();
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
                    Loading submission...
                </div>
            </main>
        )
    }

    if (errorMessage) {
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
                    {errorMessage}
                </div>
            </main>
        )
    }

    if (submission === null || workflow === null) {
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
                    Submission not found.
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <Link href="/admin/submissions" className="underline text-sm">
                    Back to submissions
                </Link>
                <h1 className="mt-4 text-3xl font-bold">
                    Submission Details
                </h1>
                <div className="mt-6 border rounded space-y-2 p-4">
                    <div >
                        Submission id: {submission.id}
                    </div>
                    <div>
                        Workflow: {workflow.name}
                    </div>
                    <div>
                        Workflow id: {submission.workflowId}
                    </div>
                    <div>
                        Status: {formatStatus(submission.status)}
                    </div>

                    <StatusButton
                        submissionId={submission.id}
                        currentStatus={submission.status}
                        onStatusChanged={(newStatus) => {
                            setSubmission((currentSubmission) => {
                                if (currentSubmission === null) return currentSubmission;

                                return {
                                    ...currentSubmission,
                                    status: newStatus,
                                }
                            }

                            )
                        }

                        }
                    />
                </div>

                <section className="mt-6">
                    <h2 className="font-semibold text-xl">Answers</h2>

                    <ul className="mt-4 space-y-3">
                        {
                            sortedSteps.map((step) => {
                                const answer = submission.answers.find((answer) => answer.stepId === step.id);

                                return (
                                    <li key={step.id} className="rounded border p-4">
                                        <div className="font-semibold">{step.title}</div>
                                        <div className="mt-1 text-gray-700">{answer?.value ?? "No answer provided"}</div>
                                    </li>
                                );
                            })
                        }

                    </ul>
                </section>

            </div>
        </main>
    )

}