"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatStatus, statusBadgeClass, type SubmissionStatus } from "../components/status";
import LogoutButton from "../components/LogoutButton";
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
    pageHeaderClass,
    pageHeaderTextClass,
    pageHeadingClass,
    pageIntroClass,
    pageLabelClass,
    primaryActionClass,
    secondaryActionClass
} from "../components/ui";

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
                throw new Error(errorData.message || "Failed to load submissions.");
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
                setErrorMessage("Failed to load submissions.")
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
        <main className={appPageClass}>
            <section className={contentWrapperClass}>
                <header className={pageHeaderClass}>
                    <div className={pageHeaderTextClass}>
                        <p className={pageLabelClass}>
                            Client Portal
                        </p>
                        <h1 className={pageHeadingClass}>
                            My submissions
                        </h1>
                        <p className={pageIntroClass}>
                            Review the workflows you have submitted and their status
                        </p>
                    </div>
                    <Link
                        href="/portal/start"
                        className={primaryActionClass}
                    >
                        Start a submission
                    </Link>
                    <LogoutButton />
                </header>
                <div className="overflow-hidden rounded-lg border border-[#d8ded7 bg-[#fffdf8] shadow-[0_8px_24px_rgba(36,51,46,0.06)]">
                    {
                        errorMessage ? (
                            <div role="alert"
                                className={errorMessageClass}
                            >
                                {errorMessage}
                            </div>
                        ) :
                            loading ?
                                (<p className={loadingMessageClass}>
                                    Loading submissions...
                                </p>
                                ) :
                                submissions.length === 0 ? (
                                    <p className={emptyStateClass}>
                                        You have not submitted any workflows yet.
                                    </p>
                                ) :
                                    (
                                        <ul className={listPanelClass}>
                                            {
                                                submissions.map((submission) => {
                                                    return (
                                                        <li
                                                            key={submission.id}
                                                            className={listRowClass}
                                                        >
                                                            <div className={listRowContentClass}>
                                                                <h2 className={listRowTitleClass}>
                                                                    Submission
                                                                </h2>
                                                                <p className={listRowMetaClass}>
                                                                    Submission ID: {""}
                                                                    <span className="font-mono">
                                                                        {submission.id}
                                                                    </span>
                                                                </p>
                                                                <p className={listRowMetaClass}>
                                                                    Workflow ID: {" "}
                                                                    <span className="font-mono">
                                                                        {submission.workflowId}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className={listRowActionClass}>
                                                                <span className={statusBadgeClass(submission.status)}>
                                                                    {formatStatus(submission.status)}
                                                                </span>
                                                                <Link
                                                                    href={`/my_submissions/${submission.id}`}
                                                                    className={secondaryActionClass}
                                                                >
                                                                    View details
                                                                </Link>
                                                            </div>
                                                        </li>
                                                    );
                                                })
                                            }
                                        </ul>
                                    )
                    }
                </div>



            </section>
        </main>
    );


}