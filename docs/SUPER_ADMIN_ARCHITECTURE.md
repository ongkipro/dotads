# DotAds Engine v2 — Super Admin Architecture

## Navigation
- Platform Analytics
- Tenant Management
- Billing & Entitlements
- Global Settings
- Audit & Incident Review

## Tenant management table
Columns: tenant name, slug, status, plan, primary domain, active domains count, order count 30d, GMV 30d, last active, alerts.

Actions: create tenant, suspend/reactivate, impersonate, change plan, inspect audit trail, inspect domain health.

## Impersonation
- explicit reason required
- persistent warning banner
- separate token/session scope
- all actions dual-logged

## Domain operations
Platform can see every tenant’s domain state, but tenant owners perform normal add/verify/switch actions.
