# RoomMate Finder

A dynamic web app for finding roommates and shared flats in Singapore. Built with Node.js, Express, EJS, and MongoDB.

## Disclaimer

This project is a public version of the real repository. It is meant for our final project to our web application development class subject (IS113) taught in Singapore Management University. There is partial use of AI, only for debugging and code structure (read more below). 

Special thanks to my teammates who have worked hard for this project:
Dewa
Cledwyn
Seunghak
Yu Xuan

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- MongoDB Database, preferably using MongoDB Atlas to connect

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Xxdsanctuary/house-finder.git
   cd house-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:

   Ask the group leader for the `config.env` file. Create a `config/` folder in the project root and place the file inside:
   ```
   house-finder/
   └── config/
       └── config.env
   ```
   This file contains `DB` (MongoDB connection string), `SESSION_SECRET` and `PORT`. It is git-ignored and must not be committed.

## Running the App

```bash
node server.js
```

Or with auto-restart on file changes:
```bash
nodemon server.js
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

Expected console output:
```
MongoDB connected successfully
Server running at http://localhost:8000/
```

## Test Accounts

User accounts can be created through registration.<br>

Admin Test Account sign in details:
- username: admin
- password: aplusplease

Admin accounts have access to `/admin`.

## Project Structure

```
├── controllers/     Route handler logic (auth, profile, listing, comment, shortlist)
├── middleware/      Session auth checks, error handling
├── models/          Mongoose schemas (User, Listing, Room, Comment, Shortlist, ...)
├── routes/          Express routers
├── services/        DB query helpers called by controllers
├── views/           EJS templates
│   └── partials/    Shared nav bar
├── public/          Static assets
└── server.js        App entry point
```

## Key Routes

| Path | Description |
|------|-------------|
| `/` | Home |
| `/listings` | Browse all listings |
| `/listings/:id` | View a listing |
| `/listings/:id/comments` | Comments for a listing |
| `/profile` | Your profile |
| `/shortlist` | Your shortlisted listings |
| `/requests` | Room requests sent/received |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/admin` | Admin panel (admin only) |

## Architecture

Controllers never call other controllers directly. Shared DB logic lives in `services/`. See inline comments for per-file details.

## Workload Split (Primary Areas of Contribution)

Dewa     : Error Handling, Profile, Shortlist <br>
Cledwyn  : Listing, Rooms, Matching Algorithms, Filters and Search, Integrations, Database Set up <br>
Steven   : Authentication, User, Comments <br>
Seunghak : Admin, Dashboard and Listing <br>
Yu Xuan  : Request and Message

---

## AI Disclosure

AI assistance was used for most of the basic CSS and styling of the application.
Parts of this project were developed with AI coding assistance to help with boilerplate, debugging, and code structure. All logic was reviewed and tested by the team.
