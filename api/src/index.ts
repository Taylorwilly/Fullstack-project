
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as z from "zod";
import argon2 from "argon2";
import * as jwt from "jsonwebtoken";


dotenv.config();

//Retrieve the secret token from .env or stop the server if it's not configured
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET not configured");
const requiredJwtSecret: string = jwtSecret


const app = express();
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

//A string is valid only when it contains at least one character
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

//Describe the identity information we place inside a verified JWT
type AuthenticatedUser = {
    userId: string;
    role: string;
};

//Add an optional typescript declaration-merging block
//It's job is to tell typescript that Express Request object 
//are allowed to have authenticatedUser? : AuthenticatedUser
declare global {
    namespace Express {
        interface Request {
            authenticatedUser?: AuthenticatedUser;
        }
    }
}

//This middleware check the authentication of user
//It checks the JWT sent in the authorization header
//If the token is valid, it attaches the user's verified identity to req
//and calls next() so express can continue to the next protected route
function requireAuth(req: Request, res: Response, next: NextFunction) {
    //Read the authorization header sent with the request
    //Expected format: Authorization: Bearer <token>
    const authorizationHeader = req.headers.authorization;
    //Stop the request if no token was sent or does not meet the required format
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token is required for client",
        })
    }
    //Split "Bearer <token>" and take the second element which is the token
    const token = authorizationHeader.split(" ")[1];

    try {
        //Verify that the token was signed by this backend JWT secret and has not expired
        const decodedToken = jwt.verify(token, requiredJwtSecret);

        if (typeof decodedToken !== "object"
            || decodedToken === null
            || typeof decodedToken.userId !== "string"
            || typeof decodedToken.role !== "string") {
            return res.status(401).json({
                message: "Invalid authentication token",
            })
        }
        //Create a typed object containing only the identity data that protected routes need
        const authenticatedUser: AuthenticatedUser = {
            userId: decodedToken.userId,
            role: decodedToken.role,
        };
        //Attached the verified identify to this specific request
        //that we will pass to the next function in the route
        req.authenticatedUser = authenticatedUser;
        //Authentication succeeded, so continue to the next route
        return next();
    }
    catch (error) {
        //jwt.verify throws when the token is expired, //
        // modified, malformed or signed with different secret
        console.error("Invalid or expired token", error);

        return res.status(401).json({
            message: "Invalid or expired token"
        })
    }
};

//This middleware function checks if the person logged-in is an admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.authenticatedUser) {
        return res.status(401).json({
            message: "Authentication is required",
        })
    }

    if (req.authenticatedUser.role !== "ADMIN") {
        return res.status(403).json({
            message: "Access forbidden"
        })
    }
    return next();
}

//Text the authenticator
app.get("/auth/test", requireAuth, (req, res) => {
    if (!req.authenticatedUser) {
        return res.status(401).json({ message: "Authentication token is required" });
    }

    const userId = req.authenticatedUser.userId;
    const role = req.authenticatedUser.role;
    return res.status(200).json({
        message: "Authentication succeeded",
        userId,
        role,
    });
});

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
        //Generate the sign in token
        const token = jwt.sign(
            { userId: existingUser.id, role: existingUser.role },
            jwtSecret,
            { expiresIn: "1h" },
        );
        return res.status(200).json({
            message: "Login succeeds",
            token,
            user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
            },
        });
    }
    catch (error) {
        console.error("Failed to login", error);

        return res.status(500).json({
            message: "Failed to login"
        });
    }
});

