# Singer Status

This is a feature definition for splitting singer status into two separate fields: Dance Card Status and Contest Status. Each status should
have its own dropdown on each singer.

## UI

Add the two new status dropdowns to the existing singer edit modal.

Create separate components for the list of singers in mobile vs desktop mode. The mobile version should stay mostly as it is but
remove the current status dropdown. It will be available from the modal. The desktop version should be converted to a table with
the following columns:
- Part (the value should be the existing colored circles with a letter).
- Badge Name
- Last Name
- Dance Card Status
- Contest Status
- Edit (this contains the Edit button that launches the edit modal)

## Dance Card Status

The Dance Card status has the following values: Required, Optional, Hidden. The default is Required.

If a singer is Required, they should have the same behavior on the dance card of the current "Active" status.
If a singer is Optional, they should have the same behavior on the dance card as the current "Optional" status.
If a singer is Hidden, they should have the same behavior on the dance card as the current "Inactive" status.

## Contest Status

The Contest Status has the following values: Included, Once, None. Default value is Included

If a singer is Included, they should be assigned to quartets like a singer currently with the Active status can.
If a singer is Once, they should be assigned to quartets, but should not be assigned to a second quartet when singers in that part need to be in multiple quartets.
If a singer is None, they will not be included in any quartets for contests.

## Existing Status Field

The existing status field does not need to be removed from the database, it can simply be removed from existing
code and display.