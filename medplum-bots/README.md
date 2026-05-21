# Medplum Bots

Medplum Bots are small TypeScript functions that run **inside Medplum** (not in
the browser). They are triggered automatically when FHIR resources change.

Think of them as "server-side rules" that every client must obey — including the
frontend, mobile apps, and any direct API calls.

## Why bots instead of frontend code?

Frontend checks (like disabling a button) only protect the UI.
A bot protects **the data itself** — regardless of how the request was made.

```
User clicks button → Frontend check (UI only)
                   → Medplum stores resource → Bot triggers → Business rule enforced ✅
```

## Bots in this project

| Bot file | Purpose | Trigger |
|---|---|---|
| `billing-gate.ts` | Reverts orders to draft if no billing approval exists | ServiceRequest / MedicationRequest → status = active |

## How to deploy a bot

1. Open Medplum Admin → **Bots** → **New Bot**
2. Give it a name and paste the bot's code
3. Click **Save**, then **Deploy**
4. Go to **Subscriptions** → **New Subscription**
   - Resource type: the FHIR resource the bot should watch
   - Criteria: filter (e.g. `ServiceRequest?status=active`)
   - Channel: rest-hook → paste the bot's invoke URL
5. Test by creating a resource that matches the criteria

## Local development

To test bot logic locally before deploying:

```bash
cd medplum-bots
npx ts-node billing-gate.ts
```

You can also use [Medplum's bot testing CLI](https://www.medplum.com/docs/bots/unit-testing-bots).
