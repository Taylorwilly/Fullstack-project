"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryActionClass } from "./ui";
import LogoutButton from "./LogoutButton";

const navigationItems = [
    {
        href: "/admin/workflows",
        label: "Workflow",
    },
    {
        href: "/admin/submissions",
        label: "Submission",
    },
];

export default function AdminNav() {
    const pathname = usePathname();

    //This check if the user is on the current page or the child page
    function isCurrentPage(href: string) {
        return pathname === href || pathname.startsWith(`${href}/`);
    }

    return (
        <header className="sticky top-0 z-20 border-b border-b-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/admin/workflows" className="flex gap-4 items-center font-semibold text-slate-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#173b5E] text-white text-sm font-bold">
                            IF
                        </span>
                        <span>
                            IntakeFlow
                            <span className="ml-2 text-sm font-normal text-slate-500">
                                Admin
                            </span>
                        </span>
                    </Link>

                    <nav aria-label="Admin navigation">
                        <ul className="flex gap-2 items-center">
                            {
                                navigationItems.map((item) => {
                                    const active = isCurrentPage(item.href);

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                aria-current={active ? "page" : undefined}
                                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                                                    ? "bg-[#173b5E] text-white"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                                    }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </nav>
                </div>


                <Link href="/admin/workflows/new" className={primaryActionClass}>
                    New Workflow
                </Link>

                <LogoutButton />
            </div>
        </header>
    )
}
