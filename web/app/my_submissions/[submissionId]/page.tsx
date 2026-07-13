"use client";
//This page is where the client 
// sees the application status after submission
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    formatStatus,
    getStatusMessage,
    statusBadgeClass,
    type SubmissionStatus
} from "@/app/components/status"
import { appPageClass, emptyStateClass, errorMessageClass, listPanelClass, listRowClass, listRowContentClass, listRowMetaClass, listRowTitleClass, loadingMessageClass, mutedCodeClass, narrowContentWrapperClass, pageHeadingClass, pageIntroClass, pageLabelClass, panelClass, panelTextClass, panelTitleClass, secondaryActionClass } from "@/app/components/ui";
type Props = {
    params: Promise<{ submissionId: string }>;
}

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
            setErrorMessage("");

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
                throw new Error(errorData.message || "Failed to load submission.");
            }
            const submissionData = await submissionRes.json();

            const workflowRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${submissionData.workflowId}`, {
                cache: "no-store",
            })
            if (!workflowRes.ok) {
                const errorData = await workflowRes.json();
                throw new Error(errorData.message || "Failed to load workflows");
            }
            const workflowData = await workflowRes.json();

            const orderedSteps = [...workflowData.steps].sort((a, b) => a.order - b.order);

            setSortedSteps(orderedSteps);
            setSubmission(submissionData);
            setWorkflow(workflowData);
        }
        catch (error) {
            console.error("Loading submissions failed", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Loading submissions failed.");
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
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <p className={loadingMessageClass}>
                        Loading submission...
                    </p>
                </section>
            </main>
        )
    }

    if (errorMessage) {
        return (
            <main className={appPageClass}>
                <section className={errorMessageClass}>
                    <p role="alert" className={errorMessageClass}>
                        {errorMessage}
                    </p>

                    <div className="mt-4">
                        <Link href="/my_submissions" className={secondaryActionClass}>
                            Back to My Submissions
                        </Link>
                    </div>
                </section>
            </main>
        )
    }

    if (submission === null || workflow === null) {
        return (
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <p className={emptyStateClass}>
                        Submission not found
                    </p>

                    <div className="mt-4">
                        <Link href="/my_submissions" className={secondaryActionClass}>
                            Back to My Submissions
                        </Link>
                    </div>
                </section>
            </main>
        );
    }
    return (
        <main>
            <section className={narrowContentWrapperClass}>
                <div className="mb-6">
                    <Link href="/my_submissions">
                        Back to My Submissions
                    </Link>
                </div>

                <header className="mb-6 space-y-2">
                    <p className={pageLabelClass}>
                        Application status
                    </p>
                    <h1 className={pageHeadingClass}>
                        {workflow.name}
                    </h1>
                    <p className={pageIntroClass}>
                        Review your submitted answers and track the current status of this application
                    </p>
                </header>
                <div className={panelClass}>
                    <div>
                        <div>
                            <h2>
                                Submission summary
                            </h2>
                            <p>
                                {getStatusMessage(submission.status)}
                            </p>

                            <div>
                                <p className={panelTextClass}>
                                    Application ID: {" "}
                                    <span className={mutedCodeClass}>
                                        {submission.id}
                                    </span>
                                </p>

                                <p className={panelTextClass}>
                                    Workflow ID: {" "}
                                    <span className={mutedCodeClass}>
                                        {submission.workflowId}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <span className={statusBadgeClass(submission.status)}>
                            {formatStatus(submission.status)}
                        </span>
                    </div>
                </div>
                <section className="mt-6">
                    <div className="mb-4">
                        <h2 className={panelTitleClass}>
                            Submitted answers
                        </h2>
                        <p className={panelTextClass}>
                            Answers you provided for each workflow step
                        </p>

                        <ul className={listPanelClass}>
                            {
                                sortedSteps.map((step) => {
                                    const answer = submission.answers.find(answer => answer.stepId === step.id)
                                    return (
                                        <li key={step.id} className={listRowClass}>
                                            <div className={listRowContentClass}>
                                                <h3 className={listRowTitleClass}>
                                                    {step.id}
                                                </h3>
                                                <p className={listRowMetaClass}>
                                                    {answer?.value ?? "No answer provided"}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </div>
                </section>
            </section>
        </main>

    )

}