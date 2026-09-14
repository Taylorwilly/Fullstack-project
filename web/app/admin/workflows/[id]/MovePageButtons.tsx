"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MovePageButtonProps = {
    workflowId: string;
    pageId: string;
    isFirst: boolean;
    isLast: boolean;
};

export default function MovePageButton({ workflowId, pageId, isFirst, isLast }: MovePageButtonProps) {
    const router = useRouter();

    const [moving, setMoving] = useState(false);

    async function handleMove(direction: "up" | "down") {

        try {
            setMoving(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/pages/${pageId}/move`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    direction,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to patch: ${res.status} ${text}`);
            }

            router.refresh();
        }
        catch (error) {
            console.error("Failed to Patch", error);
        }
        finally {
            setMoving(false);
        }
    }
    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => handleMove("up")}
                disabled={moving || isFirst}
                className="rounded-md border border-[#d8ded7] bg-white px-3 py-1.5 text-sm font-medium text-[#24332e] hover:bg-[#f6f2ea] disabled:cursor-not-allowed disabled:opacity-40"
            >
                Move up
            </button>

            <button
                type="button"
                onClick={() => handleMove("down")}
                disabled={moving || isLast}
                className="rounded-md border border-[#d8ded7] bg-white px-3 py-1.5 text-sm font-medium text-[#24332e] hover:bg-[#f6f2ea] disabled:cursor-not-allowed disabled:opacity-40"
            >
                Move down
            </button>
        </div>
    )

}