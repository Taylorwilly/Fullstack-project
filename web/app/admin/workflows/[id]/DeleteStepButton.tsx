"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteStepButtonProps = {
    workflowId: string;
    stepId: string;
};
export default function DeleteStepButton({ workflowId, stepId }: DeleteStepButtonProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {

        try {
            setDeleting(true);
            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:4000/workflows/${workflowId}/steps/${stepId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to delete step");

            router.refresh();

        }
        catch (error) {
            console.error("Failed to delete step", error);
        }
        finally {
            setDeleting(false);
        }
    }

    return (
        <button type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-black border rounded text-white px-2">
            {deleting ? "Deleting..." : "Delete"}
        </button>
    );
}
