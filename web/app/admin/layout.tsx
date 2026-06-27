
import AdminNav from "@/app/components/AdminNav";
import type { ReactNode } from "react";

type AdminLayoutProps = {
    children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/*Shared top navigation for all admin pages*/}
            <AdminNav />
            {/*Every admin page appears inside this consistent page container*/}
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>

        </div>
    )
}
