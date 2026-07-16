"use client";
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { primaryActionClass, secondaryActionClass, pageIntroClass } from "../components/ui";
import Link from "next/link";

type Registration = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [registration, setRegistration] = useState<Registration>({
        email: "",
        password: "",
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoggingIn, setLoggingIn] = useState(false);

    async function handleLogin(e: SubmitEvent) {
        e.preventDefault();
        try {
            setLoggingIn(true);
            setErrorMessage("");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    email: registration.email,
                    password: registration.password
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Login failed");
            }

            const tokenReturn = await res.json();

            const token = tokenReturn.token;
            //Save the token in the browser localStorage
            //That later will be retrieved from a protected page to send a request 
            localStorage.setItem("token", token);

            const role = tokenReturn.user.role;

            if (role === "ADMIN") {
                router.push("/admin/workflows");
            }
            else {
                router.push("/portal/start");
            }
        }
        catch (error) {
            console.error("Unable to login", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Unable to login");
            }
        }
        finally {
            setLoggingIn(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
                    <a
                        href="/"
                        className="text-lg font-semibold tracking-tight text-[#173BTE]"
                    >
                        Intakeflow
                    </a>
                </div>
            </header>
            <section className="mx-auto max-w-6xl px-6 py-12">
                <div className="max-w-md">
                    <p className="text-sm font-medium text-[#173B5E]">
                        Secure account access
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        Sign in to continue
                    </h1>
                    <p className="mt-3 text-smleading-6 text-slate-600">
                        Access your intake forms, saved submissions, and application updates.
                    </p>

                    <form
                        onSubmit={handleLogin}
                        className="mt-8 border border-slate-200 bg-white p-6"
                    >
                        <fieldset className="border px-3 ml-3 mr-48 py-2">
                            <label className="mt-6">Email:</label>
                            <input
                                type="email"
                                value={registration.email}
                                onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                                className="border rounded mt-3 mb-3 ml-3 px-1"
                                required
                            /><br />

                            <label>Password</label>
                            <input
                                type="password"
                                value={registration.password}
                                onChange={(e) => setRegistration({ ...registration, password: e.target.value })}
                                className="border rounded mt-1 ml-3 px-1"
                                required
                            /><br />

                            <button
                                type="submit"
                                className={primaryActionClass}
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? "Logging in..." : "Login"}
                            </button>

                            <div className="mt-4">
                                <p className={pageIntroClass}>
                                    Don&apos;t have an account?
                                </p>
                                <Link href="/register" className={`${secondaryActionClass} mt-4`}>
                                    Create an account
                                </Link>
                            </div>

                            {
                                errorMessage && (
                                    <p
                                        role="alert"
                                        className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800"
                                    >
                                        {errorMessage}
                                    </p>
                                )
                            }
                        </fieldset>
                    </form>
                </div>
            </section>
        </main>
    )

}