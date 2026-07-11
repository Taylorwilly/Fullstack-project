'use client';

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";

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
        <main>
            <h1 className="font-bold p-3 text-3xl">
                Create account to save and manage your intake submissions
            </h1>
            <p className="font-semibold text-2xl">
                This page is for creating account
            </p>
            <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-3 rounded border p-4"
            >

                <fieldset>
                    <legend>Registration details</legend>
                    <label>Name</label>
                    <input
                        type="text"
                        value={registration.name}
                        onChange={(e) => setRegistration({ ...registration, name: e.target.value })}
                        className="w-full rounded border px-3 py-2"
                        required
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={registration.email}
                        onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                        className="w-full rounded border px-3 py-2"
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={registration.password}
                        onChange={(e) => setRegistration({ ...registration, password: e.target.value })}
                        className="w-full rounded border px-3 py-2"
                        required
                    />

                    <label>Confirm password</label>
                    <input
                        type="password"
                        value={registration.confirmPassword}
                        onChange={(e) => setRegistration({ ...registration, confirmPassword: e.target.value })}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                </fieldset>

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
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    {submitting ? "Submitting..." : "Submit"}
                </button>
            </form>
        </main>
    )
}