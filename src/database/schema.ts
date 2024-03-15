export type SpotifyAPITokens = {
    token_id: number;
    spotify_user_id: number;
    access_token: string;
    refresh_token: string;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
};

export type SongAutomation = {
    automation_id: number;
    spotify_song_id: string;
    song: string;
    artist: string;
    image_url: string;
    range: { start: number | null; end: number | null };
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
};