app.get("/workflows", async (req, res) => {
    //We ask prisma to find workflow in postgres
    //since we migrate from array storage to database 
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

//Route for creating workflows
app.post("/workflows", requireAuth, requireAdmin, async (req, res) => {
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
                },
                pages: {
                    orderBy: {
                        order: "asc"
                    },
                    include: {
                        fields: {
                            orderBy: {
                                order: "asc",
                            }
                        }
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

//Patching the protected workflow/:id 
//Only the admin can update the workflows
app.patch("/workflows/:id", requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "You must enter a name" });

    try {
        if (typeof id !== "string") {
            return res.status(400).json({
                message: "Workflow Id must be a string"
            });
        }
        //Make sure the workflow exits before updating it
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
app.delete("/workflows/:id", requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        if (typeof id !== "string") {
            return res.status(400).json({ message: "Workflow Id must be a string" })
        }
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
app.post("/workflows/:id/steps", requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "Step title is required" });
    }
    //We find the corresponding workflow in the database
    try {
        if (typeof id !== "string") {
            return res.status(400).json({ message: "Workflow Id must be a string" })
        }
        const existingWorkflow = await prisma.workflow.findUnique({
            where: {
                id,
            },
        });
        if (!existingWorkflow) return res.status(404).json({
            message: "Workflow not found"
        });
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
//Admin can edit workflow steps
app.patch("/workflows/:workflowId/steps/:stepId", requireAuth, requireAdmin, async (req, res) => {
    const { workflowId, stepId } = req.params;
    const { title } = req.body;

    try {
        if (typeof stepId !== "string" || typeof workflowId !== "string") {
            return res.status(400).json({
                message: "Workflow Id and step Is must be string"
            })
        }
        if (typeof title !== "string" || !title.trim())
            return res.status(400).json({
                message: "The title is required"
            });

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

        if (!step)
            return res.status(404).json({
                message: "Step not found"
            });

        //Prevent using a step from another workflow
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
app.delete("/workflows/:workflowId/steps/:stepId", requireAuth, requireAdmin, async (req, res) => {
    const { workflowId, stepId } = req.params;
    //We check if the specified workflow exists in the the database
    try {
        if (typeof stepId !== "string" || typeof workflowId !== "string") {
            return res.status(400).json({ message: "Workflow Id must be a string" })
        }
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
                return res.status(400).json({ message: "The workflows mismatch" });
            }
        }
        console.error("Failed to delete step", error);
        return res.status(500).json({ message: "Failed to delete step" });
    }
});
//Here we are moving a step up or down
app.patch("/workflows/:workflowId/steps/:stepId/move", requireAuth, requireAdmin, async (req, res) => {
    const { workflowId, stepId } = req.params;
    const { direction } = req.body;

    try {
        if (typeof stepId !== "string" || typeof workflowId !== "string") {
            return res.status(400).json({ message: "Workflow Id must be a string" })
        }

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

//Submission list page route protected from view
app.get("/submissions", requireAuth, async (req, res) => {

    if (!req.authenticatedUser) {
        return res.status(401).json({
            message: "Authentication token is required"
        });
    }
    const userId = req.authenticatedUser.userId;
    try {
        const submissions = await prisma.submission.findMany({
            where: {
                userId,
            },
            include: {
                answers: true,
            },
        });
        return res.status(200).json(submissions);
    }
    catch (error) {
        console.error("Failed to retrieve submissions", error);
        return res.status(500).json({ message: "Failed to retrieve submissions" });
    }
})

//Admin submissions route
app.get("/admin/submissions", requireAuth, requireAdmin, async (_req, res) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                answers: true,
            }
        })
        return res.status(200).json(submissions);
    }
    catch (error) {
        console.error("Failed to retrieve submissions", error);
        return res.status(500).json({
            message: "Failed to retrieve submissions",
        })
    }
})

app.get("/admin/submissions/:id", requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;

    if (typeof id !== "string") {
        return res.status(400).json({
            message: "Submission ID must be a string"
        });
    }
    try {
        const submission = await prisma.submission.findUnique({
            where: {
                id,
            },
            include: {
                answers: true,
                activities: {
                    orderBy: {
                        createdAt: "asc",
                    },
                }
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

//Submission protected
app.post("/submissions", requireAuth, async (req, res) => {

    if (!req.authenticatedUser) {
        return res.status(401).json({ message: "Authentication token is required" });
    }

    const userId = req.authenticatedUser.userId;

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

        const result = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.findUnique({
                where: {
                    id: workflowId,
                },
                include: {
                    steps: true,
                }
            });
            //We check if the workflow exists 
            if (!workflow) {
                throw new Error("WORKFLOW_NOT_FOUND");
            }
            //Reject a workflow with no steps
            if (workflow.steps.length === 0) {
                throw new Error("WORKFLOW_HAS_NO_STEPS");
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
                throw new Error("SUBMISSION_ANSWER_DOES_NOT_MATCH_THIS_WORKFLOW");
            };

            const newSubmission = await tx.submission.create({
                data: {
                    userId,
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
            // Create log row in the database
            await tx.submissionActivity.create({
                data: {
                    userId,
                    submissionId: newSubmission.id,
                    action: "SUBMITTED",
                    oldStatus: null,
                    newStatus: "submitted",
                }
            });
            return newSubmission;

        });
        return res.status(201).json({
            message: "Submission succeeded",
            newSubmission: result,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({ message: "The workflow could not be found" });
            }
            if (error.message === "WORKFLOW_HAS_NO_STEPS") {
                return res.status(400).json({ message: "Cannot submit workflow with no steps" });
            }
            if (error.message === "SUBMISSION_ANSWER_DOES_NOT_MATCH_THIS_WORKFLOW") {
                return res.status(400).json({ message: "Submitted answers do not match this workflow" });
            }
        }
        console.error("Failed to submit answer", error);
        return res.status(500).json({ message: "Failed to submit answer" });
    }
})

//Submission detail page protected from view
//Only the owner should be able to open it
app.get("/submissions/:id", requireAuth, async (req, res) => {
    if (!req.authenticatedUser) {
        return res.status(401).json({ message: "Authentication token is required" });
    }
    const userId = req.authenticatedUser.userId;
    const submissionId = req.params.id;
    if (typeof submissionId !== "string") {
        return res.status(400).json({ message: "Invalid submission ID" });
    }

    try {
        const submission = await prisma.submission.findFirst({
            where: {
                //Match both the submission and its owner
                id: submissionId,
                userId
            },
            include: {
                answers: true,
                activities: {
                    orderBy: {
                        createdAt: "asc",
                    }
                }
            }
        });
        //Also returns 404 when the submission belongs to someone else
        if (!submission) return res.status(404).json({ message: "Submission not found" });

        return res.status(200).json(submission);
    }
    catch (error) {
        console.error("Unable to find the submission", error);
        return res.status(500).json({ message: "Unable to find the submission" });

    }
})

//Only an admin can update the status
app.patch("/submissions/:id/status", requireAuth, requireAdmin, async (req, res) => {
    if (!req.authenticatedUser) {
        return res.status(401).json({ message: "Authentication token is required" });
    }
    const userId = req.authenticatedUser.userId;
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


        // Start a transaction
        const result = await prisma.$transaction(async (tx) => {

            //Check if a submission exists with the request's id
            const submission = await tx.submission.findUnique({
                where: {
                    id,
                }
            })
            if (!submission) throw new Error("SUBMISSION_NOT_FOUND");

            const updatedSubmission = await tx.submission.update({
                where: {
                    id,
                },
                data: {
                    status,
                }
            });

            await tx.submissionActivity.create({
                data: {
                    action: "STATUS_CHANGED",
                    oldStatus: submission.status,
                    newStatus: updatedSubmission.status,
                    userId,
                    submissionId: updatedSubmission.id,
                }
            })
            return updatedSubmission;
        })
        return res.status(200).json({
            message: "Status changed",
            updatedSubmission: result,
        })
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "SUBMISSION_NOT_FOUND") {
                return res.status(404).json({ message: "Submission not found" });
            }
        }
        console.error("Failed to update status", error);
        return res.status(500).json({ message: "Failed to update status" });
    }

})

// Create workflow pages
app.post("/workflows/:workflowId/pages", requireAuth, requireAdmin, async (req, res) => {

    const { workflowId } = req.params;
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            message: "The title is required.",
        });
    }

    if (typeof workflowId !== "string") {
        return res.status(400).json({
            message: "WorkflowId must be a string."
        })
    }

    try {
        const page = await prisma.$transaction(async (tx) => {
            const existingWorkflow = await tx.workflow.findUnique({
                where: {
                    id: workflowId,
                }
            });

            if (!existingWorkflow) {
                throw new Error("WORKFLOW_NOT_FOUND");
            }

            const lastWorkflow = await tx.workflowPage.findFirst({
                where: {
                    workflowId,
                },
                orderBy: {
                    order: "desc"
                }
            })

            const createdPage = await tx.workflowPage.create({
                data: {
                    workflowId,
                    title,
                    order: lastWorkflow ? lastWorkflow.order + 1 : 1,
                },
            });
            return createdPage;
        })
        return res.status(201).json({
            message: "Workflow page created successfully",
            page,
        })
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({
                    message: "Workflow not found",
                })
            }
        }
        console.error("Workflow page not created", error);

        return res.status(500).json({
            message: "Failed to create the workflow page",

        });
    }
});

//Update pages
app.patch("/workflows/:workflowId/pages/:pageId", requireAuth, requireAdmin, async (req, res) => {
    const { workflowId, pageId } = req.params;

    const { title } = req.body;

    if (typeof workflowId !== "string" || typeof pageId !== "string") {
        return res.status(400).json({
            message: "The workflow Id and page Id must be string",
        });
    }
    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            message: "The title is required",
        })
    }

    try {
        const existingWorkflow = await prisma.workflow.findUnique({
            where: {
                id: workflowId,
            }
        });

        if (!existingWorkflow) {
            return res.status(404).json({ message: "Workflow not found" })
        }

        const existingPage = await prisma.workflowPage.findUnique({
            where: {
                id: pageId,
            }
        }
        );

        if (!existingPage) {
            return res.status(404).json({
                message: "Workflow page not found",
            })
        }

        if (existingPage.workflowId !== workflowId) {
            return res.status(400).json({
                message: "This page does not belong to this workflow"
            });
        }

        const updatedPage = await prisma.workflowPage.update({
            where: {
                id: pageId
            },
            data: {
                title: title.trim(),
            }
        });

        return res.status(200).json({
            message: "Page updated successfully",
            page: updatedPage,
        });
    }
    catch (error) {
        console.error("Failed to update page", error);
        return res.status(500).json({
            message: "Failed to update page",
        });
    }
});

