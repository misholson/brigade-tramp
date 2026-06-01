This is a feature specification for security and users. Singers should still be able to view MainPage anonymously if they have a direct
link. If a user logs in using their Google accounts, it can give them access to admin functionality, or another path to access their
version of the MainPage.

## User Table

Create a user table that contains the user's e-mail address and name from their Google profile.

## Authentication

Modify the login process to allow login via Google account.

## User Roles

### Role: SiteAdmin

There is only one site-wide user role: SiteAdmin. A SiteAdmin can:
- Create, edit, and delete Events.
- Add users to event-specific roles
- View/edit everything on the site EXCEPT contest scores (they can view
other elements of the contest, just not the scores).

### Role: EventAdmin

A SiteAdmin can create events and add users to the EventAdmin role. An EventAdmin role should be specific to an event. And EventAdmin can
do the following:
- Add other users to event-specific roles
- Modify properties of an event
- Import, add, and edit Singers
- View links to singers' MainPage and view those pages
- Add or modify the song list
- Download the QR PDF
- Email singers

### Role: EventUser

EventUser is specific to an event. It can do the following:
- View Singers
- View Event Properties
- View the song list
- Download the QR PDF
- Email singers

### Role: ContestAdmin

ContestAdmin is the only role that can view contest scores. It can do the following:
- Create, edit, and delete contests
- Enter and view contest scores
- Perform the actions on the contest page

### Role: Singer

This role is assigned to all users by default. It can do the following:
- When they login, they are shown a page with all the events which have a Singer with the same e-mail address. They can click on that
  event to view their MainPage for that event
- If today's date is within the start and end date of one of the events, automatically take the user to their page for that event.

## Seed

Seed the initial User database with the user:
- Email: mish.olson@gmail.com
- Name: Mike Olson
- Role: SiteAdmin