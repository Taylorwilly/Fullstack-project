"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { secondaryActionClass } from "@/app/components/ui";

export default function LogoutButton() {
    const router = useRouter();

    const [loggingOut, setLoggingOut] = useState(false);

    function handleLogout() {
        setLoggingOut(true)
        localStorage.removeItem("token");

        router.replace("/login");
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={secondaryActionClass}
            >
                {loggingOut ? "Logging out..." : "Log out"}
            </button>
        </div>
    )
}