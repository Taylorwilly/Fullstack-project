"use client"
import {useState} from "react";

type DeleteWorkflowButton = {
    workflowId: string;
    onDeleted: () => void;
};

export default function DeleteWorkflowButton({workflowId, onDeleted} : DeleteWorkflowButton){
    const [deleting, setDeleting] = useState(false);

    async function handleDelete(){
        //The user should be sure to delete or not
        const confirmed = window.confirm("Do you want to delete this workflow?");
        if(!confirmed) return;

        try{
            setDeleting(true);

            const res = await fetch(`http://localhost:4000/workflows/${workflowId}`, {
                method: "DELETE",
            });
            
            if(!res.ok) {
                const text = res.text();
                throw new Error(`Failed to delete workflow: ${text}`);
            };
            onDeleted();
        }
        catch(error){
            console.error("Failed to delete", error);
        }
        finally{
            setDeleting(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleDelete}
                disabled = {deleting}
                className="bg-black border rounded text-white px-2"
            >
                {deleting ? "Deleting..." : "Delete"}
            </button>
        </div>

    )
}