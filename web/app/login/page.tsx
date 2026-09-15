"use client";
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { primaryActionClass, secondaryActionClass, pageIntroClass, appPageClass, narrowContentWrapperClass, pageLabelClass, pageHeaderClass, panelClass, fieldLabelClass, fieldInputClass, errorMessageClass } from "../components/ui";
import Link from "next/link";

type LoginForm = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [loginForm, setLoginForm] = useState<LoginForm>({
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
                    email: loginForm.email,
                    password: loginForm.password
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
        <main className={appPageClass}>
            <div className={narrowContentWrapperClass}>
                <header className="mb-6">

                    <Link
                        href="/"
                        className={secondaryActionClass}
                    >
                        IntakeFlow
                    </Link>

                    <div className="mt-8">
                        <p className={pageLabelClass}>
                            Secure account access
                        </p>
                        <h1 className={pageHeaderClass}>
                            Sign in to continue
                        </h1>
                        <p className={pageIntroClass}>
                            Access your intake forms, saved submissions, and application updates.
                        </p>
                    </div>
                </header>

                <form
                    onSubmit={handleLogin}
                    className={panelClass}
                >
                    <fieldset>
                        <legend>Sign in details</legend>
                        <label htmlFor="email" className={fieldLabelClass}>Email:</label>
                        <input
                            id="email"
                            type="email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                            className={fieldInputClass}
                            required
                        />

                        <label htmlFor="password" className={fieldLabelClass}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className={fieldInputClass}
                            required
                        />

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
                                    className={errorMessageClass}
                                >
                                    {errorMessage}
                                </p>
                            )
                        }
                    </fieldset>
                </form>
            </div>
        </main>
    )

}