# IntakeFlow

IntakeFlow is a full-stack client intake application for creating multi-page workflows, collecting client information, and reviewing submissions.

I started this project to get more experience building a complete application from the database to the frontend. I wanted to build something more realistic than a basic CRUD app, so IntakeFlow includes authentication, different user roles, configurable workflows, submission validation, status tracking, and deployment.

## Live Demo

Frontend:  
https://intakeflow-workflows.vercel.app

API:  
https://intakeflow-api-w3xt.onrender.com

---

## What IntakeFlow Does

There are two main types of users: clients and administrators.

### Administrators can

- Create, rename, and delete workflows
- Add pages to a workflow
- Rename, reorder, and delete pages
- Add and edit fields inside each page
- Make fields required or optional
- Add placeholders and help text
- Review client submissions
- Change submission status
- View submission activity history

### Clients can

- Register and log in
- View available workflows
- Complete a workflow one page at a time
- Move between pages before submitting
- See their progress through the form
- Submit their answers
- View their previous submissions
- Check the status of a submission

Clients can only access their own submissions.

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | JWT |
| Password hashing | Argon2 |
| Database hosting | Neon |
| Frontend hosting | Vercel |
| API hosting | Render |

---

## How the Workflow Builder Works

A workflow contains pages, and each page contains fields.

For example:

```text
Client Intake
│
├── Personal Information
│   ├── First Name
│   ├── Last Name
│   └── Date of Birth
│
├── Contact Information
│   ├── Email
│   └── Phone
│
└── Additional Information
    └── Notes
```

The current data model supports fields such as:

```text
TEXT
TEXTAREA
NUMBER
DATE
EMAIL
PHONE
RADIO
SELECT
CHECKBOX
```

The client form is still being improved so every field type has its own rendering and validation behavior.

---

## Submission Flow

When a client opens a workflow, the frontend loads the pages and fields from the API.

The client completes the form page by page:

```text
Choose Workflow
      ↓
Page 1
      ↓
Page 2
      ↓
Final Page
      ↓
Submit
```

The frontend sends the answers to the backend using field IDs.

The backend then checks that:

- the workflow exists
- the submitted fields belong to that workflow
- required fields are present
- required values are not blank
- invalid field IDs are rejected
- the user creating the submission is the authenticated user

The backend does not trust a user ID sent from the browser. The client identity comes from the verified JWT.

---

## Submission Transactions

Creating a submission requires several related database operations.

The backend uses a Prisma transaction to create:

```text
Submission
    +
Submission Answers
    +
Submission Activity
```

This prevents a submission from being partially created if one of those operations fails.

Status changes are also recorded in the activity history.

---

## Authentication and Authorization

Users register with their name, email, and password.

Passwords are hashed with Argon2 before they are stored.

After login, the API returns a JWT containing the authenticated user's ID and role.

Protected requests send the token using:

```text
Authorization: Bearer <token>
```

The backend uses `requireAuth` to verify the token and `requireAdmin` to protect administrator routes.

The frontend also redirects users based on their role, but the backend middleware is the real security check.

For this version of the project, the JWT is stored in `localStorage`.

---

## Main API Routes

### Authentication

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register a client |
| POST | `/auth/login` | Log in and receive a JWT |
| GET | `/auth/test` | Test authentication |

### Workflows

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/workflows` | List workflows |
| GET | `/workflows/:id` | Get one workflow with its pages and fields |
| POST | `/workflows` | Create a workflow |
| PATCH | `/workflows/:id` | Update a workflow |
| DELETE | `/workflows/:id` | Delete a workflow |

### Pages

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/workflows/:workflowId/pages` | Add a page |
| PATCH | `/workflows/:workflowId/pages/:pageId` | Update a page |
| PATCH | `/workflows/:workflowId/pages/:pageId/move` | Move a page |
| DELETE | `/workflows/:workflowId/pages/:pageId` | Delete a page |

### Fields

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/workflows/:workflowId/pages/:pageId/fields` | Add a field |
| PATCH | `/workflows/:workflowId/pages/:pageId/fields/:fieldId` | Update a field |
| DELETE | `/workflows/:workflowId/pages/:pageId/fields/:fieldId` | Delete a field |

### Submissions

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/submissions` | Create a submission |
| GET | `/submissions` | Get the logged-in client's submissions |
| GET | `/submissions/:id` | Get one client submission |
| GET | `/admin/submissions` | Get all submissions as an admin |
| GET | `/admin/submissions/:id` | Get submission details as an admin |
| PATCH | `/submissions/:id/status` | Update submission status |

---

## Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/register` | Client registration |
| `/login` | Login |
| `/portal/start` | Choose a workflow |
| `/submit/[workflowId]` | Complete a workflow |
| `/my_submissions/[submissionId]` | View a client submission |
| `/admin/workflows` | Manage workflows |
| `/admin/workflows/[id]` | Manage pages and fields |
| `/admin/submissions` | Review submissions |
| `/admin/submissions/[submissionId]` | Review one submission |

---

## Project Structure

```text
Fullstack-project/
│
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   └── index.ts
│   └── package.json
│
├── web/
│   ├── app/
│   │   ├── admin/
│   │   ├── login/
│   │   ├── register/
│   │   ├── portal/
│   │   ├── submit/
│   │   └── my_submissions/
│   ├── components/
│   └── package.json
│
└── README.md
```

---

## Running the Project Locally

### Backend

```bash
cd api
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

Create an `api/.env` file with values similar to:

```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/intakeflow"
JWT_SECRET="<your-secret>"
PORT=4000
```

The API runs at:

```text
http://localhost:4000
```

To inspect the database with Prisma Studio:

```bash
npx prisma studio
```

### Frontend

```bash
cd web
npm install
npm run dev
```

Create `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The frontend runs at:

```text
http://localhost:3000
```

---

## Testing

I have manually tested the API using PowerShell requests.

Some of the cases tested include:

- invalid registration data
- duplicate email registration
- successful login
- missing or invalid JWTs
- clients trying to access admin routes
- clients trying to access another client's submission
- missing required fields
- blank required values
- invalid field IDs
- fields belonging to another workflow
- successful submission creation
- submission status updates

I plan to add automated tests as the project continues.

---

## What I Learned

Building IntakeFlow has helped me get more comfortable with:

- designing REST APIs
- authentication and authorization
- PostgreSQL database design
- Prisma relationships and migrations
- validating API input with Zod
- password hashing with Argon2
- JWT authentication
- role-based access
- database transactions
- multi-page form design
- connecting a Next.js frontend to an Express API
- deploying the frontend, backend, and database separately
- debugging differences between local and production environments

One of the biggest changes in the project was moving from a simple step-based workflow structure to a page-and-field model. That made the form builder more flexible and also required changes to the submission and answer models.

---

## Next Steps

Some features I want to add next are:

- specialized rendering for all field types
- field reordering
- better validation messages
- draft submissions
- autosave
- workflow preview
- conditional fields and pages
- submission search and filtering
- automated API and end-to-end tests
- rate limiting
- email verification
- password reset
- stronger production authentication using HttpOnly cookies

IntakeFlow is still a work in progress, and I continue to add features as I learn and improve the architecture.