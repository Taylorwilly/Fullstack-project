'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import DeleteWorkflowButton from "./DeleteWorkflowButton";

type workflow = {
    id: string;
    name: string;
};

export default function Home() {
    const [workflows, setWorkflows] = useState<workflow[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadWorkflows() {
        try {
            const response = await fetch("http://localhost:4000/workflows");

            if(!response.ok) throw new Error("Unable to load the workflow");
            
            const data = await response.json();
            setWorkflows(data);
        }
        catch (error) {
            console.error("Failed to load workflows: ", error);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadWorkflows();
    }, []);


    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-3xl font-bold">IntakeFlow</h1>
                <p className="mt-2 text-gray-600">Fontend connected to backend.</p>
                <div className="mt-6">
                    <Link href="/admin/workflows/new" className="rounded bg-black px-4 py-2 text-white inline-block">
                        New Workflow
                    </Link>
                </div>
                
                <div className="mt-8">
                    <h2 className="text-xl font-semibold">Workflows</h2>
                    {loading? (
                        <p className="mt-3">Loading...</p>
                    ) : workflows.length===0? (<p className="mt-3">No workflows yet</p>
                    ) : (
                        
                        <ul className="mt-2 space-y-3">
                            {workflows.map((workflow) => (
                                
                                
                                <li key={workflow.id} className="rounded bg-blue-500 border p-3">
                                    {/* This is the clikable link to the dynamic pages in [id] */}
                                    <Link href={`/admin/workflows/${workflow.id}`} className="font-medium underline">
                                    {workflow.name}
                                    
                                    </Link>

                                    <div className="text-sm text-red-700">
                                        {workflow.id}                                       
                                    </div>
                                    <DeleteWorkflowButton 
                                        workflowId= {workflow.id} 
                                        onDeleted={() => 
                                            setWorkflows((prev) => prev.filter((item) => item.id !== workflow.id))}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}  
                </div>
            </div>

        </main>
    );
    
}
