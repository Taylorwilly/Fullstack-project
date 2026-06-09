import Link from "next/link";

type Props = {
    params : Promise<{submissionId: String}>;
}

type Submission = {
    id: string;
    workflowId: string;
    answers: Record<string, string>;
    status: string;
}

export default async function SubmissionPage({params}: Props){
    const {submissionId} = await params;

    const res = await fetch(`http://localhost:4000/submissions/${submissionId}`, {
        cache: "no-store",
    });

    if(!res.ok){
        return (
            <main className="min-h-screen p-8">
                <div className="mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold">Submission not found</h1>
                    <p className="mt-2 text-gray-600">No submission exists for ID: {submissionId}</p>
                </div>
            </main>
        );
    }
    const submission: Submission = await res.json()

    return (
        <main>
            <li>
                <div>
                    Submission id: {submission.id}
                </div>
                <div>
                    Workflow id: {submission.workflowId}
                </div>
                <div>
                    Status: {submission.status}
                </div>
                <div>
                    Answers: {Object.entries(submission.answers)}
                </div>
            </li>

        </main>
    )

}