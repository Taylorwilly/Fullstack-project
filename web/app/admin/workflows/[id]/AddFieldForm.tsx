"use client";

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, fieldTextareaClass, panelTextClass, panelTitleClass, primaryActionClass } from "@/app/components/ui";

type AddFieldFormProp = {
    workflowId: string;
    pageId: string;
};

export default function AddFieldForm({ pageId, workflowId }: AddFieldFormProp) {
    const router = useRouter();

    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [label, setLabel] = useState("");
    const [fieldType, setFieldType] = useState("TEXT");
    const [required, setRequired] = useState(true);
    const [placeholder, setPlaceholder] = useState("");
    const [helpText, setHelpText] = useState("");


    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!label.trim()) {
            setErrorMessage("Field label is required");
            return;
        }
        try {
            setSubmitting(true);
            setErrorMessage("");

            const token = localStorage.getItem("token");

            if (!token) {
                setErrorMessage("You must be logged in");
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages/${pageId}/fields`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    label: label.trim(),
                    fieldType,
                    required,
                    placeholder,
                    helpText,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to create field");
                return;
            }
            setFieldType("TEXT");
            setLabel("");
            setRequired(true);
            setPlaceholder("");
            setHelpText("");
            router.refresh();

        }
        catch (error) {
            console.error("Failed to create field", error);
            setErrorMessage("Unable to create field");
        }
        finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h3 className={panelTitleClass}>
                    Add fields
                </h3>
                <p className={panelTextClass}>
                    Add a question or input to this page.
                </p>

            </div>
            <div className={fieldGroupClass}>
                <label htmlFor={`field-label-${pageId}`} className={fieldLabelClass}>
                    Field label
                </label>

                <input
                    id={`field-label-${pageId}`}
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className={fieldInputClass}
                    required
                />
            </div>

            <div className={fieldGroupClass}>
                <label htmlFor={`field-type-${pageId}`} className={fieldLabelClass}>
                    Field type
                </label>
                <select
                    id={`field-type-${pageId}`}
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

            <div className={fieldGroupClass}>
                <label
                    htmlFor={`field-placeholder-${pageId}`}
                    className={fieldLabelClass}
                >
                    Placeholder
                </label>
                <input
                    id={`field-placeholder-${pageId}`}
                    type="text"
                    value={placeholder}
                    onChange={(event) => setPlaceholder(event.target.value)}
                    className={fieldInputClass}
                />
            </div>

            <div className={fieldGroupClass}>
                <label
                    htmlFor={`field-helpText-${pageId}`}
                    className={fieldLabelClass}
                >
                    Help text
                </label>
                <textarea
                    id={`field-helpText-${pageId}`}
                    value={helpText}
                    onChange={(e) => setHelpText(e.target.value)}
                    className={fieldTextareaClass}
                />

            </div>

            <div className="flex items-center gap-2">
                <label htmlFor={`field-required-${pageId}`} className={fieldLabelClass}>Required field</label>
                <input
                    id={`field-required-${pageId}`}
                    type="checkbox"
                    checked={required}
                    onChange={(event) => setRequired(event.target.checked)}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className={primaryActionClass}
            >
                {submitting ? "Adding field..." : "Add field"}
            </button>

            {
                errorMessage && <p className={errorMessageClass}>{errorMessage}</p>
            }

        </form>
    )

}