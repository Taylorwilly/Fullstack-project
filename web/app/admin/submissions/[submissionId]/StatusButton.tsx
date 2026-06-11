'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

type SubmissionStatus = "Submitted" | "In_Review" |"Approved" | "Rejected";

type StatusButtonProps = {
    submissionId: string;
    currentStatus: SubmissionStatus;
    
}

export default function StatusButton({submissionId, currentStatus}: StatusButtonProps) {
    const router = useRouter();

    const [updatingStatus, setUpdatingStatus] = useState<SubmissionStatus | null>(null);

    async function handleStatusChange(newStatus:SubmissionStatus){
        try{
            setUpdatingStatus(newStatus);
            const res = await fetch(`http://localhost:4000/submissions/${submissionId}/status`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status : newStatus,                
                }),
            });

            if(!res.ok) throw new Error("No submission found");    
         
            router.refresh();
        }
        catch(error){
            console.error("No submission found", error);
        }
        finally{
            setUpdatingStatus(null);
        }
    }

    return (

        <div className='flex gap-3 mt-4'>
            <button
                type="button"
                onClick={() => handleStatusChange("In_Review")}
                disabled={updatingStatus !== null || currentStatus === "In_Review"}
                className='rounded bg-black text-white px-3 py-2 disabled:opacity-50'
            >
                {updatingStatus === "In_Review" ? "Updating..." : "Mark In Review"}
            </button>

            <button
                type="button"
                onClick={() => handleStatusChange("Approved")}
                disabled={updatingStatus !== null || currentStatus === "Approved"}
                className='rounded bg-black text-white px-3 py-2 disabled:opacity-50'
            >
                {updatingStatus === "Approved" ? "Updating..." : "Approved"}
            </button>

            <button
                type="button"
                onClick={() => handleStatusChange("Rejected")}
                disabled={updatingStatus !== null || currentStatus === "Rejected"}
                className='rounded bg-black text-white px-3 py-2 disabled:opacity-50'
            >
                {updatingStatus === "Rejected" ? "Updating..." : "Rejected"}
            </button>
        </div>
    )
}
