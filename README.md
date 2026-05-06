# Brigade Tramp

A mobile-friendly web app for barbershop harmony singers to track who they've sung with at a brigade event, in pursuit of the **Tramp** award.

## What is the Tramp Award?

At a barbershop harmony brigade, the goal is to sing with as many fellow singers as possible. You earn **TRAMP!** when you've sung with everyone outside your own part, and **SUPER TRAMP!!** when you've sung with every single singer at the event.

## Features

- Singer cards grouped by part (Tenor, Lead, Baritone, Bass), color-coded by section
- Tap a card to mark that you've sung with someone; tap again to unmark
- Real-time remaining counts per section
- TRAMP! / SUPER TRAMP!! achievement banners
- Optional singers (marked with `*`) visible but excluded from required totals
- Admin panel for managing events, importing singers via CSV, and generating QR code PDFs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Redux Toolkit, Styled Components, React Router v7, Vite |
| Backend | .NET 10 Minimal API, EF Core 10 |
| Database | SQLite (local), Azure SQL Server (production) |
| PDF | PdfSharpCore |
| QR codes | QRCoder |

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### 1. Run the API

```bash
cd server/BrigadeTramp.Api
dotnet run
```

The API starts at `http://localhost:5062`. On first run it creates `brigade-tramp.db` automatically.

API explorer (development only): `http://localhost:5062/scalar/v1`

### 2. Run the frontend

```bash
cd client
npm install
npm run dev
```

The app is served at `http://localhost:5173`.

### 3. Log in to the admin panel

Navigate to `http://localhost:5173/login`. The default development password is `admin` (set in `appsettings.Development.json`).

## Admin Workflow

1. **Create an event** — give it a name and date.
2. **Add singers** — either:
   - Click **Import** and upload or paste a CSV file, or
   - Click **+ Singer** to add individually.
3. **Share links** — click **QR PDF** to download a printable PDF of QR codes. Print and cut them out so each singer can scan their own code.
4. Each singer visits their personal URL (`/singer/<code>`) and taps cards as they sing together.

### CSV Format

```
BadgeName,FirstName,LastName,Part,Status
Bubba,John,Smith,Tenor,
Doc,Bill,Jones,Lead,Optional
Slim,Tom,Brown,Baritone,Inactive
```

| Column | Required | Values |
|---|---|---|
| BadgeName | Yes | Display name on card |
| FirstName | Yes | |
| LastName | Yes | |
| Part | Yes | `Tenor`, `Lead`, `Baritone`, `Bass` |
| Status | No | `Active` (default), `Optional`, `Inactive` |

**Active** — normal singer, counts toward totals.  
**Optional** — shown with `*`, does not count toward required totals.  
**Inactive** — hidden from all singer pages; past sung-with records are preserved.

## Configuration

| Setting | File | Description |
|---|---|---|
| `AdminPassword` | `appsettings.json` | Password for the `/login` page |
| `BaseUrl` | `appsettings.json` | Public URL used in QR codes (e.g. `https://yourapp.com`) |
| `ConnectionStrings:Default` | `appsettings.json` | SQL Server connection string for production |

Local development values live in `appsettings.Development.json` and are not committed.

## Database

The app uses `EnsureCreated()` rather than EF migrations. Schema changes are applied as idempotent `ALTER TABLE` patches at startup in `Program.cs`, compatible with both SQLite and SQL Server.

## Deployment

The app is designed to deploy to **Azure App Service** (backend) with an **Azure SQL** database. Set the `ASPNETCORE_ENVIRONMENT` to `Production` and provide the `ConnectionStrings:Default`, `AdminPassword`, and `BaseUrl` values via App Service application settings or environment variables.

## Development

```bash
# Type-check and production build (frontend)
cd client && npm run build

# Compile check (backend)
cd server/BrigadeTramp.Api && dotnet build
```

VS Code users can use the included `.vscode/launch.json` to launch the API with the debugger attached, or use the **Full Stack** compound configuration to start both at once.
