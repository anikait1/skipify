import { parse, object, number, string, Output, BaseSchema, nullable } from "valibot";

const URLS = {
  AUTH: {
    REFRESH_TOKEN: "https://accounts.spotify.com/api/token",
  },
  ACTIONS: {
    CURRENTLY_PLAYING: "/me/player/currently-playing",
    SEEK: "/me/player/seek",
    NEXT: "/me/player/next",
  },
  BASE: "https://api.spotify.com/v1",
} as const;

const CredentialsSchema = object({
  accessToken: string(),
  refreshToken: string(),
  clientId: string(),
  clientSecret: string(),
});
const CurrentlyPlayingSchema = nullable(object({
  progress_ms: number(),
  item: object({
    type: string(),
    name: string(),
    uri: string(),
    id: string(),
  }),
  currently_playing_type: string(),
}));
const SpotifyAccessTokenSchema = object({
  access_token: string(),
  token_type: string(),
  expires_in: number(),
});

export type CredentialsData = Output<typeof CredentialsSchema>;
type SpotifyAccessTokenData = Output<typeof SpotifyAccessTokenSchema>;
type CurrentlyPlayingData = Output<typeof CurrentlyPlayingSchema>;

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

  constructor(
    type: SpotifyErrorType,
    message: string,
    cause: any,
    extra?: Record<string, unknown>
  ) {
    super();
    console.log(message)
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
    return `SpotifyError(${this.type}) Extra(${this.extra}) Cause(${this.cause}) Type(${this.type})`
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

export async function refreshCredentials(
  credentials: CredentialsData
): Promise<void> {
  const url = new URL(URLS.AUTH.REFRESH_TOKEN);
  const authorizationHeader = btoa(
    `${credentials.clientId}:${credentials.clientSecret}`
  );

  url.searchParams.append("grant_type", "refresh_token");
  url.searchParams.append("refresh_token", credentials.refreshToken);

  const request = new Request(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorizationHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const accessToken: SpotifyAccessTokenData = await apiRequest(
    request,
    SpotifyAccessTokenSchema
  );
  credentials.accessToken = accessToken.access_token;
  console.debug(
    `Credentials successfully refreshed at ${Date.now()}, will expire in '${
      accessToken.expires_in
    }s'`
  );
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

export async function loadSpotifyCredentialsFromFile(
  filename: string
): Promise<CredentialsData> {
  const credentialsFile = Bun.file(filename);
  if ((await credentialsFile.exists()) === false) {
    console.error(`File '${filename}' does not exist.`);
    process.exit(1);
  }

  try {
    return parse(CredentialsSchema, await credentialsFile.json());
  } catch (error) {
    console.error(`Unable to parse file '${filename}' due to ${error}`);
    process.exit(1);
  }
}

export async function writeSpotifyCredentialsToFile(
  filename: string,
  credentials: CredentialsData
): Promise<void> {
  const credentialsFile = Bun.file(filename);
  if ((await credentialsFile.exists()) === false) {
    console.error(`File '${filename}' does not exist`);
    return;
  }

  try {
    const bytesWritten = await Bun.write(
      credentialsFile,
      JSON.stringify(credentials)
    );
    console.debug(`'${bytesWritten}' bytes written to file '${filename}'`);
  } catch (error) {
    console.error(
      `Unable to write credentials to file '${filename} due to ${error}`
    );
  }
}
