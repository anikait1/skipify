import {
  parse,
  object,
  number,
  string,
  Output,
  BaseSchema,
  nullable,
  array,
  any,
} from "valibot";
import {
  SpotifyCredentials,
  getSpotifyCredentials,
  getSpotifyTokens,
} from "./database";

const URLS = {
  AUTH: {
    REFRESH_TOKEN: "https://accounts.spotify.com/api/token",
    AUTHORIZE_URL: "https://accounts.spotify.com/authorize",
  },
  ACTIONS: {
    CURRENTLY_PLAYING: "/me/player/currently-playing",
    SEEK: "/me/player/seek",
    NEXT: "/me/player/next",
  },
  BASE: "https://api.spotify.com/v1",
} as const;

const CurrentlyPlayingSchema = nullable(
  object({
    progress_ms: number(),
    item: object({
      type: string(),
      name: string(),
      uri: string(),
      id: string(),
      duration_ms: number(),
      album: object({
        images: array(
          object({ height: number(), url: string(), width: number() })
        ),
      }),
    }),
    currently_playing_type: string(),
  })
);
const SpotifyAccessTokenSchema = object({
  access_token: string(),
  refresh_token: string(),
  token_type: string(),
  expires_in: number(),
});

const SpotifyRefreshTokenSchema = object({
  access_token: string(),
  token_type: string(),
  expires_in: number(),
});

export type SpotifyAccessTokenData = Output<typeof SpotifyAccessTokenSchema>;
export type SpotifyRefreshTokenData = Output<typeof SpotifyRefreshTokenSchema>;
export type CurrentlyPlayingData = Output<typeof CurrentlyPlayingSchema>;

const SpotifyErrorType = {
  NETWORK_ERROR: "NETWORK_ERROR",
  REQUEST_ERROR: "REQUEST_ERROR",
  RESPONSE_ERROR: "RESPONSE_ERROR",
} as const;

type SpotifyErrorType =
  (typeof SpotifyErrorType)[keyof typeof SpotifyErrorType];

class SpotifyError extends Error {
  type: SpotifyErrorType;
  extra?: Record<string, unknown>;
  cause?: any;

  constructor(
    type: SpotifyErrorType,
    message: string,
    cause: any,
    extra?: Record<string, unknown>
  ) {
    super(message);
    this.cause = cause;
    this.type = type;
    this.extra = extra;
  }

  static networkError(request: Request, error: any) {
    return new SpotifyError(SpotifyErrorType.NETWORK_ERROR, "", error, {
      request,
    });
  }

  static jsonParseError(response: Response, error: any) {
    return new SpotifyError(SpotifyErrorType.RESPONSE_ERROR, "", error, {
      response,
    });
  }

  static requestError(request: Request, response: Response) {
    return new SpotifyError(SpotifyErrorType.REQUEST_ERROR, "", null, {
      request,
      response,
    });
  }

  toString() {
    return `SpotifyError(${this.type}) Extra(${this.extra}) Cause(${this.cause}) Type(${this.type})`;
  }
}

async function apiRequest<T extends BaseSchema>(
  request: Request,
  schema: T
): Promise<Output<T>>;
async function apiRequest(request: Request): Promise<undefined>;
async function apiRequest<T extends BaseSchema>(
  request: Request,
  schema?: T
): Promise<typeof schema extends undefined ? undefined : Output<T>> {
  const response = await fetch(request).catch((networkError) => {
    throw SpotifyError.networkError(request, networkError);
  });
  if (!response.ok) {
    throw SpotifyError.requestError(request, response);
  }

  if (!schema) {
    return;
  }

  return await response
    .json()
    .then((json) => parse(schema, json))
    .catch((parseError) => {
      throw SpotifyError.jsonParseError(response, parseError);
    });
}

export async function exchangeSpotifyToken(
  code: string,
  credentials: SpotifyCredentials
): Promise<SpotifyAccessTokenData> {
  const url = new URL(URLS.AUTH.REFRESH_TOKEN);
  const authorizationHeader = btoa(
    `${credentials.client_id}:${credentials.client_secret}`
  );

  url.searchParams.append("grant_type", "authorization_code");
  url.searchParams.append("code", code);
  url.searchParams.append("redirect_uri", credentials.redirect_uri);

  const request = new Request(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorizationHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return await apiRequest(request, SpotifyAccessTokenSchema);
}

export async function refreshSpotifyToken(
  refreshToken: string
): Promise<SpotifyRefreshTokenData> {
  const url = new URL(URLS.AUTH.REFRESH_TOKEN);
  const credentials = getSpotifyCredentials(process.env.key as string);
  const authorizationHeader = btoa(
    `${credentials.client_id}:${credentials.client_secret}`
  );

  url.searchParams.append("grant_type", "refresh_token");
  url.searchParams.append("refresh_token", refreshToken);

  const request = new Request(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorizationHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return await apiRequest(request, SpotifyRefreshTokenSchema);
}

export async function currentlyPlaying(
  accessToken: string
): Promise<CurrentlyPlayingData> {
  const request = new Request(`${URLS.BASE}${URLS.ACTIONS.CURRENTLY_PLAYING}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await apiRequest(request, CurrentlyPlayingSchema);
}

export async function seek(
  position: number,
  accessToken: string
): Promise<undefined> {
  const url = new URL(`${URLS.BASE}${URLS.ACTIONS.SEEK}`);
  url.searchParams.append("position_ms", String(position));

  const request = new Request(url.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await apiRequest(request);
}

export async function next(accessToken: string): Promise<undefined> {
  const request = new Request(`${URLS.BASE}${URLS.ACTIONS.NEXT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await apiRequest(request);
}

export function createAuthorizationUrl(): string {
  const credentials = getSpotifyCredentials(process.env.key as string);
  const spotifyUrl = new URL("https://accounts.spotify.com/authorize");

  spotifyUrl.searchParams.append("response_type", "code");
  spotifyUrl.searchParams.append("client_id", credentials.client_id);
  spotifyUrl.searchParams.append("scope", credentials.scopes);
  spotifyUrl.searchParams.append("redirect_uri", credentials.redirect_uri);
  spotifyUrl.searchParams.append("state", "state-123");

  return spotifyUrl.toString();
}
