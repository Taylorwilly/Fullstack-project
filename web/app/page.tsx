import Link from "next/link";
import {
    appPageClass,
    contentWrapperClass,
    pageHeadingClass,
    pageIntroClass,
    pageLabelClass,
    panelClass,
    panelTextClass,
    panelTitleClass,
    primaryActionClass,
    secondaryActionClass
} from "./components/ui";

export default function Home() {
    return (
        <main className={appPageClass}>
            <section className={contentWrapperClass}>
                <div className="grid gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                    <div className={panelClass}>
                        <p className={pageLabelClass}>
                            Full-Stack Portfolio Project
                        </p>
                        <h1 className={`${pageHeadingClass} mt-4 max-w-3xl text-4xl sm:text-5xl`}>
                            IntakeFlow helps teams collect, review, and manage client intake submissions
                        </h1>
                        <p className={`${pageIntroClass} mt-5 text-base`}>
                            This is a deployed workflow application platform where administrators manage workflows and review submissions, and client complete structured forms.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/login" className={primaryActionClass}>
                                Sign in
                            </Link>

                            <Link href="/register" className={secondaryActionClass}>
                                Create client account
                            </Link>

                        </div>
                    </div>
                    <div className={panelClass}>
                        <p className={pageLabelClass}>
                            How it works
                        </p>

                        <div>
                            <div className={panelClass}>
                                <h2 className={panelTitleClass}>
                                    1. Admin builds workflows
                                </h2>
                                <p className={`${panelTextClass} mt-2`}>
                                    Admins create workflows, manage steps, review submissions, and update statuses like In Review, Approved, or Rejected.
                                </p>
                            </div>

                            <div className={panelClass}>
                                <h2 className={panelTitleClass}>
                                    2. Clients submit forms
                                </h2>
                                <p className={`${panelTextClass} mt-2`}>
                                    Clients register, sign in, complete workflows, and track their submission status.
                                </p>
                            </div>

                            <div className={panelClass}>
                                <h2 className={panelTitleClass}>
                                    3. Admin Reviews submissions
                                </h2>
                                <p className={`${panelTextClass} mt-2`}>
                                    Admins create workflows, manage steps, review submissions, and update statuses like In Review, Approved, or Rejected.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className={panelClass}>
                        <h2 className={panelTitleClass}>
                            Client Portal
                        </h2>
                        <p className={`${panelTextClass} mt-2`}>
                            Clients can create accounts, submit intake workflows, and view their application status.
                        </p>
                    </div>

                    <div className={panelClass}>
                        <h2 className={panelTitleClass}>
                            Admin Workspace
                        </h2>
                        <p className={`${panelTextClass} mt-2`}>
                            Admins can manage workflows, review all submissions, and update review outcomes
                        </p>
                    </div>

                    <div className={panelClass}>
                        <h2 className={panelTitleClass}>
                            Stack and Deployment
                        </h2>
                        <p className={`${panelTextClass} mt-2`}>
                            Built with Next.js, TypeScript, Express, Prisma, PostgreSQL, JWT auth, Vercel, Render, and Neon.
                        </p>
                    </div>

                </div>

                <div className={panelClass}>
                    <h2 className={panelTitleClass}>
                        Project highlights:
                    </h2>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-[#66736d]">
                        <li> JWT authentication and role-based authorization</li>
                        <li> Client-only access to personnal submissions</li>
                        <li> Admin access to all submissions</li>
                        <li> Workflow and workflow-step management</li>
                        <li> PostgreSQL database with Prisma ORM</li>
                        <li> Production frontend, API and database deployment</li>
                    </ul>
                </div>
            </section>
        </main >
    )
}