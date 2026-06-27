import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as z from "zod";
import argon2 from "argon2";

dotenv.config();
const app = express();
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

//A string is valid only when it contains a least one character
const nonBlankString = z.string().refine(
    (value) => value.trim().length > 0,
    {
        error: "Must be a non-blank string",
    }
);
//Rules for the body sent to POST /submissions
const createSubmissionSchema = z.strictObject({
    workflowId: nonBlankString,

    //The keys are dynamic workflow step IDs.
    //Every answer value must have a non-blank string.
    answers: z.record(z.string(), nonBlankString),
});
//Rules for the body sent to PATCH /submissions/:id/status
//A submission begin as "submitted" when it is created.
//Then an admin can update it only to one of these values.
const updateSubmissionStatusSchema = z.strictObject({
    status: z.enum([
        "in_review",
        "approved",
        "rejected"
    ])
});
//Zod id schema
const submissionIdSchema = z.strictObject({
    id: z.string().trim().min(1, {
        error: "Submission id is required",
    }),
});


const registerUserSchema = z.strictObject({
    name: z.string().trim()
        .min(1, { error: "Name cannot be blank" })
        .max(100, { error: "Name must be 100 characters or fewer" })
        .optional(),

    email: z.email({ error: "Enter a valid email address" }),

    password: z.string()
        .min(8, { error: "The password must be 8 characters or more" })
        .max(100, { error: "The password must be 100 characters or fewer" })
});

const loginUserSchema = z.strictObject({
    email: z.email({ error: "Invalid email address" }),

    password: nonBlankString
})

app.use(cors());
app.use(express.json());

//Check if the backend responds
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});


//Registration route
app.post("/auth/register", async (req, res) => {

    try {
        //Validate the request body with Zod
        const validation = registerUserSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid registration data",
                errors: validation.error.issues.map(issue => ({
                    path: issue.path.join("."),
                    message: issue.message
                })),
            })
        }
        const { name, email, password } = validation.data;

        const normalizedEmail = email.toLowerCase();
        //We check if there is already an existing same email in the database
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }
        //Hash the password and store it in a variable
        const passwordHash = await argon2.hash(password);

        //Now we create the user in the database and we do not return the password to client
        const user = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
        return res.status(201).json({
            message: "Account created successfully",
            user,
        })
    }
    catch (error) {
        console.error("Failed to create account", error);
        return res.status(500).json({
            message: "Failed to create account",
        })
    }
});

//Login route
app.post("/auth/login", async (req, res) => {
    try {
        const validation = loginUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid login data",
                errors: validation.error.issues.map((issue) => ({
                    message: issue.message,
                    path: issue.path.join(".")
                })),
            });
        }
        const { email, password } = validation.data;
        const normalizedEmail = email.toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            }
        });

        if (!existingUser) return res.status(401).json({ message: "Invalid email or password" });

        const verifiedPassword = await argon2.verify(existingUser.passwordHash, password);

        if (!verifiedPassword) return res.status(401).json({
            message: "Invalid email or password",
        });

        return res.status(200).json({ message: "Login succeeds" });
    }
    catch (error) {
        console.error("Failed to login", error);

        return res.status(500).json({ message: "Failed to login" });
    }
});

app.get("/workflows", async (_req, res) => {
    //We ask prisma to find workflow in postgres
    //since we migrate from array storage to database storage
    try {
        const workflows = await prisma.workflow.findMany({
            include: {
                steps: true,
            },
        });
        return res.status(200).json(workflows);
    }
    catch (error) {
        console.error("Failed to fetch workflows", error);
        return res.status(500).json({
            message: "Failed to fetch workflows"
        });
    }
});
app.post("/workflows", async (req, res) => {
    const { name, steps } = req.body;
    //We first validate the workflow name
    if (!name || !name.trim()) {
        return res.status(400).json({ message: "The name is required" });
    }
    //Then we validate steps array
    if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ message: "At least one step is required" });
    }
    //Then we validate each step title
    const hasInvalidStep = steps.some(
        (step) => !step.title || !step.title.trim()
    );

    if (hasInvalidStep) return res.status(400).json({
        message: "Step title is required for each step"
    });

    try {
        //We insert a workflow and its steps 
        // into the database now instead of memory arrays
        const newWorkflow = await prisma.workflow.create({
            data: {
                name: name.trim(),
                steps: {
                    create: steps.map((step, index) => ({
                        title: step.title.trim(),
                        order: typeof step.order === "number" ? step.order : index + 1,
                    }))
                },
            },
            include: {
                steps: {
                    orderBy: {
                        order: "asc",
                    }
                }
            }
        })
        return res.status(201).json(newWorkflow);
    }
    catch (error) {
        console.error("Failed to create workflow", error);

        return res.status(500).json({ message: "Failed to create workflow" });
    }

});

