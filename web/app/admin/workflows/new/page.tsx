"use client";

import  {useRouter} from "next/navigation";
import Link from "next/link";
import {useState, SubmitEvent} from "react";
//This is for unsaved data that are still in the frontend
type DraftStep = {
    title: string;
    order: number;
}
type CreatedWorkflow = {
    id: string;
    name: string;
    steps: DraftStep[];
}

export default function NewWorkflowPage(){
    const router = useRouter();

    const [name, setName] = useState("");
    const [stepTitle, setStepTitle] = useState("");
    const [steps, setSteps] = useState<DraftStep[]>([]);
    const [submitting, setSubmitting] = useState(false);

    function handleAddStep(){
        if(!stepTitle.trim()) return;
        //We create a new step and add it to the array steps
        const newStep : DraftStep = {
            title: stepTitle.trim(),
            order: steps.length + 1,
        };
        setSteps((prev) => [...prev, newStep]);
        setStepTitle("");
    }
    //Here we remove a step and update other steps orders
    function handleRemoveStep(order: number){
        const updated = steps.filter((step) => step.order !== order).map((step, index) => (
            //we preserve the old properties and update the order starting at index 0
            {
                ...step,
                order: index +1,
            }
        ));
        setSteps(updated);
    }

    async function handleSubmit(e: SubmitEvent){
        e.preventDefault();

        if(!name.trim()){
            return;
        }
        
        try{
            setSubmitting(true);
            const res = await fetch("http://localhost:4000/workflows", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    steps,
                }),
            });
            if(!res.ok){
                throw new Error("Failed to create workflow");
            }
            const createdWorkflow: CreatedWorkflow = await res.json();

            router.push(`/admin/workflows/${createdWorkflow.id}`);
        }
        catch(error){
            console.error("Failed to create workflow", error);
        }
        finally{
            setSubmitting(false);
        }

    }

    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                    <Link href="/admin/workflows" className="text-sm text-red-700 underline">Back to workflows</Link>
                </div>
                <h1 className="text-3xl font-bold">
                    Create Workflow
                </h1>
                <p className="mt-2 text-gray-600 text-xl">
                    Add a workflow name and its initial steps.
                </p>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded border p-4 text-xl">
                        <label className="block text-xl font-medium">
                            Workflow Name
                        </label>
                        <input 
                            type="text"
                            placeholder="Enter workflow name here"
                            value= {name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-2 w-full rounded border px-3 py-2"
                        />
                    </div>
                    <div className="rounded border p-4">
                        <h2 className="text-xl font-semibold">Steps</h2>
                        <div className="mt-4 flex gap-3">
                            <input 
                                type="text"
                                placeholder="Insert the step here"
                                value={stepTitle}
                                onChange={(e) => setStepTitle(e.target.value)}
                                className="flex-1 rounded border px-3 py-2"
                            />
                            <button type="button" 
                                    onClick={handleAddStep}
                                    className="bg-black text-white rounded px-4 py-2" >
                                Add Step  
                            </button>
                        </div>
                        
                        {
                            steps.length === 0 ? (
                                <p className="mt-4 text-sm text-gray-600">No steps added yet</p>
                            ) : (
                                <ul>
                                    {steps.map((step) => (
                                        <li key={step.order}>
                                            <div>
                                                Step{step.order}
                                            </div>
                                            <div>
                                                {step.title}
                                            </div>
                                            <button type="button" onClick={() => handleRemoveStep(step.order)}>
                                                Remove
                                            </button>

                                        </li>
                                    ))}
                                </ul>
                            )
                        }
                    </div>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                        {submitting ? "Creating..." : "Create Workflow"}
                    </button>

                </form>

            </div>

        </main>
    )

}