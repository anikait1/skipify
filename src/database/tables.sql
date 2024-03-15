CREATE TABLE IF NOT EXISTS api_tokens (
    token_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spotify_user_id INTEGER NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER, 
    created_at INTEGER default (strftime('%s', 'now')) NOT NULL,
    updated_at INTEGER default (strftime('%s', 'now')) NOT NULL,
    deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS song_automations (
    automation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spotify_song_id TEXT NOT NULL,
    song TEXT NOT NULL,
    artist TEXT NOT NULL,
    image_url TEXT NOT NULL,
    range JSON NOT NULL,
    created_at INTEGER default (strftime('%s', 'now')) NOT NULL,
    updated_at INTEGER default (strftime('%s', 'now')) NOT NULL,
    deleted_at INTEGER
);