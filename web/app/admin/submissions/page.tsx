
import Link from "next/link";
type Submission = {
    id: string;
    workflowId: string;
    status: string;
    answers : Record<string, string>;
};

export default async function AdminSubmissionsPage() {
    

    const res = await fetch("http://localhost:4000/submissions", {
        cache: "no-store",
    });

    if(!res.ok) {
        return (
            <main className="min-h-screen p-8">
                <div>
                    <h1 className="font-bold px-3 py-2">
                        Failed to load the submission
                    </h1>
                    <p className="font-semibold px-3 py-2">The submission could not be found</p>
                </div>
            </main>
        );
    }
    const submissions: Submission[] = await res.json();
    
    if(submissions.length === 0) {
        return (
            <main className="min-h-screen p-8">
                <div>
                    <p>
                        No submission yet.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-8">
           <div className="mx-auto max-w-2xl"> 
                <h1 className="text-2xl font-bold">Admin Submission</h1>                 
                <ul className="mt-6 space-y-4">
                    {submissions.map((submission) => (
                    <li key={submission.id} className="border rounded px-3 ">
                        <div>
                            Submission: {submission.id}
                        </div>
                        <div>
                            Workflow: {submission.workflowId}
                        </div>
                        <div>
                            Status: {submission.status}
                        </div>
                         <div>
                            Answers:{" "} {submission.answers ? Object.keys(submission.answers).length : 0}
                        </div>  
                        <Link href={`/admin/submissions/${submission.id}`} className="underline">View submission</Link>
                    </li>
                    ))}    
                </ul> 
           </div>
        </main>
    )


}