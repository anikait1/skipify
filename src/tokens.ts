import { SpotifyTokens, updateSpotifyTokens } from "./database";
import { SpotifyError, refreshSpotifyToken } from "./spotify-api";

const TOKENS_REFRESH_INTERVAL = 30_00_000; // 50 minutes


export type AuthorizedTokens = {
  authorized: true;
  accessToken: string;
  refreshToken: string;
  lastRefreshed: number;
};
export type UnAuthorizedTokens = {
  authorized: false;
  accessToken: null;
  refreshToken: null;
  lastRefreshed: null;
};
export type Tokens = AuthorizedTokens | UnAuthorizedTokens;

// export function loadTokens(spotifyTokens: null): UnAuthorizedTokens;
// export function loadTokens(spotifyTokens: SpotifyTokens): AuthorizedTokens

export function loadTokens(spotifyTokens: SpotifyTokens | null): Tokens {
  if (!spotifyTokens) {
    return {
      authorized: false,
      accessToken: null,
      refreshToken: null,
      lastRefreshed: null,
    };
  }

  return {
    authorized: true,
    accessToken: spotifyTokens.access_token,
    refreshToken: spotifyTokens.refresh_token,
    lastRefreshed: spotifyTokens.refreshed_at,
  };
}


export async function tokensPoll(tokens: AuthorizedTokens): Promise<void> {
  try {
    const refreshedTokens = await refreshSpotifyToken(tokens.refreshToken);
    const refreshedAt: number = Date.now();

    updateSpotifyTokens(
      process.env.email as string,
      refreshedTokens.access_token,
      refreshedAt
    );
    tokens.accessToken = refreshedTokens.access_token;
    tokens.lastRefreshed = refreshedAt;
  } catch (error) {
    // TODO add logic to increase the interval in case of an error
    console.error("Unable to refresh tokens");
    if (error instanceof SpotifyError) {
      console.log(error.message, error.type, error.extra)
    }
  }

  setTimeout(tokensPoll, TOKENS_REFRESH_INTERVAL, tokens);
}