//Delete pages
app.delete("/workflows/:workflowId/pages/:pageId", requireAuth, requireAdmin, async (req, res) => {
    const { workflowId, pageId } = req.params;

    if (typeof workflowId !== "string" || typeof pageId !== "string") {
        return res.status(400).json({
            message: "The workflow Id and page Id must be strings"
        })
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.findUnique({
                where: {
                    id: workflowId
                }
            });

            if (!workflow) {
                throw new Error("WORKFLOW_NOT_FOUND");
            }

            const page = await tx.workflowPage.findUnique({
                where: {
                    id: pageId,
                }
            });

            if (!page) {
                throw new Error("PAGE_NOT_FOUND");
            }

            if (page.workflowId !== workflowId) {
                throw new Error("THIS_PAGE_DOES_NOT_BELONG_TO_THIS_WORKFLOW");
            }


            const deletedPage = await tx.workflowPage.delete({
                where: {
                    id: pageId,
                }
            });

            const remainingPages = await tx.workflowPage.findMany({
                where: {
                    workflowId,
                },
                orderBy: {
                    order: "asc"
                }
            });

            const updatedOrder = [];

            for (const [index, page] of remainingPages.entries()) {
                const newOrder = index + 1;

                if (page.order === newOrder) {
                    updatedOrder.push(page);
                    continue;
                }

                const updatedPage = await tx.workflowPage.update({
                    where: {
                        id: page.id
                    },
                    data: {
                        order: newOrder,
                    }
                })
                updatedOrder.push(updatedPage);
            }

            return { deletedPage, updatedOrder };
        });
        return res.status(200).json({
            message: "Page deleted successfully",
            deletedPage: result.deletedPage,
            updatedPages: result.updatedOrder,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({ message: "Workflow not found" });
            }
            if (error.message === "PAGE_NOT_FOUND") {
                return res.status(404).json({ message: "Page not found" });
            }
            if (error.message === "THIS_PAGE_DOES_NOT_BELONG_TO_THIS_WORKFLOW") {
                return res.status(400).json({ message: "Page mismatch" });
            }
        }

        console.error("Failed to delete page", error);

        return res.status(500).json({ message: "Failed to delete page" });
    }
});

