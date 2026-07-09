"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Submission = {
    id: string;
    workflowId: string;
    answers: SubmissionAnswer[];
    status: string;
}

type SubmissionAnswer = {
    id: string,
    stepId: string,
    value: string,
}

export default function AdminSubmissionsPage() {

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    async function loadSubmissions() {

        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            if (!token) {
                setErrorMessage("You must be logged in as an admin.");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/submissions`, {
                cache: "no-store",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to load submissions");
            }
            const submissionsData = await res.json();
            setSubmissions(submissionsData);
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
    };

    useEffect(() => {
        loadSubmissions();
    }, []
    );

    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-2xl font-bold">Admin Submissions</h1>

                <ul className="mt-6 space-y-4">
                    {
                        errorMessage ? (
                            <li
                                role="alert"
                                className="mt-4 rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
                                {errorMessage}
                            </li>
                        )
                            : loading ?
                                (
                                    <li className="mt-4 text-sm text-slate-600 rounded-md border border-slate-300 bg-white p-4">
                                        Loading submissions...
                                    </li>
                                ) :
                                submissions.length === 0 ?
                                    (
                                        <li className="rounded border px-3 py-4 text-gray-600">
                                            No submissions yet
                                        </li>
                                    )
                                    : (
                                        submissions.map((submission) => {
                                            return (
                                                <li key={submission.id} className="border rounded px-3 ">
                                                    <div>
                                                        Submission ID: {submission.id}
                                                    </div>
                                                    <div>
                                                        Workflow ID: {submission.workflowId}
                                                    </div>
                                                    <div>
                                                        Status: {submission.status}
                                                    </div>
                                                    <div>
                                                        Answers:{" "} {submission.answers ? submission.answers.length : 0}
                                                    </div>
                                                    <Link
                                                        href={`/admin/submissions/${submission.id}`}
                                                        className="inline-flex items-center justify-center rounded-lg border 
                                                            border-slate-300 bg-white px-3 py-2 text-sm mb-1
                                                            font-medium text-slate-700 transition 
                                                            hover:border-slate-400 hover:bg-slate-50"
                                                    >View submission
                                                    </Link>
                                                </li>
                                            )
                                        })
                                    )
                    }
                </ul>
            </div>
        </main>
    )


}