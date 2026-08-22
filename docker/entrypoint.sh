#!/bin/bash
# ─────────────────────────────────────────────────────────────
# CaraBase Docker Entrypoint
# LinuxServer.io-style PUID/PGID support
# ─────────────────────────────────────────────────────────────
set -e

# --- Defaults: fall back to the built-in 'node' user (UID 1000, GID 1000) ---
PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

echo "[entrypoint] ────────────────────────────────────────────"
echo "[entrypoint] CaraBase — Sovereign SQLite Database-as-a-Service"
echo "[entrypoint] ────────────────────────────────────────────"

# --- Create group if it doesn't already exist ---
if ! getent group "$PGID" &>/dev/null; then
  echo "[entrypoint] Creating group with GID ${PGID}..."
  groupadd --gid "$PGID" --non-unique carabase
  _group_name="carabase"
else
  _group_name="$(getent group "$PGID" | cut -d: -f1)"
  echo "[entrypoint] Using existing group '${_group_name}' (GID ${PGID})"
fi

# --- Create user if it doesn't already exist ---
if ! id -u "$PUID" &>/dev/null; then
  echo "[entrypoint] Creating user with UID ${PUID}..."
  useradd --uid "$PUID" --gid "$PGID" --non-unique --create-home --shell /bin/bash carabase
  _user_name="carabase"
else
  _user_name="$(id -nu "$PUID")"
  echo "[entrypoint] Using existing user '${_user_name}' (UID ${PUID})"
fi

# --- Fix ownership of the data volume ---
echo "[entrypoint] Setting ownership of /app/data to ${PUID}:${PGID}..."
chown -R "${PUID}:${PGID}" /app/data

# --- Inform the app which user it's running as (useful for debugging) ---
export PUID PGID
export RUNNER_UID="${PUID}"
export RUNNER_GID="${PGID}"

echo "[entrypoint] Dropping privileges to ${_user_name} (UID ${PUID})..."
echo "[entrypoint] ────────────────────────────────────────────"

# --- Drop privileges and exec the CMD ---
exec su -s /bin/bash "${_user_name}" -c "cd /app && exec \"\$@\"" -- "${_user_name}" "$@"