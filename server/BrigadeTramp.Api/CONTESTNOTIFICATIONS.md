# Contest Notifications

When quartets are generated for a contest we want to e-mail each quartet with their initial quartet name, along with the names and e-mail
addresses of the members of the quartet.

## Technology

Use Azure Communication Services (ACS) to send e-mails.

## UI

At the top of the list of generated quartets, add a button called "Email Quartets". When clicked, it pops up a modal with the following
boxes:

- Subject: The subject of the e-mail
- Body: The body of the e-mail

Both fields should allow for interpolated strings with the following tokens:
- event: The name of the event
- contest: The name of the contest
- quartet: The name of the quartet
- tenor: The name of the tenor in the quartet
- tenorEmail: The e-mail address of the tenor in the quartet
- lead: The name of the tenor in the quartet
- leadEmail: The e-mail address of the tenor in the quartet
- baritone: The name of the tenor in the quartet
- baritoneEmail: The e-mail address of the tenor in the quartet
- bass: The name of the tenor in the quartet
- bassEmail: The e-mail address of the tenor in the quartet

The default value for Subject should be:
`{{event}} {{contest}} Quartet Assignment`

The default value for Body should be:
```
Your quartet assignment for the {{contest}} at {{event}} is below. If you are assigned to two quartets you may receive two e-mails, please
watch your e-mail for this possibility:

{{tenor}} - {{tenorEmail}}
{{lead}} - {{leadEmail}}
{{baritone}} - {{baritoneEmail}}
{{bass}} - {{bassEmail}}
```

Below the Subject and Body lines should be a help card that explains the available tokens.

There should be a Send Emails button which sends the e-mails to the singers. When they have been successfully scheduled, the modal should close and a toast should display that it was successful.

There should be a Cancel button which will close the modal with no action.