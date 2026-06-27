"use client"

import { useEffect, useState } from "react";
import Link from "next/navigation";
import { cardClass, primaryButtonClass } from "./components/ui";

type Workflow = {
    id: string;
    name: string;
};

export default function WorkflowPage() {

    const [workflow, setWorkflow] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    async function loadWorkflow() {
        try {

            setLoading(true);

            const response = await fetch(`http://localhost:4000/workflows`);

            if (!response.ok) {
                throw new Error("Unable to load workflows");
            }
            const data = await response.json();
            setWorkflow(data);
            setErrorMessage("");
        }

        catch (error) {
            console.error("Failed to load workflow", error);
            setErrorMessage("We could not load workflows. Make sure the api is running");
        }
        finally {
            setLoading(false);
        }

    }