//This route handles calls from fetch("/workflows/[id]") in web browser
app.get("/workflows/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const workflow = await prisma.workflow.findUnique({
            where: {
                id,
            },
            include: {
                steps: {
                    orderBy: {
                        order: "asc",
                    }
                }
            }
        });
        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        return res.status(200).json(workflow);
    }
    catch (error) {
        console.error("Failed to fetch workflow", error);
        return res.status(500).json({ message: "Failed to fetch workflow" });
    };
});
//Patching the workflow/:id
app.patch("/workflows/:id", async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "You must enter a name" });

    try {
        const existingWorkflow = await prisma.workflow.findUnique({
            where: {
                id,
            },
        });

        if (!existingWorkflow) return res.status(404).json({ message: "Workflow not found" });

        const workflow = await prisma.workflow.update({
            where: {
                id,
            },
            data: {
                name: name.trim(),
            },
        });
        return res.json(workflow);
    }
    catch (error) {
        console.error("Failed to update workflow", error);
        return res.status(500).json({ message: "Failed to update workflow" });
    }
})
//Deleting a workflow and its steps
app.delete("/workflows/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const existingWorkflow = await prisma.workflow.findUnique({
            where: {
                id,
            },
        });
        if (!existingWorkflow) return res.status(404).json({ message: "Workflow Not Found" });

        const workflow = await prisma.workflow.delete({
            where: {
                id,
            },
        })
        return res.status(200).json({ message: "Workflow deleted successfully", workflow });
    }
    catch (error) {
        console.error("Failed to delete workflow", error);
        return res.status(500).json({ message: "Failed to delete workflow" });
    }
});

