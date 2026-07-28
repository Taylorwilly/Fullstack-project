"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, fieldTextareaClass, listRowTitleClass, primaryActionClass, secondaryActionClass } from "@/app/components/ui";

type EditFieldFormProp = {
    workflowId: string;
    pageId: string;
    fieldId: string;
    currentLabel: string;
    currentPlaceholder: string | null;
    currentHelpText: string | null;
    currentFieldType: string;
    currentRequired: boolean;
};
export default function EditFieldForm({
    workflowId, pageId, fieldId, currentLabel,
    currentPlaceholder, currentHelpText, currentFieldType, currentRequired
}: EditFieldFormProp) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(currentLabel);
    const [placeholder, setPlaceholder] = useState(currentPlaceholder ?? "");
    const [helpText, setHelpText] = useState(currentHelpText ?? "");
    const [fieldType, setFieldType] = useState(currentFieldType);
    const [required, setRequired] = useState(currentRequired);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function handleStartEdit() {
        setErrorMessage("");
        setLabel(currentLabel);
        setPlaceholder(currentPlaceholder ?? "");
        setHelpText(currentHelpText ?? "");
        setFieldType(currentFieldType);
        setRequired(currentRequired);
        setIsEditing(true);
    }

    function handleCancelEdit() {
        setErrorMessage("");
        setLabel(currentLabel);
        setPlaceholder(currentPlaceholder ?? "");
        setHelpText(currentHelpText ?? "");
        setFieldType(currentFieldType);
        setRequired(currentRequired);
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
                    placeholder,
                    helpText,
                    fieldType,
                    required,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to edit field");
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
            <div className={fieldGroupClass}>
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
            </div>

            <div className={fieldGroupClass}>
                <label
                    htmlFor={`edit-field-placeholder-${fieldId}`}
                    className={fieldLabelClass}
                >
                    Placeholder
                </label>
                <input
                    id={`edit-field-placeholder-${fieldId}`}
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    className={fieldInputClass}
                />
            </div>

            <div className={fieldGroupClass}>
                <label
                    htmlFor={`edit-field-helpText-${fieldId}`}
                    className={fieldLabelClass}
                >
                    Help text
                </label>
                <textarea
                    id={`edit-field-helpText-${fieldId}`}
                    value={helpText}
                    onChange={(e) => setHelpText(e.target.value)}
                    className={fieldTextareaClass}
                />

            </div>

            <div className={fieldGroupClass}>
                <label htmlFor={`field-type-${fieldId}`} className={fieldLabelClass}>
                    Field type
                </label>
                <select
                    id={`field-type-${fieldId}`}
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className={fieldInputClass}
                >
                    <option value="TEXT">
                        Text
                    </option>
                    <option value="TEXTAREA">
                        Long Text
                    </option>
                    <option value="EMAIL">
                        Email
                    </option>
                    <option value="NUMBER">
                        Number
                    </option>
                    <option value="DATE">
                        Date
                    </option>
                    <option value="PHONE">
                        Phone
                    </option>
                    <option value="RADIO">
                        Multiple choice
                    </option>
                    <option value="SELECT">
                        Dropdown
                    </option>
                    <option value="CHECKBOX">
                        Checkbox
                    </option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <label
                    htmlFor={`edit-field-required-${fieldId}`}
                    className={fieldLabelClass}
                >
                    Required
                </label>
                <input
                    id={`edit-field-required-${fieldId}`}
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                />
            </div>

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