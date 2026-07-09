'use client';

import { useState } from 'react';

type SubmissionStatus = "submitted" | "in_review" | "approved" | "rejected";

type StatusButtonProps = {
    submissionId: string;
    currentStatus: SubmissionStatus;
    onStatusChanged: (newStatus: SubmissionStatus) => void;

}

export default function StatusButton({ submissionId, currentStatus, onStatusChanged }: StatusButtonProps) {

    const [updatingStatus, setUpdatingStatus] = useState<SubmissionStatus | null>(null);

    async function handleStatusChange(newStatus: SubmissionStatus) {
        try {
            setUpdatingStatus(newStatus);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${submissionId}/status`, {
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

            onStatusChanged(newStatus);
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
                className="inline-flex items-center 
                        justify-center rounded-lg bg-[#1c5a4b] 
                        text-white px-4 py-3 text-sm font-medium 
                        transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
                {updatingStatus === "in_review" ? "Updating..." : "Mark In Review"}
            </button>

            <button
                type="button"
                onClick={() => handleStatusChange("approved")}
                disabled={updatingStatus !== null || currentStatus === "approved"}
                className="inline-flex items-center 
                        justify-center rounded-lg bg-[#1c5a4b] 
                        text-white px-4 py-3 text-sm font-medium 
                        transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
                {updatingStatus === "approved" ? "Updating..." : "Approved"}
            </button>

            <button
                type="button"
                onClick={() => handleStatusChange("rejected")}
                disabled={updatingStatus !== null || currentStatus === "rejected"}
                className="inline-flex items-center 
                        justify-center rounded-lg bg-[#1c5a4b] 
                        text-white px-4 py-3 text-sm font-medium 
                        transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
                {updatingStatus === "rejected" ? "Updating..." : "Rejected"}
            </button>
        </div>
    )
}
