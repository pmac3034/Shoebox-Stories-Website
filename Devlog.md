
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
Phase 3: ~~email notifications. TODO: After a successful events.insert, send a separate transactional email toshoeboxstories.scans@gmail.com~~ (and optionally to the customer) with the full
  appointment details. 
- Availability tracking 

Phase 4: Airtable DB
Phase 4: Add a tiny admin approval flow only if manual calendar editing gets annoying.