//Create fields
app.post("/workflows/:workflowId/pages/:pageId/fields", requireAuth, requireAdmin, async (req, res) => {
    //Get workflow ID and page ID from the URL
    const { workflowId, pageId } = req.params;
    //Get field label from request
    const { label } = req.body;

    if (typeof workflowId !== "string" || typeof pageId !== "string") {
        return res.status(400).json({
            message: "The workflow Id and page Id must be strings",
        });
    }

    if (typeof label !== "string" || !label.trim()) {
        return res.status(400).json({
            message: "The label is required"
        })
    }

    try {
        //Start a transaction because to create a field needs checking 
        // the workflow, the page, and calculating the next order
        const result = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.findUnique({
                where: {
                    id: workflowId,
                }
            });

            if (!workflow) {
                throw new Error("WORKFLOW_NOT_FOUND");

            }

            const page = await tx.workflowPage.findUnique({
                where: {
                    id: pageId,
                }
            });

            if (!page) {
                throw new Error("PAGE_NOT_FOUND");
            }

            if (page.workflowId !== workflowId) {
                throw new Error("PAGE_MISMATCH");
            }

            const lastField = await tx.workflowField.findFirst({
                where: {
                    pageId,
                },
                orderBy: {
                    order: "desc",
                }
            });
            //Create a new field and give it order 1 if there are not fields yet
            //Otherwise it becomes the next order number
            const fieldCreated = await tx.workflowField.create({
                data: {
                    pageId,
                    label: label.trim(),
                    order: lastField ? lastField.order + 1 : 1,
                }
            });

            return fieldCreated;
        });
        return res.status(201).json({
            message: "Field created successfully",
            field: result,
        })
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({
                    message: "No workflow found",
                });
            }
            if (error.message === "PAGE_NOT_FOUND") {
                return res.status(404).json({
                    message: "No page found",
                });
            }
            if (error.message === "PAGE_MISMATCH") {
                return res.status(400).json({
                    message: "This page does not belong to this workflow",
                });
            }
        }

        console.error("Failed to create field", error);

        return res.status(500).json({
            message: "Failed to create field",
        })

    }
});

