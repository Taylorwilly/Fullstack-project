"use client";

import { appPageClass, narrowContentWrapperClass, pageHeadingClass, pageLabelClass, panelClass, primaryActionClass } from "@/app/components/ui";
import { useRouter } from "next/navigation";
import { useState, SubmitEvent } from "react";

type CreatedWorkflow = {
    id: string;
    name: string;
}

export default function NewWorkflowPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        if (!name.trim()) {
            setErrorMessage("Workflow name is required");
            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage("");

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                setErrorMessage(errorData.message || "Failed to create workflow");
                return;
            }
            const createdWorkflow: CreatedWorkflow = await res.json();

            router.push(`/admin/workflows/${createdWorkflow.id}`);
        }
        catch (error) {
            console.error("Failed to create workflow", error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Something went wrong while creating workflow");
            }
        }
        finally {
            setSubmitting(false);
        }

    }
    return (
        <main className={appPageClass}>
            <section className={narrowContentWrapperClass}>
                <header className="mb-6 space-y-2">
                    <p className={pageLabelClass}>
                        Workflow builder
                    </p>
                    <h1 className={pageHeadingClass}>
                        Create workflow
                    </h1>
                    <p>
                        Create a workflow, then add pages and fields from the workflow builder
                    </p>
                </header>
                <form onSubmit={handleSubmit} className={panelClass}>
                    <div>
                        <label className="block text-sm font-medium text-[#24332e]">
                            Workflow Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter workflow name here"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-2 w-full rounded-md border border-[#d8ded7] bg-white px-3 py-2 text-[#24332e] outline-none focus:border-[#1c5a4b]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={primaryActionClass}>
                        {submitting ? "Creating..." : "Create Workflow"}
                    </button>

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

                </form>

            </section>

        </main>
    )

}