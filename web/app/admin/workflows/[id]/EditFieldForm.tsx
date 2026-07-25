"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessageClass, fieldInputClass, fieldLabelClass, listRowTitleClass, primaryActionClass, secondaryActionClass } from "@/app/components/ui";

type EditFieldFormProp = {
    workflowId: string;
    pageId: string;
    fieldId: string;
    currentLabel: string;
};
export default function EditFieldForm({ workflowId, pageId, fieldId, currentLabel }: EditFieldFormProp) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(currentLabel);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function handleStartEdit() {
        setErrorMessage("");
        setLabel(currentLabel);
        setIsEditing(true)
    }

    function handleCancelEdit() {
        setErrorMessage("");
        setLabel(currentLabel);
        setIsEditing(false);
    }

    async function handleSave() {
        if (!label.trim()) {
            setErrorMessage("Field label is required");
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages/${pageId}/fields/${fieldId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    label: label.trim(),
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to edit label");
                return;
            }

            setIsEditing(false);
            router.refresh();
        }
        catch (error) {
            console.error("Failed to edit field", error);
            setErrorMessage("Failed to edit field");
        }
        finally {
            setIsSaving(false);
        }

    }

    if (!isEditing) {
        return (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className={listRowTitleClass}>{currentLabel}</p>
                <button
                    type="button"
                    onClick={handleStartEdit}
                    className={secondaryActionClass}
                >
                    Edit field
                </button>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            <label
                htmlFor={`edit-field-label-${fieldId}`}
                className={fieldLabelClass}
            >
                Field label
            </label>
            <input
                id={`edit-field-label-${fieldId}`}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={fieldInputClass}
            />

            {
                errorMessage && <p className={errorMessageClass}>{errorMessage}</p>
            }

            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={primaryActionClass}
            >
                {isSaving ? "Saving..." : "Save"}
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