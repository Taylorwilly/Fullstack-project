"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

type MoveStepButtonProps = {
    workflowId: string;
    stepId: string;
    isFirst: boolean;
    isLast: boolean;
};

export default function MoveStepButton({workflowId, stepId, isFirst, isLast} : MoveStepButtonProps){
    const router = useRouter();

    const [moving, setMoving] = useState(false);
    
    async function handleMove(direction: "up" | "down"){
        
        try {
            setMoving(true);

            const res = await fetch(`http://localhost:4000/workflows/${workflowId}/steps/${stepId}/move`, {
                method: "PATCH",
                headers: {"Content-Type" : "application/json"},
                body: JSON.stringify({direction,}),
            });
            if(!res.ok) {
                const text = res.text();
                throw new Error(`Failed to patch: ${res.status} ${text}`);
            }
           
            router.refresh();
        }
        catch(error){
            console.error("Failed to Patch");
        }
        finally{
            setMoving(false);
        }
    }
    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => handleMove("up")}
                disabled={moving || isFirst}
                className="bg-black border rounded text-white px-2"
            >
                Up
            </button>

            <button
                type="button"
                onClick={() => handleMove("down")}
                disabled={moving || isLast}
                className="bg-black border rounded text-white px-2"
            >    
                Down          
            </button>
        </div>
    )

}