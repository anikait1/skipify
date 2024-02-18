CREATE TABLE IF NOT EXISTS spotify_credentials (
    credential_type TEXT PRIMARY KEY,
    data TEXT -- parse as JSON
);

CREATE TABLE IF NOT EXISTS automations (
    automation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    spotify_id TEXT,
    type TEXT,
    data TEXT -- parse as JSON
);