// Update fields
app.patch("/workflows/:workflowId/pages/:pageId/fields/:fieldId", requireAuth, requireAdmin, async (req, res) => {

    const { workflowId, pageId, fieldId } = req.params;
    const { label } = req.body;

    if (typeof workflowId !== "string"
        || typeof pageId !== "string"
        || typeof fieldId !== "string") {
        return res.status(400).json({
            message: "Workflow ID, page ID, and field ID must be strings"
        })
    };

    if (typeof label !== "string" || !label.trim()) {
        return res.status(400).json({
            message: "Label is required",
        })
    }

    try {

        const workflow = await prisma.workflow.findUnique({
            where: {
                id: workflowId,
            }
        });
        if (!workflow) {
            return res.status(404).json({
                message: "Workflow not found",
            })
        }

        const page = await prisma.workflowPage.findUnique({
            where: {
                id: pageId,
            }
        });
        if (!page) {
            return res.status(404).json({
                message: "Page not found",
            })
        }

        if (page.workflowId !== workflowId) {
            return res.status(400).json({
                message: "This page does not belong to this workflow",
            })
        }

        const field = await prisma.workflowField.findUnique({
            where: {
                id: fieldId,
            }
        });
        if (!field) {
            return res.status(404).json({
                message: "Field not found",
            });
        }

        if (field.pageId !== pageId) {
            return res.status(400).json({
                message: "This field does not belong to this page",
            })
        }

        const updatedField = await prisma.workflowField.update({
            where: {
                id: fieldId,
            },
            data: {
                label: label.trim(),
            }
        });

        return res.status(200).json({
            message: "Field updated successfully",
            field: updatedField,
        })
    }
    catch (error) {
        console.error("Failed to update the field", error);
        return res.status(500).json({
            message: "Failed to update the field",
        });
    }

});

