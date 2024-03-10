import { Err, Ok, Result } from "oxide.ts/core";
import { URLS } from "./url";
import {
  SpotifyAPIError,
  SpotifyAPIErrorSet,
  SpotifyAPIErrorTypes,
} from "./error";
import { parse } from "valibot";
import {
  SpotifyAccessToken,
  SpotifyAccessTokenSchema,
  SpotifyCurrentlyPlaying,
  SpotifyCurrentlyPlayingSchema,
  SpotifyToken,
  SpotifyTokenSchema,
} from "./schema";
import Database from "bun:sqlite";
import { getCredentialsByName } from "../../database/credentials";
import { getTokensByUser } from "../../database/tokens";

type QueryParams = [string, string];

export const SPOTIFY_INTEGRATION_STAGE = {
  ENTER_CREDENTIALS: "ENTER_CREDENTIALS",
  ENTER_TOKENS: "ENTER_TOKENS",
  COMPLETE: "COMPLETE",
} as const;

async function apiRequest(
  request: Request
): Promise<
  Result<
    Response,
    Exclude<SpotifyAPIErrorSet, SpotifyAPIError<"ResponseError">>
  >
> {
  let response: Response;
  try {
    response = await fetch(request);
  } catch (error) {
    if (request.signal.aborted) {
      return Err(
        new SpotifyAPIError(
          SpotifyAPIErrorTypes.REQUEST_ABORT_ERROR,
          { request },
          error
        )
      );
    }

    return Err(
      new SpotifyAPIError(
        SpotifyAPIErrorTypes.NETWORK_ERROR,
        { request },
        error
      )
    );
  }

  if (!response.ok) {
    return Err(
      new SpotifyAPIError(SpotifyAPIErrorTypes.REQUEST_ERROR, {
        request,
        response,
      })
    );
  }

  return Ok(response);
}

export function createAuthorizationURL(
  clientID: string,
  redirectURI: string,
  scopes: string[],
  state: string
): string {
  const url = new URL(URLS.AUTH.AUTHORIZATION_URL);
  const params: QueryParams[] = [
    ["response_type", "code"],
    ["client_id", clientID],
    ["scope", scopes.join(" ")],
    ["redirect_uri", redirectURI],
    ["state", state],
  ];

  for (const [name, value] of params) {
    url.searchParams.append(name, value);
  }

  return url.toString();
}

/**
 * Fetch the initial set of tokens from spotify.
 * The initial set contains both the refresh and acess token.
 * Authorization code is given by spotify once the user has
 * successfully logged in using the authorized url.
 * Ref: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 * @param clientID
 * @param clientSecret
 * @param redirectURI
 * @param authorizationCode
 * @returns
 */
