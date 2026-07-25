"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dangerActionClass, errorMessageClass } from "@/app/components/ui";

type DeleteFieldButtonProp = {
    workflowId: string;
    pageId: string;
    fieldId: string;
    fieldLabel: string;
}

export default function DeleteFieldButton({ workflowId, pageId, fieldId, fieldLabel }: DeleteFieldButtonProp) {
    const router = useRouter();

    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleDelete() {
        const confirmed = window.confirm(`Delete "${fieldLabel}"?`);
        if (!confirmed) return;


        try {
            setErrorMessage("");
            setIsDeleting(true);

            const token = localStorage.getItem("token");
            if (!token) {
                setErrorMessage("You must be logged in");
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages/${pageId}/fields/${fieldId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to delete field");
                return;
            }

            router.refresh();
        }
        catch (error) {
            console.error("Failed to delete field", error);
            setErrorMessage("Failed to delete field.");
        }
        finally {
            setIsDeleting(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={dangerActionClass}
            >
                {isDeleting ? "Deleting field..." : "Delete field"}
            </button>
            {errorMessage && <p className={errorMessageClass}>{errorMessage}</p>}
        </div>
    )
}