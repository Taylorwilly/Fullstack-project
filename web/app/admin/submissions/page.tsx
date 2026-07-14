"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    type SubmissionStatus,
    formatStatus,
    statusBadgeClass
} from "@/app/components/status";
import {
    appPageClass,
    contentWrapperClass,
    emptyStateClass,
    errorMessageClass,
    listPanelClass,
    listRowActionClass,
    listRowClass,
    listRowContentClass,
    listRowMetaClass,
    listRowTitleClass,
    loadingMessageClass,
    mutedCodeClass,
    pageHeaderClass,
    pageHeaderTextClass,
    pageHeadingClass,
    pageIntroClass,
    pageLabelClass,
    secondaryActionClass,

} from "@/app/components/ui";

type SubmissionAnswer = {
    id: string;
    stepId: string;
    value: string;
};

type Submission = {
    id: string;
    workflowId: string;
    answers: SubmissionAnswer[];
    status: SubmissionStatus;
};

export default function AdminSubmissionPage() {

    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [errorMessage, setErrorMessage] = useState("");

    async function loadSubmissions() {

        try {
            setLoading(true);
            setErrorMessage("");
            const token = localStorage.getItem("token");

            if (!token) {
                setErrorMessage("You must be logged in");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/submissions`, {
                cache: "no-store",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to load submissions.");
            }
            const submissionData: Submission[] = await res.json();
            setSubmissions(submissionData);

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
        loadSubmissions();
    }, []
    );

    return (
        <main className={appPageClass}>
            <section className={contentWrapperClass}>
                <header className={pageHeaderClass}>
                    <div className={pageHeaderTextClass}>
                        <p className={pageLabelClass}>
                            Admin Workplace
                        </p>
                        <h1 className={pageHeadingClass}>
                            Submission review
                        </h1>
                        <p className={pageIntroClass}>
                            Review client intake submissions, inpect submitted answers and update application statuses.
                        </p>
                    </div>
                </header>

                {
                    errorMessage ? (
                        <p role="alert" className={errorMessageClass}>
                            {errorMessage}
                        </p>
                    ) : loading ? (
                        <p className={loadingMessageClass}>
                            Loading submision...
                        </p>
                    ) : submissions.length === 0 ? (
                        <p className={emptyStateClass}>
                            No submissions yet
                        </p>
                    ) : (
                        <ul className={listPanelClass}>
                            {
                                submissions.map((submission) => (
                                    <li key={submission.id} className={listRowClass}>
                                        <div className={listRowContentClass}>
                                            <h2 className={listRowTitleClass}>
                                                Client submission
                                            </h2>
                                            <p className={listRowMetaClass}>
                                                Submission ID: {""}
                                                <span className={mutedCodeClass}>
                                                    {submission.id}
                                                </span>
                                            </p>
                                            <p className={listRowMetaClass}>
                                                Workflow ID: {" "}
                                                <span className={mutedCodeClass}>
                                                    {submission.workflowId}
                                                </span>
                                            </p>
                                            <p className={listRowMetaClass}>
                                                Answers submitted: {submission.answers?.length ?? 0}
                                            </p>
                                        </div>
                                        <div className={listRowActionClass}>
                                            <span className={statusBadgeClass(submission.status)}>
                                                {formatStatus(submission.status)}
                                            </span>
                                            <Link href={`/admin/submissions/${submission.id}`} className={secondaryActionClass}>
                                                View submission
                                            </Link>
                                        </div>
                                    </li>
                                ))
                            }

                        </ul>
                    )
                }

            </section>
        </main>
    )
}