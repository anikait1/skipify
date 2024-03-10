CREATE TABLE IF NOT EXISTS api_credentials (
    credential_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    created_at INTEGER default (strftime('%s', 'now')),
    updated_at INTEGER default (strftime('%s', 'now')),
    deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS api_tokens (
    user TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at INTEGER default (strftime('%s', 'now')) NOT NULL,
    updated_at INTEGER default (strftime('%s', 'now')) NOT NULL,
    deleted_at INTEGER
)
