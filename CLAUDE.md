# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Background

A web application for mobile phones that allows singers at a barbershop harmony brigade to track which other singers they've sung with, in pursuit of the "Tramp" award. The main page of the app is a list of attendees to the event, grouped by part and sorted by first name, where you can check off each person you've sung with.

## Tech Stack

- **Frontend:** React 19 + TypeScript, Redux Toolkit, Styled Components, React Router v7, Vite
- **Backend:** .NET 10 Minimal API, EF Core 10, should support SQLite locally and Azure SQL Server in production

## Commands

**Frontend** — run from `client/`:
```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build
npm run preview  # serve the production build
```

**Backend** — run from `server/BrigadeTramp.Api/`:
```bash
dotnet run       # API at http://localhost:5062 (or port in launchSettings)
dotnet build     # compile check
```

API explorer (dev only): `http://localhost:<port>/scalar/v1`

## Database

The app uses `EnsureCreated()` (not EF migrations). Schema changes must be patched manually at startup in `Program.cs`. Write all raw SQL to be compatible with both SQLite (local) and SQL Server (production) — branch on the `isSqlite` variable already computed there.

## Data model

- `Event` - The ID, name, and date of the event.
- `Singer` - Singer's badge name, first name, last name, part, and the event they're participating in, and a unique code that they will use in a URL.
- `SingerSungWith` - Connects a singer and the other singers they've sung with.

## Styled Components conventions

The app should be mobile friendly. Each singer should be a card, and you should be able to fit two cards across the screen. Singers should be grouped by part, and within a part singers should be sorted first by their badge name, then by last name. Badge name should display prominently on the card, then first and last name smaller below that.

Transient props (not forwarded to the DOM) use the `$` prefix — e.g., `$selected`, `$covered`, `$part` — to avoid React DOM prop warnings.

## Pages

### Main Page

The main page is reached by a url of /singer/<code> where code is the unique code in the singer table. This will then load a list of singers you need to sing with, grouped by part (Tenor, Lead, Baritone, Bass in that order) and sorted first by badge name, then by last name.

Your own card should always be marked as completed.

When you click on a singer's card it will mark you off as having sung with that person by showing a checkmark.

The name cards should have a color scheme. Tenors are yellow, Leads blue, Baritones green, Basses red. When a singer has not been sung with it will show a lighter variant of the color. When you mark someone off it should display that card in a darker color.

Each part group should show the number of people left to sing with on that part. Your own part should always show 0 left to sing with, but you should be able to expand the section and mark off singers anyway.

If a section has more than one singer left to sing with, it should default to expanded. If there are zero left it sing with it should default to collapsed.

When you have sung with all singers other than the ones in your part, the top of the page will prominently display "TRAMP!". If you have also song with all singers in your own part it should display "SUPER TRAMP!!"

### Admin Login Page

The admin page should be at /login, and protected by a password. It can authenticate to the server using Basic authentication with a username of admin and a password that is stored in configuration.

Once the administrator is logged in they should be redirected to the /admin page.

### Admin Page

The page at /admin will allow an administrator to do CRUD operations on Events. Events should be cards sorted in reverse chronological order by date.

You can expand an Event card and see a list of singers at that event with links to their individual Main Page (based on their QR codes).

You can also click a page to import a csv with all the singers for an event.

You should also be able to click a link that will generate and download a PDF containing QR codes for all the singers' main pages. Each page of the PDF should be a 3x4 grid where each cell in the grid contains a QR code linking to that singer's page, as well as the singer's badge name and last name.

An admin should be able to manually add singers to an event. You should not be able to delete singers, but you can mark them as "Inactive" or "Optional". If they are inactive they will not display on the list and not count towards your total, but any previous records of them singing remain. If optional, they show on the list, but with an asterisk to indicate they are optional, and they don't count towards the singers remaining to sing with.

### Singer Import Page

The page at /import will allow you either upload or paste a csv. The csv will look for columns called BadgeName, FirstName, LastName, Part, and Status. It should load that into the Singers table with the ID of the current event and generate the unique code stored with the singer. Status options should be blank (the default, which is active), Inactive, or Optional.