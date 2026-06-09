'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

type StatusProps = {
    submissionId: string;
    
}

export default function StatusButton({submissionId}: StatusProps) {
    const router = useRouter();

    const [updating, setUpdating] = useState(false);

    async function handleStatus(){
        try{
            setUpdating(true);
            const res = await fetch(`http://localhost:4000/submissions/${submissionId}/status`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status : "approved",                   
                }),
            });

            if(!res.ok) throw new Error("No submission found");    

            
            router.refresh();
        }
        catch(error){
            console.error("No submission found", error);
        }
        finally{
            setUpdating(false);
        }
    }

    return (
        <main>
            <div>
                <button
                    type="button"
                    onClick={handleStatus}
                    disabled={updating}
                    className="bg-black text-white rounded"
                >
                    {updating? "Updating..." : "Update"}

                </button>
            </div>
        </main>

    )
}
