"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EditStepButtonProps = {
    workflowId: string;
    stepId: string;
    currentTitle: string;
};

export default function EditStepButton({ workflowId, stepId, currentTitle }: EditStepButtonProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(currentTitle);
    const [saving, setSaving] = useState(false);

    function handleStartEdit() {
        setTitle(currentTitle);
        setIsEditing(true);
    };

    function handleCancelEdit() {
        setTitle(currentTitle);
        setIsEditing(false);
    }

    async function handleSave() {
        if (!title.trim()) return;
        try {
            setSaving(true);

            const res = await fetch(`http://localhost:4000/workflows/${workflowId}/steps/${stepId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to update step: ${res.status} ${text}`);
            };
            setIsEditing(false);
            router.refresh();
        }
        catch (error) {
            console.error("Failed to update step", error);
        }
        finally {
            setSaving(false);
        }
    }
    return (
        <div className="flex items-center gap-2">
            {!isEditing ? (
                <button
                    type="button"
                    onClick={handleStartEdit}
                    className="rounded bg-black text-white px-2"
                >
                    Edit
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded border px-1"
                    />
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded bg-black text-white px-2"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="rounded bg-black text-white px-2"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
};