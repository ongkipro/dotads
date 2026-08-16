#!/usr/bin/env bash
set -euo pipefail

container_name="dotads-clean-test-$$"
database_name="dotads_clean_test"
database_user="dotads_test"
database_password="dotads_test_password"
app_password="dotads_app_test_password"
platform_password="dotads_platform_test_password"

cleanup() {
  docker stop "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --rm -d \
  --name "$container_name" \
  -e POSTGRES_DB="$database_name" \
  -e POSTGRES_USER="$database_user" \
  -e POSTGRES_PASSWORD="$database_password" \
  -p 127.0.0.1::5432 \
  --tmpfs /var/lib/postgresql/data:rw,noexec,nosuid,size=512m \
  postgres:16-alpine >/dev/null

ready_checks=0
for attempt in $(seq 1 30); do
  if docker exec "$container_name" psql -U "$database_user" -d "$database_name" -c "select 1" >/dev/null 2>&1; then
    ready_checks=$((ready_checks + 1))
    if [ "$ready_checks" -eq 2 ]; then
      break
    fi
  else
    ready_checks=0
  fi
  if [ "$attempt" -eq 30 ]; then
    docker logs "$container_name"
    exit 1
  fi
  sleep 1
done

port_mapping=$(docker port "$container_name" 5432/tcp)
database_port=${port_mapping##*:}
docker exec "$container_name" psql -U "$database_user" -d "$database_name" -v ON_ERROR_STOP=1 \
  -c "CREATE ROLE dotads_app LOGIN PASSWORD '${app_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS" \
  -c "CREATE ROLE dotads_platform LOGIN PASSWORD '${platform_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS" >/dev/null

export MIGRATION_DATABASE_URL="postgres://${database_user}:${database_password}@127.0.0.1:${database_port}/${database_name}"
export DATABASE_URL="postgres://dotads_app:${app_password}@127.0.0.1:${database_port}/${database_name}"
export PLATFORM_DATABASE_URL="postgres://dotads_platform:${platform_password}@127.0.0.1:${database_port}/${database_name}"
export NODE_ENV="test"
export DOTADS_DEV_TENANT_PASSWORD="ephemeral-clean-db-only"
export DOTADS_DEV_SUPERADMIN_PASSWORD="ephemeral-superadmin-only"

pnpm db:migrate
pnpm db:seed
pnpm --filter @dotads/api smoke:operator-bootstrap
pnpm --filter @dotads/api dev:seed-auth
pnpm --filter @dotads/api smoke:dev-auth-fixture
NODE_ENV=development pnpm --filter @dotads/api smoke:trusted-origins
pnpm --filter @dotads/db smoke:platform-least-privilege
pnpm --filter @dotads/db smoke:tenant-isolation
pnpm --filter @dotads/db smoke:tenant-rls
pnpm --filter @dotads/db smoke:provision-tenant
pnpm --filter @dotads/api smoke:public-order-idempotency
pnpm test
