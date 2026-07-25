"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dangerActionClass, errorMessageClass } from "@/app/components/ui";

type DeletePageButtonProps = {
    workflowId: string;
    pageId: string;
    pageTitle: string;
}

export default function DeletePageButton({ workflowId, pageId, pageTitle }: DeletePageButtonProps) {
    const router = useRouter();

    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleDelete() {
        const confirmed = window.confirm(`Delete "${pageTitle}"? All fields inside this page will also be deleted.`);
        if (!confirmed) return;

        try {

            setErrorMessage("");
            setIsDeleting(true);

            const token = localStorage.getItem("token");

            if (!token) {
                setErrorMessage("You must be logged in");
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages/${pageId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to delete page");
                return;
            }

            router.refresh();
        }
        catch (error) {
            console.error("Failed to delete page", error);
            setErrorMessage("Failed to delete page.")
        }
        finally {
            setIsDeleting(false);
        }
    }
    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={dangerActionClass}
            >
                {isDeleting ? "Deleting page..." : "Delete page"}
            </button>
            {errorMessage && <p className={errorMessageClass}>{errorMessage}</p>}
        </div>
    )
}