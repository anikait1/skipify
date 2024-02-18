// spotify API calls
// - Auth
// - Player

const ERRORS = {
  DEFAULT_NETWORK_ERROR: "[spotify api] network error occured",
  NOT_OK_RESPONSE_ERROR: "[spotify api] non ok response",
};

const SpotifyErrorType = {
  NETWORK_ERROR: "NETWORK_ERROR",
  REQUEST_ERROR: "REQUEST_ERROR",
  RESPONSE_ERROR: "RESPONSE_ERROR",
} as const;

type SpotifyErrorType =
  (typeof SpotifyErrorType)[keyof typeof SpotifyErrorType];

export class SpotifyError<T = Record<string, unknown>> extends Error {
  type: SpotifyErrorType;
  extra?: T;
  cause?: unknown;

  private constructor(
    type: SpotifyErrorType,
    message: string,
    cause: unknown,
    extra?: T
  ) {
    super(message);
    this.cause = cause;
    this.type = type;
    this.name = `SpotifyError-${type}`;
    this.extra = extra;
  }

  static networkError(request: Request, error?: unknown, message?: string) {
    return new SpotifyError<{request: Request}>(
      SpotifyErrorType.NETWORK_ERROR,
      message ?? ERRORS.DEFAULT_NETWORK_ERROR,
      error,
      { request }
    );
  }

  static requestError(request: Request, response: Response) {
    return new SpotifyError<{request: Request, response: Response}>(
      SpotifyErrorType.REQUEST_ERROR,
      ERRORS.NOT_OK_RESPONSE_ERROR,
      null,
      { request, response }
    );
  }
}

/**
 * @throws {SpotifyError}
 */
function apiRequest(request: Request, signal: AbortSignal) {
  return fetch(request, { signal })
    .then((response) => {
      if (!response.ok) {
        throw SpotifyError.requestError(request, response);
      }

      return response
    })
    .catch((networkError) => {
      throw SpotifyError.networkError(request, networkError);
    });
}

// spotify api actionss