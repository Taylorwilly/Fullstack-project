"use client";

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
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-3xl font-bold">
                    Create Workflow
                </h1>
                <p className="mt-2 text-gray-600 text-xl">
                    Create a workflow, then add pages and fields from the workflow builder.
                </p>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded border p-4 text-xl">
                        <label className="block text-xl font-medium">
                            Workflow Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter workflow name here"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-2 w-full rounded border px-3 py-2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
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

            </div>

        </main>
    )

}