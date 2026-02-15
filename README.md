# Jace SMM Ticket Bot

Ticket bot + admin website with blue theme, owner/admin roles, blacklist alerts, and Discord `/help` command linking to the website.

## Tech Stack
- Bot: Node.js + discord.js
- API: Express + Prisma
- Web: React (Vite)
- Database: PostgreSQL

## Features
- `/help` only command (sends embed with website link)
- Website login (password only)
- Owner can run `/paswdgen` with master password to generate their own password
- Lockout after 3 bad attempts for 10 minutes
- Owner/admin role management
- Blacklist panel with auto-embed to configured channel
- Settings for channels, website URL, and image

## Setup
1) Create a PostgreSQL database and update the connection string in `server/.env`.
2) Copy environment file:
	- `server/.env.example` → `server/.env`
3) Install dependencies:
	- `npm install`
4) Run Prisma migration:
	- `npm --workspace server run prisma:migrate`
5) Start server and client:
	- `npm --workspace server run dev`
	- `npm --workspace client run dev`

	## Railway Deploy
	1) Create a Railway project and add a PostgreSQL database.
	2) Set environment variables (at minimum):
		- DATABASE_URL
		- JWT_SECRET
		- ADMIN_PASSWORD
		- OWNER_ID
		- DISCORD_BOT_TOKEN (optional)
		- DISCORD_CLIENT_ID (optional)
	3) Deploy. The build uses [railway.json](railway.json) and serves the React build from the API.
	4) Migrations run automatically on each deploy (`prisma migrate deploy`).

## Notes
- Default owner ID: `1435310225010987088`
- Master password for `/paswdgen`: `crxxr10032011`
- Change `JWT_SECRET` and `ADMIN_PASSWORD` before production.
