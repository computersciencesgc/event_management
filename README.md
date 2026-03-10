# College Event Management System

React-based event management system for:

- **Saradha Gangadharan College**
- **Department of Computer Science**

## Features

- Home page with event stats and available events
- Participant registration (up to 2 events)
- Registration success page with submitted details and Candidate ID
- Success page PDF download and confirmation email with PDF attachment
- Admin login and dashboard
- Admin can add/delete events
- Event types supported: `Individual Event`, `Team Event`, `Both (Team & Individual)`
- Admin can filter candidate details by event, college, status, and search
- Organizer login and dashboard
- Organizer can approve/reject registered candidates
- Responsive design with media queries for desktop/mobile
- Data persistence using browser `localStorage`

## Default Credentials

- Admin: `admin` / `admin123`
- Organizer: `organizer` / `admin123`

## Routes

- `/` - Home
- `/register` - Candidate registration
- `/success/:candidateId` - Registration details
- `/admin/login` - Admin login
- `/admin` - Admin dashboard (protected)
- `/organizer/login` - Organizer login
- `/organizer` - Organizer dashboard (protected)

## Run Locally

```bash
npm install
npm run dev
```

### Email Configuration (Confirmation Mail + PDF Attachment)

1. Create a `.env` file in project root.
2. Add:

```bash
SMTP_USER=computersciencesgc@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_API_PORT=8787
```

Notes:
- Use a Gmail **App Password** for `SMTP_PASS`.
- The mail API runs with `npm run dev` and is proxied by Vite at `/api`.

Then open the local URL shown in terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
```
