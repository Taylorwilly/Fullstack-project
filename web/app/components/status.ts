export type SubmissionStatus = "submitted" | "in_review" | "approved" | "rejected";

export function formatStatus(status: SubmissionStatus) {
    if (status === "in_review") {
        return "In Review";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function statusBadgeClass(status: SubmissionStatus) {
    if (status === "submitted") {
        return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
    }

    if (status === "in_review") {
        return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-amber-800";
    }

    if (status === "approved") {
        return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-green-800";
    }

    if (status === "rejected") {
        return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-red-800";
    }

    return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";

}