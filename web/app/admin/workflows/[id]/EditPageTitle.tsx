"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, panelTitleClass, primaryActionClass, secondaryActionClass } from "@/app/components/ui";

type EditPageTitleProps = {
    workflowId: string;
    pageId: string;
    currentTitle: string;
};

export default function EditPageTitle({ workflowId, pageId, currentTitle }: EditPageTitleProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [title, setTitle] = useState(currentTitle);
    const [isSaving, setIsSaving] = useState(false);

    function handleStartEdit() {
        setErrorMessage("");
        setTitle(currentTitle);
        setIsEditing(true);
    };

    function handleCancelEdit() {
        setErrorMessage("");
        setTitle(currentTitle);
        setIsEditing(false);
    };

    async function handleSave() {
        if (!title.trim()) {
            setErrorMessage("Page title is required");
            return;
        }
        try {
            setErrorMessage("");
            setIsSaving(true);

            const token = localStorage.getItem("token");

            if (!token) {
                setErrorMessage("You must be logged in");
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages/${pageId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to edit page");
                return;
            }

            setIsEditing(false);
            router.refresh();
        }
        catch (error) {
            console.error("Failed to edit page", error);
            setErrorMessage("Failed to edit page");
        }
        finally {
            setIsSaving(false);
        }
    }

    if (!isEditing) {
        return (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className={panelTitleClass}>{currentTitle}</p>
                <button
                    type="button"
                    onClick={handleStartEdit}
                    className={secondaryActionClass}
                >
                    Edit title
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className={fieldGroupClass}>
                <label
                    htmlFor={`page-label-${pageId}`}
                    className={fieldLabelClass}
                >
                    Page title
                </label>
                <input
                    id={`page-label-${pageId}`}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={fieldInputClass}
                />
            </div>

            {errorMessage && <p className={errorMessageClass}>{errorMessage}</p>}

            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={primaryActionClass}
            >
                {isSaving ? "Saving page..." : "Save title"}
            </button>

            <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className={secondaryActionClass}
            >
                Cancel
            </button>
        </div>
    )
}