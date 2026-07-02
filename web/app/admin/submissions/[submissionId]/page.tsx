import Link from "next/link";
import StatusButton from "./StatusButton";

type Props = {
    params: Promise<{ submissionId: String }>;
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

export default async function SubmissionPage({ params }: Props) {
    const { submissionId } = await params;

    const token = localStorage.getItem("token");

    const submissionRes = await fetch(`http://localhost:4000/submissions/${submissionId}`, {
        cache: "no-store",
        headers: {
            "Authorization": `Bearer ${token}`
        },
    });

    if (!submissionRes.ok) {
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
                    <Link href="/admin/submissions" className="underline text-sm">
                        Back to submissions
                    </Link>
                    <h1 className="text-3xl font-bold">Submission not found</h1>
                    <p className="mt-2 text-gray-600">No submission exists for ID: {submissionId}</p>
                </div>
            </main>
        );
    }
    const submission: Submission = await submissionRes.json();

    const workflowRes = await fetch(`http://localhost:4000/workflows/${submission.workflowId}`, {
        cache: "no-store",
        headers: {
            "Authorization": `Bearer ${token}`
        },
    })
    if (!workflowRes.ok) {
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
                    <Link href="/admin/submissions" className="underline text-sm">
                        Back to submissions
                    </Link>
                    <h1 className="text-3xl font-bold">Workflow not found</h1>
                    <p className="mt-2 text-gray-600">The workflow could not be loaded</p>
                </div>
            </main>
        );
    }
    const workflow: Workflow = await workflowRes.json();

    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

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

                    <StatusButton submissionId={submission.id} currentStatus={submission.status} />
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