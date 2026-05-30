#!/usr/bin/env node
/**
 * Local helper: calls production auto-sync (requires deploy + env vars on Vercel).
 *
 *   DUFFEL_WEBHOOK_SETUP_KEY=xxx SITE_URL=https://skylinevoyager.com node scripts/duffel-webhook-sync.mjs
 */
const setupKey = process.env.DUFFEL_WEBHOOK_SETUP_KEY?.trim();
const base = (process.env.SITE_URL ?? "https://skylinevoyager.com").replace(/\/$/, "");

if (!setupKey) {
  console.error("Set DUFFEL_WEBHOOK_SETUP_KEY");
  process.exit(1);
}

const res = await fetch(`${base}/api/admin/duffel-webhook/sync`, {
  method: "POST",
  headers: { Authorization: `Bearer ${setupKey}` },
});

const json = await res.json();
console.log(JSON.stringify(json, null, 2));
process.exit(res.ok ? 0 : 1);
