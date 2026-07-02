//This page is where the client 
// sees the application status after submission

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
                    <h1 className="text-3xl font-bold">Submission not found</h1>
                    <p className="mt-2 text-gray-600">No submission exists for ID: {submissionId}</p>
                </div>
            </main>
        );
    }
    const submission: Submission = await submissionRes.json();

    const workflowRes = await fetch(`http://localhost:4000/workflows/${submission.workflowId}`, {
        cache: "no-store",
    })
    if (!workflowRes.ok) {
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
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
                </section>
            </div>
        </main>
    )

}