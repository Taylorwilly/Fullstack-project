"use client";
//This page is where the client 
// sees the application status after submission
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
    params: Promise<{ submissionId: string }>;
}
type SubmissionStatus = "submitted" | "in_review" | "approved" | "rejected";

type Submission = {
    id: string;
    workflowId: string;
    answers: submissionAnswer[];
    status: SubmissionStatus;
}

type submissionAnswer = {
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

function getStatusMessage(status: SubmissionStatus) {
    const messages: Record<SubmissionStatus, string> = {
        submitted: "Your application was received",
        in_review: "Your application is currently under review...",
        approved: "Your application has been approved",
        rejected: "Your application was rejected"
    }
    return <p>{messages[status]}</p>
}

export default function SubmissionPage({ params }: Props) {
    const router = useRouter();
    const { submissionId } = use(params);

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [sortedSteps, setSortedSteps] = useState<WorkflowStep[]>([]);

    async function loadSubmission() {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }
            const submissionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${submissionId}`, {
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
            })
            if (!workflowRes.ok) {
                const errorData = await workflowRes.json();
                throw new Error(errorData.message || "Failed to load submissions");
            }
            const workflow = await workflowRes.json();

            const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

            setSortedSteps(sortedSteps);
            setSubmission(submission);
            setWorkflow(workflow)
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
    },
        []
    );
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
                    Submission not found
                </div>
            </main>
        )
    }
    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="mt-4 text-3xl font-bold">
                    Your Application Status
                </h1>
                <div className="mt-6 border rounded space-y-2 p-4">
                    <div >
                        Application ID: {submission.id}
                    </div>
                    <div>
                        Workflow: {workflow.name}
                    </div>

                    <div className="text-green-600">
                        Current Status: {formatStatus(submission.status)}
                    </div>
                    <div className="text-green-600">
                        {getStatusMessage(submission.status)}
                    </div>
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

                    <Link
                        href={`/my_submissions`}
                        className="inline-flex items-center justify-center rounded-lg border 
                                     border-slate-300 bg-white px-3 py-2 text-sm
                                        font-medium text-slate-700 transition 
                                     hover:border-slate-400 hover:bg-slate-50"
                    >
                        Back to My Submissions
                    </Link>
                </section>
            </div>
        </main>
    )

}