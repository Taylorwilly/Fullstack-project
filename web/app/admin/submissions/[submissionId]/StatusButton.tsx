'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SubmissionStatus = "submitted" | "in_review" | "approved" | "rejected";

type StatusButtonProps = {
    submissionId: string;
    currentStatus: SubmissionStatus;

}

export default function StatusButton({ submissionId, currentStatus }: StatusButtonProps) {
    const router = useRouter();

    const [updatingStatus, setUpdatingStatus] = useState<SubmissionStatus | null>(null);

    async function handleStatusChange(newStatus: SubmissionStatus) {
        try {
            setUpdatingStatus(newStatus);

            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:4000/submissions/${submissionId}/status`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (!res.ok) throw new Error("No submission found");

            router.refresh();
        }
        catch (error) {
            console.error("No submission found", error);
        }
        finally {
            setUpdatingStatus(null);
        }
    }

    return (

        <div className='flex gap-3 mt-4'>
            <button
                type="button"
                onClick={() => handleStatusChange("in_review")}
                disabled={updatingStatus !== null || currentStatus === "in_review"}
                className='rounded bg-black text-white px-3 py-2 disabled:opacity-50'
            >
                {updatingStatus === "in_review" ? "Updating..." : "Mark In Review"}
            </button>

            <button
                type="button"
                onClick={() => handleStatusChange("approved")}
                disabled={updatingStatus !== null || currentStatus === "approved"}
                className='rounded bg-black text-white px-3 py-2 disabled:opacity-50'
            >
                {updatingStatus === "approved" ? "Updating..." : "Approved"}
            </button>

            <button
                type="button"
                onClick={() => handleStatusChange("rejected")}
                disabled={updatingStatus !== null || currentStatus === "rejected"}
                className='rounded bg-black text-white px-3 py-2 disabled:opacity-50'
            >
                {updatingStatus === "rejected" ? "Updating..." : "Rejected"}
            </button>
        </div>
    )
}