//We create a route for new steps.
app.post("/workflows/:id/steps", async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: "Step title is required" });
    }
    //We find the corresponding workflow in the database
    try {
        const existingWorkflow = await prisma.workflow.findUnique({
            where: {
                id,
            },
        });
        if (!existingWorkflow) return res.status(404).json({ message: "Workflow not found" });
        //We here find the step with the max order
        //so that  
        // the new step order will be max + 1 
        const lastStep = await prisma.workflowStep.findFirst({
            where: {
                workflowId: id,
            },
            orderBy: {
                order: "desc",
            }
        });

        const newStep = await prisma.workflowStep.create({
            data: {
                title: title.trim(),
                order: lastStep ? lastStep.order + 1 : 1,
                workflowId: id,
            },
        });
        return res.status(201).json({ message: "Step created successfully", newStep });
    }
    catch (error) {
        console.error("Failed to create step", error);
        return res.status(500).json({ message: "Failed to create step" });
    }
});
//This is the route for updating steps
app.patch("/workflows/:workflowId/steps/:stepId", async (req, res) => {
    const { workflowId, stepId } = req.params;
    const { title } = req.body;

    try {
        if (!title || !title.trim()) return res.status(400).json({ message: "The title is required" });

        const workflow = await prisma.workflow.findUnique({
            where: {
                id: workflowId,
            }
        });
        if (!workflow) return res.status(404).json({ message: "Workflow not found" });

        const step = await prisma.workflowStep.findUnique({
            where: {
                id: stepId,
            },
        });

        if (!step) return res.status(404).json({ message: "Step not found" });

        if (step.workflowId !== workflowId) return res.status(400).json({
            message: "This step doesn't belong to this workflow"
        })

        const updatedStep = await prisma.workflowStep.update({
            where: {
                id: stepId,
            },
            data: {
                title: title.trim(),
            }
        });
        return res.status(200).json({ message: "Step updated successfully", updatedStep });
    }
    catch (error) {
        console.error("Unable to update step", error);
        return res.status(500).json({ message: "Unable to update step" });
    }

})
//Delete steps from workflowSteps
app.delete("/workflows/:workflowId/steps/:stepId", async (req, res) => {
    const { workflowId, stepId } = req.params;
    //We check if the specified workflow exists in the the database
    try {
        const result = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.findUnique({
                where: {
                    id: workflowId,
                }
            });
            if (!workflow) {
                throw new Error("WORKFLOW_NOT_FOUND");
            }
            const step = await tx.workflowStep.findUnique({
                where: {
                    id: stepId,
                }
            });
            if (!step) {
                throw new Error("STEP_NOT_FOUND");
            }

            if (step.workflowId !== workflowId) {
                throw new Error("WORKFLOW_MISMATCH");
            }

            const deletedStep = await tx.workflowStep.delete({
                where: {
                    id: stepId,
                }
            });

            const remainingSteps = await tx.workflowStep.findMany({
                where: {
                    workflowId,
                },
                orderBy: {
                    order: "asc",
                }
            });
            const updatedStep = await Promise.all(
                remainingSteps.map((step, index) =>
                    tx.workflowStep.update({
                        where: {
                            id: step.id,
                        },
                        data: {
                            order: index + 1,
                        }
                    })
                )
            );
            return { deletedStep, updatedStep };

        });
        return res.status(200).json({
            message: "Step deleted successfully",
            deletedStep: result.deletedStep,
            updatedStep: result.updatedStep,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({ message: "The workflow could not be found" });
            }
            if (error.message === "STEP_NOT_FOUND") {
                return res.status(404).json({ message: "The step could not be found" });
            }
            if (error.message === "WORKFLOW_MISMATCH") {
                return res.status(404).json({ message: "The workflows mismatch" });
            }
        }
        console.error("Failed to delete step", error);
        return res.status(500).json({ message: "Failed to delete step" });
    }
});
//Here we are moving a step up or down
app.patch("/workflows/:workflowId/steps/:stepId/move", async (req, res) => {
    const { workflowId, stepId } = req.params;
    const { direction } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            //Validate workflow
            const workflow = await tx.workflow.findUnique({
                where: {
                    id: workflowId,
                },
            });
            if (!workflow) throw new Error("WORKFLOW_NOT_FOUND");
            //Validate steps
            const currentStep = await tx.workflowStep.findUnique({
                where: {
                    id: stepId,
                },
            });
            if (!currentStep) throw new Error("STEP_NOT_FOUND");

            if (currentStep.workflowId !== workflowId) {
                throw new Error("STEP_MISMATCH");
            }
            //Validate the direction of the move
            if (direction !== "up" && direction !== "down") {
                throw new Error("DIRECTION_MUST_BE_UP_OR_DOWN");
            }

            const remainingSteps = await tx.workflowStep.findMany({
                where: {
                    workflowId,
                },
                orderBy: {
                    order: "asc",
                }
            });

            const currentIndex = remainingSteps.findIndex((step) => step.id === stepId);
            if (currentIndex === -1) throw new Error("INDEX_NOT_FOUND");

            if (direction === "up") {
                if (currentIndex === 0) {
                    return {
                        move: false,
                        message: "Step already at the top",
                        steps: remainingSteps
                    }
                }
                const targetIndex = currentIndex - 1;


                const targetStep = remainingSteps[targetIndex];

                const tempOrder = currentStep.order;
                currentStep.order = targetStep.order;
                targetStep.order = tempOrder;
                await tx.workflowStep.update({
                    where: {
                        id: stepId,
                    },
                    data: {
                        order: currentStep.order,
                    }

                });
                await tx.workflowStep.update({
                    where: {
                        id: targetStep.id,
                    },
                    data: {
                        order: targetStep.order,
                    }
                });
                const updatedSteps = await tx.workflowStep.findMany({
                    where: {
                        workflowId,
                    },
                    orderBy: {
                        order: "asc",
                    }
                })
                return {
                    move: true,
                    message: "Step moved successfully",
                    steps: updatedSteps,
                };
            }

            if (direction === "down") {
                if (currentIndex === remainingSteps.length - 1) {
                    return {
                        move: false,
                        message: "Step already at the bottom",
                        steps: remainingSteps,
                    }
                }
                const targetIndex = currentIndex + 1;

                const targetStep = remainingSteps[targetIndex];

                const tempOrder = currentStep.order;
                currentStep.order = targetStep.order;
                targetStep.order = tempOrder;
                await tx.workflowStep.update({
                    where: {
                        id: stepId,
                    },
                    data: {
                        order: currentStep.order,
                    }
                });
                await tx.workflowStep.update({
                    where: {
                        id: targetStep.id,
                    },
                    data: {
                        order: targetStep.order,
                    }
                });
                const updatedSteps = await tx.workflowStep.findMany({
                    where: {
                        workflowId,
                    },
                    orderBy: {
                        order: "asc",
                    }
                })
                return {
                    move: true,
                    message: "Step moved successfully",
                    steps: updatedSteps,
                };
            }
        });
        return res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({ message: "Could not find workflow" });
            }
            if (error.message === "STEP_NOT_FOUND") {
                return res.status(404).json({ message: "Could not find step" });
            }
            if (error.message === "STEP_MISMATCH") {
                return res.status(400).json({ message: "This step doesn't belong to this workflow" });
            }
            if (error.message === "DIRECTION_MUST_BE_UP_OR_DOWN") {
                return res.status(400).json({ message: "Direction must be up or down" });
            }
            if (error.message === "INDEX_NOT_FOUND") {
                return res.status(404).json({ message: "Index not found" });
            }
        }

        console.error("Failed to move step", error);
        return res.status(500).json({ message: "Failed to move step" })
    }

});

