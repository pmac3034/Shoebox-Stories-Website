
6/14/26: Update Keys in Cloudflare
6/11/26: V1.0.0 Deploy Cloudflare 


Dev Plans:

Future Sections:
- restorations section
- Why digitize? section that explains use case to older audience (sharing, backup, etc)
- what we scan section (when more types added)

#Scheduling and backend 
For our MVP, build it in phases:

~~Phase 1: Frontend only with mock availability and console logging.~~
~~Phase 2: Add backend/serverless endpoint that creates pending Google Calendar events.~~
Phase 3: Add Google Sheets row + ~~email notifications.~~
  TODO: After a successful events.insert, send a separate transactional email to
  shoeboxstories.scans@gmail.com (and optionally to the customer) with the full
  appointment details. Do NOT rely solely on the Google Calendar invite email
  (sendUpdates=all) as the notification mechanism — Calendar invites can land in
  spam or be missed if the attendee list changes. Use a dedicated email service
  (Cloudflare Email Workers, SendGrid, Mailgun, etc.) so the owner always gets a
  reliable, formatted notification regardless of Calendar behaviour.
Phase 4: Add a tiny admin approval flow only if manual calendar editing gets annoying.


