"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import StatusButton from "./StatusButton";
import { useRouter } from "next/navigation";
import {
    formatStatus,
    type SubmissionStatus,
    statusBadgeClass
} from "@/app/components/status";
import { appPageClass, emptyStateClass, listPanelClass, listRowClass, listRowContentClass, listRowMetaClass, listRowTitleClass, mutedCodeClass, narrowContentWrapperClass, pageHeadingClass, pageIntroClass, pageLabelClass, panelClass, panelTextClass, panelTitleClass, secondaryActionClass, sectionClass, sectionHeaderClass, sectionHeadingClass, sectionTextClass } from "@/app/components/ui";

type Props = {
    params: Promise<{ submissionId: string }>;
};

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
    activities: SubmissionActivity[];
};
type SubmissionAnswer = {
    id: string,
    stepId: string,
    value: string,
};
type WorkflowStep = {
    id: string;
    workflowId: string;
    title: string;
    order: number;
};
type Workflow = {
    id: string;
    name: string;
    steps: WorkflowStep[];
};

export default function SubmissionPage({ params }: Props) {
    const router = useRouter();

    const { submissionId } = use(params);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
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

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/submissions/${submissionId}`, {
                cache: "no-store",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to load submission");
            }
            const submissionData = await res.json();

            const workflowRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${submissionData.workflowId}`, {
                cache: "no-store",

            });

            if (!workflowRes.ok) {
                const errorData = await workflowRes.json();
                throw new Error(errorData.message || "Failed to load workflow");
            }

            const workflowData = await workflowRes.json();

            const orderedSteps = [...workflowData.steps].sort((a, b) => a.order - b.order);

            setSubmission(submissionData);
            setWorkflow(workflowData);
            setSortedSteps(orderedSteps);
        }
        catch (error) {
            console.error("Loading submission failed", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Loading submission failed");
            }
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSubmission();
    }, []);

    if (loading) {
        return (
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <p className={pageIntroClass}>
                        Loading submission...
                    </p>
                </section>
            </main>
        )
    }

    if (errorMessage) {
        return (
            <main className={appPageClass}>
                <section className={narrowContentWrapperClass}>
                    <p className={pageIntroClass}>
                        {errorMessage}
                    </p>
                    <div>
                        <Link href="/admin/submissions" className={secondaryActionClass}>
                            Back to submissions
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
                    <p className={pageIntroClass}>
                        Submission not found.
                    </p>
                    <div>
                        <Link href="/admin/submissions" className={secondaryActionClass}>
                            Back to submissions
                        </Link>
                    </div>
                </section>
            </main>
        )
    }

    const activities = submission.activities ?? [];
    return (
        <main className={appPageClass}>
            <section className={narrowContentWrapperClass}>
                <div className="mb-6">
                    <Link href="/admin/submissions" className={secondaryActionClass}>
                        Back to submissions
                    </Link>
                </div>

                <header className="mb-6 space-y-2">
                    <p className={pageLabelClass}>
                        Admin review
                    </p>
                    <h1 className={pageHeadingClass}>
                        Submission details
                    </h1>
                    <p className={pageIntroClass}>
                        Review the submitted answers, confirm the workflow, and update the application status.
                    </p>
                </header>

                <div className={panelClass}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className={panelTitleClass}>
                                Submission summary
                            </h2>
                            <div className="mt-4 space-y-1">
                                <p className={panelTextClass}>
                                    Submission ID: {" "}
                                    <span className={mutedCodeClass}>
                                        {submission.id}
                                    </span>
                                </p>

                                <p className={panelTextClass}>
                                    Workflow: {workflow.name}
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

                    <div className="mt-6 border-t border-[#d8ded7] pt-5">
                        <p className={`${panelTextClass} mb-3`}>
                            Update this submission&apos;s review status.
                        </p>

                        <StatusButton
                            submissionId={submission.id}
                            currentStatus={submission.status}
                            onStatusChanged={(newStatus) => {
                                setSubmission((currentSubmission) => {
                                    if (currentSubmission === null) {
                                        return currentSubmission;
                                    }
                                    return {
                                        ...currentSubmission,
                                        status: newStatus,
                                    };
                                });
                            }}
                        />
                    </div>
                </div>

                <section className="mt-6">
                    <div className="mt-4">
                        <h2 className={panelTitleClass}>
                            Submitted answers
                        </h2>
                        <p className={`${panelTextClass} mt-1`}>
                            These are the answers provided by the client for each workflow step.
                        </p>
                    </div>
                    <ul className={listPanelClass}>
                        {
                            sortedSteps.map((step) => {
                                const answer = submission.answers.find((answer) =>
                                    answer.stepId === step.id
                                );


                                return (
                                    <li key={step.id} className={listRowClass}>
                                        <div className={listRowContentClass}>
                                            <h3 className={listRowTitleClass}>
                                                {step.title}
                                            </h3>
                                            <p className={listRowMetaClass}>
                                                {answer?.value ?? "No answer provided"}
                                            </p>
                                        </div>

                                    </li>
                                )
                            })
                        }
                    </ul>
                </section>

                <section className={sectionClass}>
                    <div className={sectionHeaderClass}>
                        <h2 className={sectionHeadingClass}>
                            Activity history
                        </h2>
                        <p className={sectionTextClass}>
                            A timeline of status changes for this submission.
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