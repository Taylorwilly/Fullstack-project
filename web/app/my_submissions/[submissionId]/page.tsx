"use client";
//This page is where the client 
// sees the application status after submission
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";

import {
    formatStatus,
    getStatusMessage,
    statusBadgeClass,
    type SubmissionStatus
} from "@/app/components/status"
import { appPageClass, emptyStateClass, errorMessageClass, listPanelClass, listRowClass, listRowContentClass, listRowMetaClass, listRowTitleClass, loadingMessageClass, mutedCodeClass, narrowContentWrapperClass, pageHeadingClass, pageIntroClass, pageLabelClass, panelClass, panelTextClass, panelTitleClass, secondaryActionClass, sectionClass, sectionHeaderClass, sectionHeadingClass, sectionTextClass } from "@/app/components/ui";
type Props = {
    params: Promise<{ submissionId: string }>;
}

type SubmissionActivity = {
    id: string;
    userId: string | null;
    submissionId: string;
    action: string;
    oldStatus: SubmissionStatus | null;
    newStatus: SubmissionStatus;
    createdAt: string;
};

type Submission = {
    id: string;
    workflowId: string;
    answers: SubmissionAnswer[];
    status: SubmissionStatus;
    activities?: SubmissionActivity[];
    createdAt: string;
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

    const activities = submission.activities ?? [];
    return (
        <main className={appPageClass}>
            <section className={narrowContentWrapperClass}>
                <div className="mb-6 flex flex-wrap justify-between">
                    <Link href="/my_submissions">
                        Back to My Submissions
                    </Link>
                    <LogoutButton />
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
                                    Reference ID: {" "}
                                    <span className={mutedCodeClass}>
                                        {submission.id}
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
                                                    {step?.title ?? "Unknown step"}
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

                <section className={sectionClass}>
                    <div className={sectionHeaderClass}>
                        <h2 className={sectionHeadingClass}>
                            Activity history
                        </h2>
                        <p className={sectionTextClass}>
                            A timeline of status changes for your submission.
                        </p>
                    </div>

                    {
                        activities.length === 0 ? (
                            <p className={emptyStateClass}>
                                No submission activities yet
                            </p>
                        ) : (
                            <div className={listPanelClass}>
                                {activities.map((activity) => (
                                    <div key={activity.id} className="px-5 py-4">
                                        <p className="mt-1 text-sm text-[#66736d]">
                                            {activity.action === "SUBMITTED" ?
                                                "Submission created"
                                                : "Status changed"
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-[#66736d]">
                                            {
                                                activity.oldStatus === null ?
                                                    `Status set to ${formatStatus(activity.newStatus)}`
                                                    : `${formatStatus(activity.oldStatus)} -> ${formatStatus(activity.newStatus)}`
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-[#66736d]">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </section>
            </section>
        </main>
    )
}