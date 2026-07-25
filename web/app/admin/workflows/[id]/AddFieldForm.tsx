"use client";

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, panelTextClass, panelTitleClass, primaryActionClass } from "@/app/components/ui";

type AddFieldFormProp = {
    workflowId: string;
    pageId: string;
};

export default function AddFieldForm({ pageId, workflowId }: AddFieldFormProp) {
    const router = useRouter();

    const [errorMessage, setErrorMessage] = useState("");
    const [label, setLabel] = useState("");
    const [submitting, setSubmitting] = useState(false);

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
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to create field");
                return;
            }

            const responseData = await response.json();

            setLabel("");
            router.refresh();

            console.log(responseData);

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