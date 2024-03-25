import {
  SpotifyAPIError,
  SpotifyAPIErrorTypes,
  SpotifyAuthPreCondition,
  SpotifyAuthPreConditionTypes,
} from "./error";
import { parse } from "valibot";
import {
  SpotifyAccessTokenSchema,
  SpotifyCurrentlyPlaying,
  SpotifyCurrentlyPlayingSchema,
  SpotifyTokenSchema,
} from "./schema";
import { fileLogger } from "../../lib/logger";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export class SpotifyAuth {
  constructor(
    private clientID: string,
    private clientSecret: string,
    private redirectURI: string,
    private postTokenAction: (
      accessToken: string,
      expiry: number,
      refreshToken?: string
    ) => void,
    private tokens: AuthTokens | null = null
  ) {}
  static authorizationURL = "https://accounts.spotify.com/authorize";
  static accessTokenURL = "https://accounts.spotify.com/api/token";
  static accessTokenExpiryInterval = 3_000_000; // 3000s in milliseconds
  static scopes = [
    "user-read-playback-state",
    "user-read-playback-state",
    "user-read-currently-playing",
  ];

  createAuthorizationURL(scopes: string[], state: string): string {
    const params = new URLSearchParams();
    params.append("response_type", "code");
    params.append("client_id", this.clientID);
    params.append("scope", scopes.join(" "));
    params.append("redirect_uri", this.redirectURI);
    params.append("state", state);

    return `${SpotifyAuth.authorizationURL}?${params.toString()}`;
  }

  /**
   * Get the token set from spotify after the initial authorization
   * @param authorizationCode the code given by spotify after  successful authorization
   * @throws {SpotifyAPIError}
   */
  async exchangeCodeForToken(authorizationCode: string): Promise<void> {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", authorizationCode);
    params.append("redirect_uri", this.redirectURI);

    const request = new Request(SpotifyAuth.accessTokenURL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${this.clientID}:${this.clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    let response: Response;
    try {
      response = await fetch(request);
    } catch (error) {
      throw new SpotifyAPIError(
        SpotifyAPIErrorTypes.NETWORK_ERROR,
        { request },
        error
      );
    }

    if (!response.ok) {
      throw new SpotifyAPIError(SpotifyAPIErrorTypes.REQUEST_ERROR, {
        request,
        response,
      });
    }

    try {
      const tokens = parse(SpotifyTokenSchema, await response.json());
      this.storeTokens(
        tokens.access_token,
        tokens.expires_in,
        tokens.refresh_token
      );
    } catch (error) {
      throw new SpotifyAPIError(SpotifyAPIErrorTypes.RESPONSE_ERROR, {
        request,
        response,
        schema: SpotifyTokenSchema,
      });
    }
  }

  /**
   * @throws {SpotifyAuthPreCondition | SpotifyAPIError}
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.tokens) {
      throw new SpotifyAuthPreCondition(
        SpotifyAuthPreConditionTypes.TOKENS_UNDEFINED
      );
    }

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", this.tokens.refreshToken);
    params.append("client_id", this.clientID);

    const request = new Request(SpotifyAuth.accessTokenURL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${this.clientID}:${this.clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    let response: Response;
    try {
      response = await fetch(request);
    } catch (error) {
      throw new SpotifyAPIError(
        SpotifyAPIErrorTypes.NETWORK_ERROR,
        { request },
        error
      );
    }

    if (!response.ok) {
      throw new SpotifyAPIError(SpotifyAPIErrorTypes.REQUEST_ERROR, {
        request,
        response,
      });
    }

    try {
      const tokens = parse(SpotifyAccessTokenSchema, await response.json());

      this.storeTokens(tokens.access_token, tokens.expires_in);
    } catch (error) {
      throw new SpotifyAPIError(
        SpotifyAPIErrorTypes.RESPONSE_ERROR,
        {
          request,
          response,
          schema: SpotifyAccessTokenSchema,
        },
        error
      );
    }
  }

  /**
   * @throws {SpotifyAuthPreCondition}
   */
  get accessToken(): string {
    if (!this.tokens) {
      throw new SpotifyAuthPreCondition(
        SpotifyAuthPreConditionTypes.TOKENS_UNDEFINED
      );
    }

    const refreshToken =
      this.tokens.expiresAt - Date.now() <
      SpotifyAuth.accessTokenExpiryInterval;

    if (refreshToken) {
      this.refreshAccessToken().catch((error) => {
        fileLogger.error({ error }, "unable to refersh access token");
      });
    }

    return this.tokens.accessToken;
  }

  /**
   *
   * @param accessToken
   * @param expiry
   * @param refreshToken
   * @throws {SpotifyAuthPreCondition}
   */
  private storeTokens(
    accessToken: string,
    expiry: number,
    refreshToken?: string
  ): void {
    // expiry is sent in seconds, need to adjust it to milliseconds
    const expiresAt = Date.now() + expiry * 1000;
    if (!this.tokens) {
      if (!refreshToken) {
        throw new SpotifyAuthPreCondition(
          SpotifyAuthPreConditionTypes.SAVE_WITHOUT_REFRESH_TOKEN
        );
      }

      this.tokens = {
        accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
      };
    } else {
      this.tokens.accessToken = accessToken;
      this.tokens.expiresAt = expiresAt;
      if (refreshToken) {
        this.tokens.refreshToken = refreshToken;
      }
    }

    this.postTokenAction(accessToken, expiresAt, refreshToken);
  }
}

export class SpotifyAPI {
  constructor(
    private baseUrl: string,
    private auth: SpotifyAuth,
    private signal: AbortSignal
  ) {}

  private async apiRequest(request: Request): Promise<Response> {
    const accessToken = this.auth.accessToken;
    request.headers.append("Content-Type", "application/json");
    request.headers.append("Authorization", `Bearer ${accessToken}`);

    let response: Response;
    try {
      response = await fetch(request, { signal: this.signal });
    } catch (error) {
      if (request.signal.aborted) {
        throw new SpotifyAPIError(
          SpotifyAPIErrorTypes.REQUEST_ABORT_ERROR,
          { request },
          error
        );
      }

      throw new SpotifyAPIError(
        SpotifyAPIErrorTypes.NETWORK_ERROR,
        { request },
        error
      );
    }

    if (!response.ok) {
      throw new SpotifyAPIError(SpotifyAPIErrorTypes.REQUEST_ERROR, {
        request,
        response,
      });
    }

    return response;
  }

  async currentlyPlaying(): Promise<SpotifyCurrentlyPlaying | null> {
    const request = new Request(`${this.baseUrl}/me/player/currently-playing`);
    const response = await this.apiRequest(request);

    if (response.status === 204) {
      return null;
    }

    try {
      return parse(SpotifyCurrentlyPlayingSchema, await response.json());
    } catch (error) {
      throw new SpotifyAPIError(SpotifyAPIErrorTypes.RESPONSE_ERROR, {
        request,
        response,
        schema: SpotifyCurrentlyPlayingSchema,
      });
    }
  }

  async seek(position: number) {
    const url = new URL(`${this.baseUrl}/me/player/seek`);
    url.searchParams.append("position_ms", `${position}`);
    const request = new Request(url.toString(), {
      method: "PUT",
    });

    await this.apiRequest(request);
    return null;
  }

  async next() {
    const request = new Request(`${this.baseUrl}/me/player/next`, {
      method: "POST",
    });
    await this.apiRequest(request);

    return null;
  }
}
