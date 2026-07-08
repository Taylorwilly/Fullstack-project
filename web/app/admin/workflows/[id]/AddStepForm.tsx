"use client";
import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation"

type AddStepFormProps = {
    workflowId: string;
}

export default function AddStepForm({ workflowId }: AddStepFormProps) {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [order, setOrder] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        //We check if there is a title and return if not
        if (!title.trim()) {
            return;
        }
        try {
            //Now we are in the submitting mode, 
            //means we disable the submission button
            setSubmitting(true);

            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/steps`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    order: order ? Number(order) : undefined,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create step");
            }
            //Then we reset the title and the order 
            // and then we refresh the page so that the new step appears
            setTitle("");
            setOrder("");
            router.refresh();
        }
        catch (error) {
            console.error("Failed to add step: ", error);
        }
        //After the adding, we able the submission button
        finally {
            setSubmitting(false);
        }
    }
    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-3 rounded border p-4">
            <h2 className="text-xl font-semibold">Add Step</h2>
            <input
                type="text"
                placeholder="Step Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border px-3 py-2"
                required
            />
            <input
                type="number"
                placeholder="Order (Optional)"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full rounded border px-3 py-2"
            />
            {/* The submit button is disabled when the form is being submitted */}
            <button
                type="submit"
                disabled={submitting}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                {submitting ? "Adding..." : "Add Step"}
            </button>

        </form>
    )
}