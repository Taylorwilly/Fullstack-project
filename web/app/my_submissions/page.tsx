"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ClientSubmissionPage() {
    const router = useRouter();

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);


    async function loadSubmissions() {
        try {
            setLoading(true);
            setErrorMessage("");
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions`, {
                cache: "no-store",
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            })

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to load submissions");
            }

            const submissionData = await res.json();

            setSubmissions(submissionData);
        }
        catch (error) {
            console.error("Failed to load submissions", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Failed to load submissions")
            }
        }
        finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        loadSubmissions();
    }, []
    )

    return (
        <main className="min-h-screen bg-[#F6F2EA] px-4 py-10 sm:px-6">
            <section className="mx-auto max-w-4xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking--[0.18em] text-[#14be94]">
                            CLIENT PORTAL
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#24332e]">
                            My submissions
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
                            Review the workflows you have submitted and their status
                        </p>
                    </div>
                    <Link
                        href="/portal/start"
                        className="inline-flex items-center 
                        justify-center rounded-lg bg-[#1c5a4b] 
                        text-white px-4 py 3 text-sm font-medium 
                        transition hover:bg-indigo-700 "
                    >
                        Start a submission
                    </Link>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#d8ded7 bg-[#fffdf8] shadow-[0_8px_24px_rgba(36,51,46,0.06)]">
                    <ul className="divide-y divide-[#d8ded7]">
                        {
                            errorMessage ? (
                                <div role="alert"
                                    className="mt-4"
                                >
                                    {errorMessage}
                                </div>
                            ) :
                                loading ?
                                    (<div>
                                        Loading...
                                    </div>

                                    ) : (
                                        submissions.map((submission) => {
                                            return (
                                                <li
                                                    key={submission.id}
                                                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm-justify-between sm:px-6"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-[#24332e]">
                                                            Submission
                                                        </p>
                                                        <p className="mt-1 truncate font-mono text-xs text-[#66736d]">
                                                            Submission ID: {submission.id}
                                                        </p>
                                                        <p className="mt-3 text-sm text-[#66736d]">
                                                            Workflow ID: {submission.workflowId}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 sm:shrink-0">
                                                        <span className="rounded-full px-3 py-1 text-xs font-semibold text-[#1c5a4b] bg-[#e4eee8]">
                                                            {submission.status}
                                                        </span>
                                                        <Link
                                                            href={`/my_submissions/${submission.id}`}
                                                            className="inline-flex items-center justify-center rounded-lg border 
                                                            border-slate-300 bg-white px-3 py-2 text-sm
                                                            font-medium text-slate-700 transition 
                                                            hover:border-slate-400 hover:bg-slate-50"
                                                        >
                                                            View details
                                                        </Link>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    )
                        }
                    </ul>
                </div>



            </section>
        </main>
    );


}