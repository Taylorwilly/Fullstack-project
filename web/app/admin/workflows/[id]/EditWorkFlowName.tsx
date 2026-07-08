"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

type EditWorkflowProps = {
    workflowId: string;
    currentName: string;
};

export default function EditWorkflow({ workflowId, currentName }: EditWorkflowProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentName);
    const [saving, setSaving] = useState(false);

    function handleStartEdit() {
        setName(currentName);
        setIsEditing(true);
    }
    function handleCancelEdit() {
        setName(currentName);
        setIsEditing(false);
    }
    async function handleSave() {
        if (!name.trim()) return;
        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                })
            })
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to patch: ${res.status} ${text}`);
            }
            setIsEditing(false);
            router.refresh();
        }
        catch (error) {
            console.error("Failed to patch data", error);
        }
        finally {
            setSaving(false);
        }

    }

    if (!isEditing) {
        return (
            <div>
                <p className="px-2 text-xl">{currentName}</p>
                <button
                    type="button"
                    onClick={handleStartEdit}
                    className="bg-black rounded text-white px-2"
                >
                    Edit
                </button>
            </div>
        )
    }
    return (
        <div className="flex gap-3">
            <input type="text" onChange={(e) => setName(e.target.value)} value={name} className="border rounded " />

            <button type="button" onClick={handleSave} disabled={saving} className="bg-black text-white px-2">
                {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={handleCancelEdit} disabled={saving} className="bg-black text-white px-2">
                Cancel
            </button>

        </div>
    )
}