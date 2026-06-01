"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// test data for the API
const workflows = [
    { id: "w1", name: "Client Onboarding" },
    { id: "w2", name: "Invoice Processing" }
];
const workflowSteps = [
    { id: "st1", workflowId: "w1", title: "Personal Info", order: 1 },
    { id: "st2", workflowId: "w1", title: "Address", order: 2 },
    { id: "st3", workflowId: "w1", title: "Upload ID", order: 3 },
    { id: "st4", workflowId: "w2", title: "Business Details", order: 1 },
    { id: "st5", workflowId: "w2", title: "Invoice Upload", order: 2 }
];
const submissions = [
    { id: "s1", userId: "u1", workflowId: "w1", status: "draft" }
];
app.get("/workflows", (_req, res) => {
    res.json(workflows);
});
//This get handles calls from fetch("/workflows/[id]") in web browser
app.get("/workflows/:id", (req, res) => {
    const { id } = req.params;
    const workflow = workflows.find((workflow) => workflow.id === id);
    if (!workflow) {
        res.status(404).json("Not Found");
    }
    const steps = workflowSteps.filter((step) => step.workflowId === id).sort((a, b) => a.order - b.order);
    res.json({ ...workflow, steps });
});
app.post("/workflows", (req, res) => {
    const { name, steps } = req.body;
    //We insert the new worflow in the backend
    if (!name || !name.trim()) {
        return res.status(400).json({ message: "The name is required" });
    }
    const newWorkflow = {
        id: `w${workflows.length + 1}`,
        name: name.trim(),
    };
    workflows.push(newWorkflow);
    //We now push the new step to the backend
    const createdSteps = Array.isArray(steps)
        ? steps.map((step, index) => {
            const newStep = {
                id: `st${workflowSteps.length + 1}`,
                workflowId: newWorkflow.id,
                title: newWorkflow.name,
                order: typeof step.order === "number" ?
                    step.order : index + 1,
            };
            workflowSteps.push(newStep);
            return newStep;
        })
        : [];
    res.status(201).json({ ...newWorkflow, steps: createdSteps });
});
//We create a route for new steps.
app.post("/workflows/:id/steps", (req, res) => {
    const { id } = req.params;
    const { title, order } = req.body;
    //We find the corresponding workflow in the workflows array in the backend
    const workflow = workflows.find((workflow) => workflow.id === id);
    if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
    }
    if (!title || !title.trim()) {
        return res.status(400).json({ message: "Step title is required" });
    }
    //If the workflow exits in the api, we create a new step for that workflow
    const newStep = {
        id: `st${workflowSteps.length + 1}`,
        workflowId: id,
        title: title.trim(),
        //If the order is not a number, we find the length of the workflowSteps for that id and add 1
        order: typeof order === "number" ? order : workflowSteps.filter((s) => s.workflowId === id).length + 1,
    };
    workflowSteps.push(newStep);
    res.status(201).json(newStep);
});
app.get("/submissions", (req, res) => {
    res.json(submissions);
});
app.post("/submissions", (req, res) => {
    const { userId, workflowId, status } = req.body;
    const newSubmission = {
        id: `s${submissions.length + 1}`,
        userId,
        workflowId,
        status,
    };
    submissions.push(newSubmission);
    res.status(201).json(newSubmission);
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
