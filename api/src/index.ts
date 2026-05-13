import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// test data for the API
const workflows = [
    { id: "w1", name: "Client Onboarding" },
    { id: "w2", name: "Invoice Processing" }
];

const workflowSteps = [
    {id: "st1", workflowId: "w1", title:"Personal Info", order:1},
    {id: "st2", workflowId: "w1", title:"Address", order:2},
    {id: "st3", workflowId: "w1", title:"Upload ID", order:3},

    {id: "st4", workflowId: "w2", title:"Business Details", order:1},
    {id: "st5", workflowId: "w2", title:"Invoice Upload", order:2}
];

const submissions = [
    { id: "s1", userId: "u1", workflowId: "w1", status: "draft" }
]
//This get handles calls from fetch("/workflows/[id]") in web browser
app.get("/workflows/:id", (req, res) =>{
    const {id} = req.params;
    const workflow = workflows.find((workflow) => workflow.id === id);
    if(!workflow){
        res.status(404).json("Not Found");
    }
    const steps = workflowSteps.filter((step) => step.workflowId === id).sort((a,b) => a.order - b.order);
    res.json({...workflow, steps});
});
app.get("/workflows", (_req, res) => {
    res.json(workflows);
});

app.post("/workflows", (req, res) => {
    const { name } = req.body;
    const newWorkflow = {
        id: `w${workflows.length + 1}`,
        name,
    };
    workflows.push(newWorkflow);
    res.status(201).json(newWorkflow);
});
app.get("/submissions", (req, res) => {
    res.json(submissions);
})
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
})

app.post("/workflows/:id/steps", (req, res) => {
    const {id} = req.params;
    const {title, order} = req.body;
    const workflow = workflows.find((workflow) => workflow.id ===id);

    if(!workflow){
        return res.status(404).json({message:"Workflow not found"});
    }
    if(!title || !title.trim()){
        return res.status(400).json({message:"Step title is required"});
    }
    const newStep = {
        id: `st${workflowSteps.length +1}`,
        workflowId: id,
        title: title.trim(),
        order: typeof order === "number" ? order : workflowSteps.filter((s) => s.workflowId === id).length + 1,
    };
    workflowSteps.push(newStep);
    res.status(201).json(newStep);
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