app.get("/submissions", async (_req, res) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                answers: true,
            },
        });
        return res.status(200).json(submissions);
    }
    catch (error) {
        console.error("No submission found", error);
        return res.status(500).json({ message: "No submission found" });
    }
})

app.post("/submissions", async (req, res) => {

    try {
        //Validate the entire request body before prisma uses any of its values
        const validation = createSubmissionSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid submission data",
                errors: validation.error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message
                })),
            });
        }
        //Define workflow Id and valid answer after validation by Zod
        const { workflowId, answers: validAnswer } = validation.data;
        const workflow = await prisma.workflow.findUnique({
            where: {
                id: workflowId,
            },
            include: {
                steps: true,
            }
        });
        //We check if the workflow exists 
        if (!workflow) return res.status(404).json({
            message: "Failed to find workflow"
        });
        //Reject a workflow with no steps
        if (workflow.steps.length === 0) {
            return res.status(400).json({
                message: "Cannot submit workflow with no steps"
            });
        }
        const submittedStepIds = Object.keys(validAnswer);

        const workflowStepIds = workflow.steps.map(step => step.id);

        //We check if every submitted answer belongs to this workflow
        const invalidStepIds = submittedStepIds.filter((stepId) =>
            !workflowStepIds.includes(stepId));
        //Check if every workflow step belongs to the submitted steps
        const missingStepIds = workflowStepIds.filter((stepId) =>
            !submittedStepIds.includes(stepId));

        if (invalidStepIds.length > 0 || missingStepIds.length > 0) {
            return res.status(400).json({
                message: "Submitted answers do not match this workflow",
                missingStepIds,
                invalidStepIds,
            });
        }
        const newSubmission = await prisma.submission.create({
            data: {
                workflowId,
                status: "submitted",
                answers: {
                    create: Object.entries(validAnswer).map(([stepId, value]) => ({
                        value,
                        step: {
                            connect: {
                                id: stepId,
                            },
                        },
                    })),
                },
            },
            include: {
                answers: true,
            }
        });
        return res.status(201).json({
            message: "Submission succeeded",
            newSubmission,
        });
    }
    catch (error) {
        console.error("Failed to submit answer", error);
        return res.status(500).json({ message: "Failed to submit answer" });
    }
})

app.get("/submissions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const submission = await prisma.submission.findUnique({
            where: {
                id,
            },
            include: {
                answers: true,
            }
        });

        if (!submission) return res.status(404).json({ message: "Submission not found" });

        return res.status(200).json(submission);
    }
    catch (error) {
        console.error("Unable to find the submission", error);
        return res.status(500).json({ message: "Unable to find the submission" });

    }
})

app.patch("/submissions/:id/status", async (req, res) => {

    try {
        const idValidation = submissionIdSchema.safeParse(req.params);
        if (!idValidation.success) return res.status(400).json({
            message: "id must be cuid type",
            errors: idValidation.error.issues.map((issue) => ({
                //Shows the id
                path: issue.path.join("."),
                //Zod's explanation of what is invalid
                message: issue.message,
            })),
        });
        const { id } = idValidation.data;

        //Zod validates the json request body before we can use the status
        //The status are exactly: "in_review", "approved", "rejected"
        const validation = updateSubmissionStatusSchema.safeParse(req.body);

        //If zod finds an invalid request data, return 400 Bad Request
        if (!validation.success) return res.status(400).json({
            message: "Status must be in_review or approved or rejected",
            errors: validation.error.issues.map((issue) => ({
                //Shows where the validation problem happened
                path: issue.path.join("."),
                //Shows Zod's explanation of the problem
                message: issue.message,
            })),
        });
        //We use the validated value now
        const { status } = validation.data

        //Check if a submission exists with the request's id
        const submission = await prisma.submission.findUnique({
            where: {
                id,
            }
        })
        if (!submission) return res.status(404).json({ message: "No submission found" });

        const updatedSubmission = await prisma.submission.update({
            where: {
                id,
            },
            data: {
                status: status,
            }
        })
        return res.status(200).json({
            message: "Status changed",
            updatedSubmission,
        })
    }
    catch (error) {
        console.error("Failed to update status", error);
        return res.status(500).json({ message: "Failed to update status" });
    }

})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
