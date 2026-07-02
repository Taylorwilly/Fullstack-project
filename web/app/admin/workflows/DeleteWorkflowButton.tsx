"use client"
import { useState } from "react";

type DeleteWorkflowButton = {
    workflowId: string;
    onDeleted: () => void;
};

export default function DeleteWorkflowButton({ workflowId, onDeleted }: DeleteWorkflowButton) {
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleDelete() {
        //The user should be sure to delete or not
        const confirmed = window.confirm("Do you want to delete this workflow?");
        if (!confirmed) return;

        try {
            setErrorMessage("");
            setDeleting(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:4000/workflows/${workflowId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete");
            }
            onDeleted();
        }
        catch (error) {
            console.error("Failed to delete", error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Something went wrong while deleting");
            }
        }
        finally {
            setDeleting(false);
        }
    };
    return (
        <div>
            <div>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-black border rounded text-white px-2"
                >
                    {deleting ? "Deleting..." : "Delete"}
                </button>
            </div>

            {
                errorMessage && (
                    <p
                        role="alert"
                        className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800"
                    >
                        {errorMessage}
                    </p>
                )
            }
        </div>

    )
}