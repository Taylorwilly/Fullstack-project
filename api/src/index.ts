import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

type Submission = {
    id: string;
    workflowId: string;
    status: string;
    answers : Record<string, string>;
};

type Workflow = {
    id: string;
    name: string;
}

type WorkflowStep = {
    id: string;
    workflowId: string;
    title: string;
    order: number;
};

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

const submissions: Submission[] = [];


app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/workflows", (_req, res) => {
    res.json(workflows);
});
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
//Deleting a workflow and its steps
app.delete("/workflows/:id", (req, res) => {
    const workflowId = req.params.id;

    const workflow = workflows.find((workflow) => workflow.id === workflowId);
    if(!workflow) return res.status(404).json({message: "Workflow not found"});
    
    const workflowIndex = workflows.findIndex((workflow) => workflow.id === workflowId);
    const deletedWorkflow = workflows.splice(workflowIndex, 1)[0];

    const remaingSteps = workflowSteps.filter((step) => step.workflowId !== workflowId);
    workflowSteps.length = 0;
    workflowSteps.push(...remaingSteps);

    res.status(200).json({message: "Workflow deleted successfully",
        deletedWorkflow,
    });
});

app.post("/workflows", (req, res) => {
    const {name, steps} = req.body;
    //We insert the new worflow in the backend
    if(!name || !name.trim()){
        return res.status(400).json({message: "The name is required"});
    }
    const newWorkflow = {
        id: `w${workflows.length +1}`,
        name: name.trim(),
    }
    workflows.push(newWorkflow);
    //We now push the new step to the backend
    const createdSteps = Array.isArray(steps)
        ? steps.map((step, index) => {
            const newStep = {
                id:`st${workflowSteps.length +1}`,
                workflowId: newWorkflow.id,
                title: newWorkflow.name,
                order: typeof step.order === "number" ?
                    step.order : index +1,
            }
            workflowSteps.push(newStep);
            return newStep;
        })
        : [];
    res.status(201).json({...newWorkflow, steps: createdSteps});

});

//We create a route for new steps.
app.post("/workflows/:id/steps", (req, res) => {
    const {id} = req.params;
    const {title, order} = req.body;
    //We find the corresponding workflow in the workflows array in the backend
    const workflow = workflows.find((workflow) => workflow.id ===id);

    if(!workflow){
        return res.status(404).json({message:"Workflow not found"});
    }
    if(!title || !title.trim()){
        return res.status(400).json({message:"Step title is required"});
    }
    //If the workflow exits in the api, we create a new step for that workflow
    const newStep = {
        id: `st${workflowSteps.length +1}`,
        workflowId: id,
        title: title.trim(),
        //If the order is not a number, we find the length of the workflowSteps for that id and add 1
        order: typeof order === "number" ? order : workflowSteps.filter((s) => s.workflowId === id).length + 1,
    };
    workflowSteps.push(newStep);
    res.status(201).json(newStep);
});

//Patching the workflow/:id
app.patch("/workflows/:id", (req, res) => {
    const {id} = req.params;
    const {name} = req.body;
    const workflow = workflows.find((workflow) => workflow.id === id);

    if(!workflow) return res.status(404).json({message: "No workflow found"});
    
    if(!name || !name.trim()) return res.status(404).json({message: "You must enter a name"});
    workflow.name = name.trim();
    res.json(workflow);
})

//This is the route for updating steps
app.patch("/workflows/:workflowId/steps/:stepId", (req, res) => {
    const {workflowId, stepId} = req.params;
    const {title} = req.body;
    const workflow = workflows.find((workflow) => workflow.id === workflowId);

    if(!workflow) return res.status(404).json({message: "No workflow found"});

    const step = workflowSteps.find((step) => step.id === stepId && step.workflowId === workflowId);
    
    if(!step) return res.status(404).json({message: "No step found"});

    if(!title || !title.trim()) return res.status(404).json({message: "The title is required"});
    //As we found the workflow and step, now we update the title othe step
    step.title = title.trim();
    res.json(step);

})