export async function requestToken(
  clientID: string,
  clientSecret: string,
  redirectURI: string,
  authorizationCode: string
): Promise<Result<SpotifyToken, SpotifyAPIErrorSet>> {
  const url = new URL(URLS.AUTH.ACCESS_TOKEN);
  const params: QueryParams[] = [
    ["grant_type", "authorization_code"],
    ["code", authorizationCode],
    ["redirect_uri", redirectURI],
  ];
  const headers = {
    Authorization: `Basic ${btoa(`${clientID}:${clientSecret}`)}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  for (const [name, value] of params) {
    url.searchParams.append(name, value);
  }

  const request = new Request(url.toString(), {
    method: "POST",
    headers,
  });

  const wrappedResponse = await apiRequest(request);
  if (wrappedResponse.isErr()) {
    return wrappedResponse;
  }

  const response = wrappedResponse.unwrap();
  try {
    const tokens = parse(SpotifyTokenSchema, await response.json());
    return Ok(tokens);
  } catch (error) {
    return Err(
      new SpotifyAPIError(
        SpotifyAPIErrorTypes.RESPONSE_ERROR,
        {
          request,
          response,
          schema: SpotifyAccessTokenSchema,
        },
        error
      )
    );
  }
}

/**
 * Fetch a new access token using the refresh token.
 * Refresh token is obtained using the `requestToken` function
 * Ref: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
 * @param clientID
 * @param refreshToken
 * @returns
 */
export async function refreshAccessToken(
  clientID: string,
  refreshToken: string
): Promise<Result<SpotifyAccessToken, SpotifyAPIErrorSet>> {
  const url = new URL(URLS.AUTH.ACCESS_TOKEN);
  const params: QueryParams[] = [
    ["grant_type", "refresh_token"],
    ["refresh_token", refreshToken],
    ["client_id", clientID],
  ];
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  for (const [name, value] of params) {
    url.searchParams.append(name, value);
  }

  const request = new Request(url.toString(), {
    method: "POST",
    headers,
  });

  const wrappedResponse = await apiRequest(request);
  if (wrappedResponse.isErr()) {
    return wrappedResponse;
  }

  const response = wrappedResponse.unwrap();
  try {
    const tokens = parse(SpotifyAccessTokenSchema, await response.json());
    return Ok(tokens);
  } catch (error) {
    return Err(
      new SpotifyAPIError(
        SpotifyAPIErrorTypes.RESPONSE_ERROR,
        {
          request,
          response,
          schema: SpotifyAccessTokenSchema,
        },
        error
      )
    );
  }
}

/**
 * Get the currently playing song, in case no song
 * is being played the API would return 204, hence the
 * null return for it.
 * @param accessToken
 * @param signal
 * @returns
 */
export async function currentlyPlaying(
  accessToken: string,
  signal: AbortSignal
): Promise<Result<SpotifyCurrentlyPlaying | null, SpotifyAPIErrorSet>> {
  const request = new Request(URLS.API.CURRENTLY_PLAYING, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const wrappedResponse = await apiRequest(request);
  if (wrappedResponse.isErr()) {
    return wrappedResponse;
  }

  const response = wrappedResponse.unwrap();
  if (response.status === 204) {
    return Ok(null);
  }

  try {
    const currentlyPlaying = parse(
      SpotifyCurrentlyPlayingSchema,
      await response.json()
    );
    return Ok(currentlyPlaying);
  } catch (error) {
    return Err(
      new SpotifyAPIError(SpotifyAPIErrorTypes.RESPONSE_ERROR, {
        request,
        response,
        schema: SpotifyCurrentlyPlayingSchema,
      })
    );
  }
}

export async function seek(
  position: number,
  accessToken: string,
  signal: AbortSignal
): Promise<
  Result<null, Exclude<SpotifyAPIErrorSet, SpotifyAPIError<"ResponseError">>>
> {
  const url = new URL(URLS.API.SEEK);
  url.searchParams.append("position_ms", `${position}`);

  const request = new Request(url.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const wrappedResponse = await apiRequest(request);
  if (wrappedResponse.isErr()) {
    return wrappedResponse;
  }

  return Ok(null);
}

export async function next(
  accessToken: string,
  signal: AbortSignal
): Promise<
  Result<null, Exclude<SpotifyAPIErrorSet, SpotifyAPIError<"ResponseError">>>
> {
  const request = new Request(URLS.API.NEXT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const wrappedResponse = await apiRequest(request);
  if (wrappedResponse.isErr()) {
    return wrappedResponse;
  }

  return Ok(null);
}

export function apiIntegrationStage(
  user: string,
  db: Database
): (typeof SPOTIFY_INTEGRATION_STAGE)[keyof typeof SPOTIFY_INTEGRATION_STAGE] {
  const credentials = getCredentialsByName(db, user);
  if (credentials === null) {
    return SPOTIFY_INTEGRATION_STAGE.ENTER_CREDENTIALS;
  }

  const tokens = getTokensByUser(db, user);
  if (tokens === null) {
    return SPOTIFY_INTEGRATION_STAGE.ENTER_TOKENS;
  }

  return SPOTIFY_INTEGRATION_STAGE.COMPLETE;
}