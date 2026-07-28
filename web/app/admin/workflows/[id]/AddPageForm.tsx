"use client";

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessageClass, fieldGroupClass, fieldInputClass, fieldLabelClass, panelTextClass, panelTitleClass, primaryActionClass } from "@/app/components/ui";

type AddPageFormProp = {
    workflowId: string;
};

export default function AddPageForm({ workflowId }: AddPageFormProp) {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            setSubmitting(true);
            setErrorMessage("");

            const token = localStorage.getItem("token");

            if (!token) {
                setErrorMessage("You must be logged in.");
                return;
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "Failed to create page");
                return;
            }
            setTitle("");
            router.refresh();
        }
        catch (error) {
            console.error("Submission failed", error);
            setErrorMessage("Unable to create the page.");
        }
        finally {
            setSubmitting(false);
        }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h3 className={panelTitleClass}>Add a page</h3>
                <p className={panelTextClass}>
                    Create another section for this workflow.
                </p>
            </div>

            <div className={fieldGroupClass}>
                <label
                    htmlFor="page-title"
                    className={fieldLabelClass}
                >
                    Page title
                </label>
                <input
                    id="page-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={fieldInputClass}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className={primaryActionClass}
            >
                {submitting ? "Adding page..." : "Add page"}
            </button>

            {
                errorMessage && <p className={errorMessageClass}>{errorMessage}</p>
            }


        </form>
    )
}
