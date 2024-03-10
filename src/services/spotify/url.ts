export const URLS = {
  AUTH: {
    AUTHORIZATION_URL: "https://accounts.spotify.com/authorize",
    ACCESS_TOKEN: "https://accounts.spotify.com/api/token",
  },
  API: {
    BASE: "https://api.spotify.com/v1",
    CURRENTLY_PLAYING: "https://api.spotify.com/v1/me/player/currently-playing",
    SEEK: "https://api.spotify.com/v1/me/player/seek",
    NEXT: "https://api.spotify.com/v1/me/player/next",
  }
} as const;
