# Intakeflow

This is a fullstack application for creating workflows and submit forms.This project is inspired by modern form and intake products used by insurance, onboarding, and client-service teams.

**Current status:** Core backend, database, authentication, authorization, workflow management, and submission routes are implemented. The browser registration and login are being connected to the protected API workflow.

## What intakeflow does
- Lets administrators create, rename, delete, and organize intake workflows.
- Lets admin add, update, delete, and reorder workflow steps
- Lets clients register, sign in, complete workflows, and view only their submissions
- Lets admin review all submissions and update a submission review status
- Protects sensitive API routes with JWT authentication and role-based authorization

## Technology Stack

Area               Technology
----               ----------
Frontend           Next.js App Router, React, Typescript, Tailwind CSS
Backend            Node.js, Express, Typescript
Database           PostgreSQL
ORM                Prisma
Validation         Zod
Password security  Argon2
Authentication     JSON Web Token
Local development  PowerShell, VS Code, Prisma Studio

## Architecture

```text
Browser (Next.js / React, localhost:3000)
        |
        | HTTP requests with JSON
        v
Express API (localhost:4000)
        |
        | Prisma client
        V
PostgreSQL database (intakeflow)
```

For protected requests, the browser sends a JWT in the `Authorization` header:
```text
Authorization: Bearer <token>
```

The Express `requireAuth` middleware verifies the token, attaches the authenticated user's ID and role to the request, and then allows the route handler to continue.

## Main Features 

### Workflow management
- Public workflow list and workflow detail routes for clients to load available forms.
- Admin-only workflow creation, rename, deletion.
- Admin-only step creation, update, deletion, and move ip/down controls.
- Step deletion uses a prisma transaction to normalize the order of remaining steps.

### Submission management
- Authenticated clients clients create submissions with their identity taken from verified JWT, not from the request body.
- Clients can list only their submissions.
- Clients can open only their submission details.
- Admin can update review status such as `in_review`, `approved`, `rejected`.

### Authentication and authorization
- Client-only public registration with Zod validation.
- Argon2 password hashing before the password is store.
- Duplicate email detection.
- Login validates password with `argon2.verify`.
- JWT includes `userId` and `role` and currently expired after one hour.
- `requireAuth` verifies the JWT signature and expiry
- `requireAdmin` blocks authenticated users who are not administrators.
- Admin role is never accepted from the public registration request.


## API ROUTES

### Public routes
| Method | Route | Purpose |
| ---| --- | --- |
| GET | `/health` | Simple API health check |
| POST | `/auth/register` | Create a client account |
| POST | `/auth/login` | Verify credentials and return a JWT plus safe user data |
| GET | `/workflows` | List workflow available to clients |
 GET | `/workflows/:id` | Load one workflow and its steps |

 ### Authenticated client routes
 | Method | Route | Purpose |
| ---| --- | --- |
| GET | `/auth/me` | Test a token and return the authenticated user ID and role | 
| POST | `/submissions` | Create a submission for the authenticated client |
| GET | `/submissions` | Return only the authenticated client submissions |
| GET | `submissions/:id` | Return one submission only when it belongs to authenticated client |

### Administrator-only routes
| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/workflows` | Create a workflow |
| PATCH | `/workflows/:id` | Rename a workflow |
| DELETE | `/workflow/:id` | Delete a workflow |
| POST | `/workflow/:id/steps` | Add a workflow step |
| PATCH | `/workflows/:workflowId/steps/:stepId` | Update a step title |
| DELETE | `/workflows/:workflowId/steps/:stepId` | Delete a step and normalize step order |
| PATCH | `/workflows/:workflowId/steps/:stepId/move` | Move a step up or down |
| GET | `/admin/submissions` | Review all submissions |
| PATCH | `/submissions/:id/:status` | Update submission review status |


## Authentication Flow

```text
1. Client registers with name, email, and password.
2. The API validates the body and hashes the password with Argon2.
3. PostgreSQL creates a User record with default client role
4. Client signs in with email and password.
5. The API verifies credentials and creates a JWT containing userId and role.
6. The frontend saves the token in browser localStorage for this learning version.
7. The frontend redirects based on the return role:
   - ADMIN -> /admin/workflows
   - CLIENT -> /portal/start
8. A protected page retrieves the token and sends it as a bearer token.
9. requireAuth verifies the token before the protected route runs.
10. requireAdmin checks whether the verified role is ADMIN.
```
The frontend redirect improves the user experience. The backend authorization middleware remains the real security boundary bacause a user can manually type any frontend URL.  

## Frontend Pages

| Page | Purpose | Status |
| --- | --- | --- |
| `/register` | client account registration with confirm-password check | Implemented |
| `/login` | Login, token storage, role-based redirect | Implemented |
| `/portal/start` | Client starting point for choosing a workflow | Implemented |
| `/submit/[workflowId]` | Complete and submit a workflow | Implemented |
| `/my_submission/[submissionId]` | View an individual client submission | Implemented |
| `/admin/workflows` | Admin workflow management workspace | Implemented |
| `/admin/submissions` | Admin submission review workspace | Implemented |

## Project Structure
```text
Fullstack-project/
        api/
                prima/
                        schema.prisma
                src/
                        index.ts
                .env    
                package.json

        web/
                app/
                        admin/
                        login/
                        register/
                        portal/
                        submit/
                        my_submissions/
                        
                components/
                package.json
        README.md
```

## Local Setup

### Prerequisites
- Node.js 22 or later
- PostgreSQL running locally on port 5432
- A database named `intakeflow`
- npm

### Backend setup

Create `api/.env` without commiting it to git:

```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/intakeflow"
JWT_SECRET="random-secret"
PORT=4000
```
Then run:
```bash
cd api
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

The API runs locally at `http://localhost:4000` 
and publicly at `https://intakeflow-api-w3xt.onrender.com`

Optional database inspection:
```bash
npx prisma studio
```

### Frontend setup 
```bash
cd web
npm install
npm run dev
```
The frontend runs locally at `http://localhost:3000` 
and publicly at `https://intakeflow-workflows.vercel.app`

## Manual Testing Completed
The backend has been tested from PowerShell with requests for the following cases:

- Invalid registration data returns HTTP 400.
- Successful registration returns HTTP 201 without exposing `passwordHash`.
- Duplicate registration returns HTTP 409.
- Valid login returns HTTP 200 with 200 JWT and safe user data.
- Missing token returns HTTP 401.
- Modified or expired token returns 401.
- A client calling an admin route receives HTTP 403.
- An administrator can use workflow and submission review routes.
- A client cannot retrieve another client's submission; the API returns HTTP 404.




## Next Steps