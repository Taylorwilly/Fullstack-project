'use client';

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { appPageClass, errorMessageClass, fieldInputClass, narrowContentWrapperClass, pageHeaderClass, pageIntroClass, pageLabelClass, panelClass, panelTitleClass, primaryActionClass, secondaryActionClass } from "../components/ui";

type Registration = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function RegisterPage() {
    const router = useRouter();
    const [registration, setRegistration] = useState<Registration>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        try {
            setErrorMessage("");
            setSubmitting(true);

            if (registration.password !== registration.confirmPassword) {
                setErrorMessage("The passwords don't match");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    name: registration.name,
                    email: registration.email,
                    password: registration.password
                }),
            })
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to register");
            }
            router.push("/login");
        }
        catch (error) {
            console.error("Failed to register", error);

            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Something went wrong while registering");
            }
        }
        finally {
            setSubmitting(false);
        }
    }

    return (
        <main className={appPageClass}>
            <div className={narrowContentWrapperClass}>
                <header>
                    <p className={pageLabelClass}>
                        Client portal
                    </p>

                    <h1 className={pageHeaderClass}>
                        Create your account
                    </h1>

                    <p className={pageIntroClass}>
                        Save your submissions and keep track of their review status.
                    </p>
                </header>
                <form
                    onSubmit={handleSubmit}
                    className={panelClass}
                >

                    <fieldset>
                        <legend className={panelTitleClass}>Registration details</legend>

                        <div className="mt-5">
                            <label className={pageLabelClass}>Name</label>
                            <input
                                type="text"
                                value={registration.name}
                                onChange={(e) => setRegistration({ ...registration, name: e.target.value })}
                                className={fieldInputClass}
                                required
                            />
                        </div>

                        <div className="mt-5">
                            <label>Email</label>
                            <input
                                type="email"
                                value={registration.email}
                                onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                                className={fieldInputClass}
                                required
                            />
                        </div>

                        <div className="mt-5">
                            <label>Password</label>
                            <input
                                type="password"
                                value={registration.password}
                                onChange={(e) => setRegistration({ ...registration, password: e.target.value })}
                                className={fieldInputClass}
                                required
                            />
                        </div>

                        <div className="mt-5">
                            <label>Confirm password</label>
                            <input
                                type="password"
                                value={registration.confirmPassword}
                                onChange={(e) => setRegistration({ ...registration, confirmPassword: e.target.value })}
                                className={fieldInputClass}
                                required
                            />
                        </div>
                    </fieldset>

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
                    <button
                        type="submit"
                        disabled={submitting}
                        className={primaryActionClass}
                    >
                        {submitting ? "Creating account..." : "Create account"}
                    </button>

                    <p className="mt-5 text-sm text-[#66736d]">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className={secondaryActionClass}
                        >
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>

        </main>
    )
}