//Here we are reordering steps
app.patch("/workflows/:workflowId/steps/:stepId/move", (req, res) => {
    const {workflowId, stepId} = req.params;
    const {direction} = req.body;

    const workflow = workflows.find((workflow) => workflow.id === workflowId);
    if(!workflow) return res.status(404).json({message: "Workflow not found"});
    
    const currentStep = workflowSteps.find((step) => step.workflowId === workflowId && step.id === stepId);
    if(!currentStep) return res.status(404).json({message: "Step not found"});

    if(direction !== "up" && direction !== "down") return res.status(400).json({message: "Direction must be 'up' or down' "});

    const remainderSteps = workflowSteps.filter((step) => step.workflowId === workflowId).sort((a,b) => a.order - b.order);
    const currentIndex = remainderSteps.findIndex((step) =>  step.id === stepId);
    if(currentIndex === -1) return res.status(404).json({message: "Index not found"});
    //We move one step up by swapping the step with it's neigbor up
    if(direction === "up"){
        if(currentIndex ===0) return res.status(200).json({message: `Step is already at the top.`});
        const targetStep = remainderSteps[currentIndex - 1];
        const tempOrder = currentStep.order;
        currentStep.order = targetStep.order;
        targetStep.order = tempOrder;
    }
    //We move one step down by swapping the step with it's neigbor down
     if(direction === "down"){
        if(currentIndex === remainderSteps.length -1) return res.status(200).json({message: `Step is already at the bottom.`});
        const targetStep = remainderSteps[currentIndex + 1];
        const tempOrder = currentStep.order;
        currentStep.order = targetStep.order;
        targetStep.order = tempOrder;
    }
    const reorderedSteps = remainderSteps.filter((step) => step.workflowId === workflowId).sort((a,b) => a.order - b.order);
    return res.status(200).json({
        message:`Step move ${direction} successfully`,
        steps: reorderedSteps,
    });

});

//Delete steps from workflowSteps
app.delete("/workflows/:workflowId/steps/:stepId", (req, res) => {
    const {workflowId, stepId} = req.params;

    //We check if the specified workflow exists in the workflows array
    const workflow = workflows.find((workflow) => workflow.id === workflowId);
    if(!workflow) return res.status(404).json({message: "The workflow could not be found"});

    //Since the workflow exists, we now find the index of the step so that we can splice the array at that index
    const stepIndex = workflowSteps.findIndex((step) => step.id === stepId && step.workflowId === workflowId );
    if(stepIndex === -1) return res.status(404).json({message: "Step not found"});

    //Since we found the index, then we can now delete the step
    const deletedStep = workflowSteps[stepIndex];
    workflowSteps.splice(stepIndex,1);

    //We now filter and sort the remaining steps
    const remainderSteps = workflowSteps.filter((step) => step.workflowId === workflowId).sort((a,b) => a.order - b.order);
    //Here we reorder the steps so that there is no gap between orders
    remainderSteps.forEach((step, index) => {
        step.order = index + 1;
    } );

    //Then we send a response message at the frontend
    res.json({
        message: "The step was deleted successfully: ",
        deletedStep,
    });

});

app.get("/submissions", (req, res) => {
    res.json(submissions);
})


app.post("/submissions", (req, res) => {
    const {workflowId, answers} = req.body;
    const workflow = workflows.find((workflow) => workflow.id === workflowId);

    if(!workflow) return res.status(404).json({message: "Failed to find workflow"});
    //We validate if the answers exist and is an object, not an array
    if(!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return res.status(404).json({message: "The answer must be an object"});
    }
    //And we validate that all values in the object are strings
    const allValues = Object.values(answers).every(
        (value) => typeof value === 'string'
    );
    if(!allValues) return res.status(400).json({message: "All values should be string"});
    
    const newSubmission : Submission = {
        id: `sub${submissions.length +1}`,
        workflowId,
        answers,
        status: "Submitted",
    };
    submissions.push(newSubmission)
    console.log("current submission: ", submissions);
    return res.status(201).json({message: "Submission suceeded"});
})

app.patch("/submissions/:id/status", (req, res) => {
    const {id} = req.params;
    const {status} = req.body;

    if(!status) return res.status(400).json({message: "Status is required!"});

    const submission = submissions.find((submission) => submission.id === id);
    if(!submission) return res.status(404).json({message: "No submission found"});

    const stats = ["submitted", "in_review", "approved", "rejected"];
    if (!stats.includes(status)){
        return res.status(400).json({message: "Wrong status sent"});
    }

    submission.status = status;
    
    return res.status(200).json({
        message: "Status changed",
        submissions,
    })
    
})

app.get("/submissions/:id", (req, res) => {
    const {id} = req.params;
    const submission = submissions.find((submission) => submission.id === id);

    if(!submission) return res.status(404).json({message: "Submission not found"});

    res.status(200).json(submission);
})


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