app.delete("/workflows/:workflowId/pages/:pageId/fields/:fieldId", requireAuth, requireAdmin, async (req, res) => {
    const { workflowId, pageId, fieldId } = req.params;

    if (typeof workflowId !== "string"
        || typeof pageId !== "string"
        || typeof fieldId !== "string") {
        return res.status(400).json({
            message: "Workflow ID, page ID, and field ID must be strings"
        })
    };

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

            const page = await tx.workflowPage.findUnique({
                where: {
                    id: pageId,
                }
            });
            if (!page) {
                throw new Error("PAGE_NOT_FOUND");
            }

            if (page.workflowId !== workflowId) {
                throw new Error("PAGE_MISMATCH");
            }

            const field = await tx.workflowField.findUnique({
                where: {
                    id: fieldId,
                }
            });
            if (!field) {
                throw new Error("FIELD_NOT_FOUND");
            }

            if (field.pageId !== pageId) {
                throw new Error("FIELD_MISMATCH");
            }

            const deletedField = await tx.workflowField.delete({
                where: {
                    id: fieldId,
                }
            });

            const remainingFields = await tx.workflowField.findMany({
                where: {
                    pageId,
                },
                orderBy: {
                    order: "asc",
                }
            });

            const updatedOrder = [];

            for (const [index, field] of remainingFields.entries()) {
                const newOrder = index + 1;

                if (field.order === newOrder) {
                    updatedOrder.push(field);
                    continue;
                };

                const updatedField = await tx.workflowField.update({
                    where: {
                        id: field.id,
                    },
                    data: {
                        order: newOrder,
                    }
                });
                updatedOrder.push(updatedField);
            }

            return { deletedField, updatedOrder };
        });
        return res.status(200).json({
            message: "Field deleted successfully",
            deletedField: result.deletedField,
            field: result.updatedOrder,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "WORKFLOW_NOT_FOUND") {
                return res.status(404).json({
                    message: "Workflow not found",
                })
            }
            if (error.message === "PAGE_NOT_FOUND") {
                return res.status(404).json({
                    message: "Page not found",
                })
            }
            if (error.message === "PAGE_MISMATCH") {
                return res.status(400).json({
                    message: "This page does not belong to this workflow",
                })
            }
            if (error.message === "FIELD_NOT_FOUND") {
                return res.status(404).json({
                    message: "Field not found",
                })
            }
            if (error.message === "FIELD_MISMATCH") {
                return res.status(400).json({
                    message: "This field does not belong to this page",
                })
            }
        };

        console.error("Failed to delete field", error);
        return res.status(500).json({
            message: "Failed to delete field",
        })

    }

})


const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`API is running on port ${PORT}`);
});
