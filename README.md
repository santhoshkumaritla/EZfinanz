# EZfinanz

EZfinanz is a complete personal loan application platform with a customer onboarding flow and an admin review workflow. The app enables customers to register, verify identity, submit KYC, check eligibility, choose EMI options, upload a selfie, and track final application status. Admin users can review submissions, approve or reject selfie verification, and confirm disbursement.

## Highlights

- Customer registration with email, phone, or Google login
- Email and phone OTP verification
- KYC data collection with optional ID document upload
- Eligibility scoring using income, credit score, and debt analysis
- EMI calculation with interest, processing fee, GST, other charges, and IRR
- Bank account entry for loan disbursement
- Declaration approval step
- Final selfie/photo verification and review status
- Admin dashboard with all applications and summary stats
- Application detail page showing the full customer journey

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT + bcrypt
- File uploads: Multer
- Styling: Tailwind CSS

## Project Structure

```bash
EZfinanz-Task/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── README.md
└── package.json
```

## Prerequisites

- Node.js 18 or above
- MongoDB running locally or a reachable MongoDB connection string
- Internet access for npm install if packages are not already installed

## Setup Instructions

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start MongoDB

If MongoDB is not already running locally, start it:

```bash
mongod
```

The backend uses a local default database URL if no environment variable is set:

```bash
mongodb://127.0.0.1:27017/ezfinanz
```

### 3. Run backend

```bash
cd backend
npm run dev
```

The API runs at:

```bash
http://localhost:5000
```

### 4. Run frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

The app runs at:

```bash
http://localhost:5173
```

## Demo Credentials

### Admin

- Email: admin@ezfinanz.com
- Password: admin123

### Customer

You can register a new customer account from the signup page, or use the seeded sample flow with a demo user if it was created during seeding.

## Seed Data

To create the admin and sample customer data:

```bash
cd backend
npm run seed
```

## OTP and Verification Flow

Email OTPs are sent through Nodemailer. Phone OTPs remain simulated and are logged to the backend console.

For Gmail SMTP:

1. Enable 2-Step Verification on the sending Gmail account.
2. Create a Google App Password for Mail.
3. Add these backend environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=EZfinanz <your-email@gmail.com>
```

In production, the email OTP endpoint returns an error if SMTP is not configured, rather than silently pretending that an email was sent. In local development without SMTP settings, the existing simulated console OTP fallback remains available.

## Customer Workflow

1. Sign up or log in
2. Verify email and phone OTP
3. Complete KYC details
4. Submit loan data and eligibility checks
5. Select EMI plan based on eligibility
6. Add bank account
7. Accept declaration
8. Submit selfie / photo verification
9. Monitor review and disbursement status

## Admin Workflow

1. Sign in as admin
2. View the application dashboard
3. Check total, pending, approved, and disbursed counts
4. Open any application to review the full journey
5. Approve or reject the customer selfie
6. Confirm loan disbursement

## Eligibility Logic

The application evaluates:

- Credit score range
- Debt-to-income ratio
- Loan-to-income comparison
- Overall applicant health score

Results can be:

- Eligible
- Partially Eligible
- Not Eligible

## EMI Logic

The EMI calculation follows the standard formula:

$$
EMI = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}
$$

Where:

- P = principal loan amount
- r = monthly interest rate
- n = tenure in months

The app also calculates:

- Processing fee
- GST
- Total charges
- Total repayment
- Net disbursement
- IRR approximation

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /api/auth/register | Register a customer |
| POST | /api/auth/login | Login with email or phone |
| POST | /api/auth/google | Simulated Google OAuth login |
| GET | /api/auth/me | Fetch authenticated user and application |
| POST | /api/auth/send-email-otp | Send email OTP |
| POST | /api/auth/verify-email | Verify email OTP |
| POST | /api/auth/send-phone-otp | Send phone OTP |
| POST | /api/auth/verify-phone | Verify phone OTP |
| PUT | /api/application/kyc | Save KYC details |
| PUT | /api/application/eligibility | Save and evaluate eligibility |
| POST | /api/application/calculate-emi | Calculate live EMI terms |
| PUT | /api/application/emi | Save EMI selection |
| PUT | /api/application/bank-account | Save bank account |
| PUT | /api/application/declaration | Accept declaration |
| POST | /api/application/selfie | Upload selfie |
| GET | /api/admin/applications | List all applications |
| GET | /api/admin/applications/:id | Get full application details |
| PUT | /api/admin/applications/:id/selfie | Approve or reject selfie |
| PUT | /api/admin/applications/:id/disburse | Confirm loan disbursement |

## Notes

- OTPs are simulated for demo/testing. Google login uses real Google Identity Services with server-side ID-token verification.
- Uploaded files are stored in the backend uploads folder.
- The solution follows a simple role-based access pattern with customer and admin flows.

## To Run the Full App

```bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open:

```bash
http://localhost:5173
```

## Real Google Login Setup

1. Open Google Cloud Console and create or select a project.
2. Configure the OAuth consent screen. For testing, add your Google account under Test users.
3. Create an OAuth client of type **Web application**.
4. Add these authorized JavaScript origins:

```text
http://localhost:5173
https://ezfinanz-task.netlify.app
```

5. Copy the web client ID into both environment files:

```text
# frontend/.env.local
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# backend/.env.local or Render environment variables
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

6. In Netlify, add `VITE_GOOGLE_CLIENT_ID` and redeploy the frontend.
7. In Render, add `GOOGLE_CLIENT_ID` and redeploy the backend.

The frontend sends Google's ID token to `POST /api/auth/google`. The backend verifies the token audience and email with Google before creating or logging in the user and issuing the application's JWT.

## License

This project is for educational/demo use and is not production-grade financial software.
