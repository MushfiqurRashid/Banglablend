# Container deployment (AWS or a VPS)

Concrete runbook for shipping the two apps as containers. [deployment.md](deployment.md) holds the
platform-agnostic policy — release order, domains, and operations. This file is the mechanics.

Both apps build to a self-contained Next.js server (`output: "standalone"`), so the runtime image
carries only the traced dependencies and runs with plain `node`. No pnpm at runtime.

## Images

Build from the **repository root**. The pnpm workspace packages under `packages/*` are only
resolvable with the root as build context, so `-f` points at the Dockerfile and `.` stays the root:

```bash
docker build -f apps/storefront/Dockerfile -t bangla-blend-storefront:$(git rev-parse --short HEAD) \
  --build-arg NEXT_PUBLIC_SITE_URL=https://banglablend.store \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://fwcwhiprbaqqwiyryhpa.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
  --build-arg NEXT_PUBLIC_CONTACT_EMAIL=banglablend@gmail.com \
  .

docker build -f apps/admin/Dockerfile -t bangla-blend-admin:$(git rev-parse --short HEAD) \
  --build-arg NEXT_PUBLIC_ADMIN_URL=https://bpanel.banglablend.store \
  --build-arg NEXT_PUBLIC_STOREFRONT_URL=https://banglablend.store \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://fwcwhiprbaqqwiyryhpa.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
  .
```

### Build-time vs runtime variables

This trips people up, so it is worth stating plainly:

- **`NEXT_PUBLIC_*` is baked into the image at build time.** It is inlined into the client bundle,
  and both `next.config.ts` files also read `NEXT_PUBLIC_SUPABASE_URL` to assemble the CSP header.
  Changing one of these means **rebuilding the image** — restarting the container will not pick it up.
- The compose file also supplies public values at runtime because server routes and server actions
  read the same origins and Supabase configuration. The runtime values must match the build values.
- **Everything else is read at runtime.** `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, payment,
  and email credentials are ordinary container env vars. Never pass a secret as a
  `NEXT_PUBLIC_` variable — that publishes it to every visitor.

The anon key is safe to bake in: it is public by design and constrained by RLS.

## Running

```bash
docker run -d --name storefront -p 3000:3000 --env-file storefront.env bangla-blend-storefront:<tag>
docker run -d --name admin      -p 3100:3100 --env-file admin.env      bangla-blend-admin:<tag>
```

Runtime variables per service (see [.env.production.example](../.env.production.example)):

| Service | Runtime variables |
|---|---|
| Storefront | Public domain/Supabase values, `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, `COD_ENABLED`, `SSLCOMMERZ_*`, `EMAIL_*`, the four approval gates |
| Admin | Public domain/Supabase values, `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET` |

`REVALIDATE_SECRET` must be **identical** in both services — admin sends it to the storefront's
`/api/revalidate/content` after publishing so cached pages refresh immediately.

## AWS options

Pick one; they trade control for effort.

**App Runner** — least work. One service per app from ECR, HTTPS and scaling handled. Set the port
to 3000/3100 and put the runtime variables in the service config, secrets via Secrets Manager.

**ECS Fargate** — most common. One task definition and service per app behind an Application Load
Balancer, with two target groups and host-based routing (`banglablend.store` → storefront,
`bpanel.banglablend.store` → Admin).
Certificates via ACM. Inject secrets with the task definition's `secrets` block (Secrets Manager or
SSM Parameter Store) rather than plaintext `environment`.

**EC2** — cheapest and most manual: run the two containers behind nginx or Caddy for TLS. This is
also the shape a VPS host like Hostinger gives you, so the compose file below applies.

In all three, Admin is a separate service and origin at `bpanel.banglablend.store`; its dedicated
Auth cookie name prevents it from colliding with the storefront session.

## VPS with compose

[docker-compose.prod.yml](../docker-compose.prod.yml) runs both apps. Copy
[`infrastructure/caddy/Caddyfile`](../infrastructure/caddy/Caddyfile) to `/etc/caddy/Caddyfile` and
reload Caddy after the DNS records point to the VPS. Publish only ports 80/443; the app ports bind
to `127.0.0.1` and are not directly reachable. With a filled `.env`, deploy using:

- `A` record for `@` → your Hostinger VPS public IPv4 address
- `A` record for `bpanel` → the same VPS public IPv4 address
- `CNAME` record for `www` → `banglablend.store`

Remove conflicting parked/default records for those hosts. Caddy will obtain certificates for the
storefront, `www`, and `bpanel` after DNS resolves to the VPS and TCP ports 80/443 are open.

```bash
sh scripts/deploy-vps.sh
```

The helper installs the pinned CLI, links the exact Supabase Cloud project, applies pending database
migrations and Auth/project config, validates the environment, and only then rebuilds the app. The
server's ignored `.env` must include `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`; a failed
cloud sync stops the deployment before the running containers are replaced.

## Database

The apps expect the Supabase project's schema to already be current. Run migrations **before**
routing traffic to new containers:

```bash
pnpm db:configure
```

Confirm a recoverable backup first. Migrations are forward-only and are not run by the containers,
which is what keeps application rollback independent of schema state.
The guarded push rejects localhost and any linked project other than `fwcwhiprbaqqwiyryhpa`; it
previews pending migrations before applying them, then synchronizes the production Auth callback
configuration. Local Supabase and production seeds are not part of the supported workflow.

For a brand-new environment, create the first administrator with
`SUPERADMIN_EMAIL=... pnpm admin:bootstrap` (omit the password to send an invitation email), and add
`https://bpanel.banglablend.store/auth/callback` to the Supabase Auth redirect allowlist — staff
invitations and password resets are emailed against that exact URL.

Configure Supabase Auth custom SMTP separately from the storefront's `EMAIL_PROVIDER=resend`.
Storefront email sends order receipts and inquiry notifications; Supabase SMTP sends Auth
invitations, confirmations, and password resets.

## Release checklist

1. Confirm a recoverable Supabase backup and review pending migrations.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` on the release commit.
3. `pnpm db:configure` to link and synchronize the exact cloud project.
4. `NODE_ENV=production pnpm check:production` with the **final** deployment variables loaded.
   It fails until every required variable is set and all four approval gates are recorded.
5. Build and push both images; deploy admin and the storefront.
6. `pnpm test:admin-smoke` and `pnpm test:checkout-smoke` against the deployed origins with
   synthetic accounts.
7. Verify the Supabase-backed public search endpoint.
8. Enable COD, SSLCOMMERZ, or a new market only after its operational checks are signed off.

## Rollback

Redeploy the previous image tag — application rollback is independent as long as migrations stayed
backward compatible. Do **not** roll a migration backward to fix a bad release: disable the affected
feature first (`SSLCOMMERZ_ENABLED=false`, a market flag), then repair data with a reviewed forward
migration. Payment and admin audit records are evidence; preserve them.
