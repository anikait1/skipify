import {
    SpotifyAccessTokenSchema,
    SpotifyCurrentlyPlayingSchema,
    SpotifyTokenSchema,
} from "./schema";

export const SpotifyAPIErrorTypes = {
    NETWORK_ERROR: "NetworkError",
    REQUEST_ERROR: "RequestError",
    RESPONSE_ERROR: "ResponseError",
    REQUEST_ABORT_ERROR: "RequestAbortError",
} as const;
export type SpotifyAPIErrorType =
    (typeof SpotifyAPIErrorTypes)[keyof typeof SpotifyAPIErrorTypes];

export type SpotifyAPIErrorContextTypes = {
    NetworkError: { request: Request };
    RequestError: { request: Request; response: Response };
    ResponseError: {
        request: Request;
        response: Response;
        schema:
            | typeof SpotifyAccessTokenSchema
            | typeof SpotifyTokenSchema
            | typeof SpotifyCurrentlyPlayingSchema;
    };
    RequestAbortError: { request: Request };
};

type SpotifyAPIErrorContext<Type extends SpotifyAPIErrorType> =
    SpotifyAPIErrorContextTypes[Type];

export class SpotifyAPIError<
    ErrorType extends SpotifyAPIErrorType
> extends Error {
    type: ErrorType;
    context: SpotifyAPIErrorContext<ErrorType>;
    cause?: unknown;

    constructor(
        type: ErrorType,
        context: SpotifyAPIErrorContext<ErrorType>,
        cause?: unknown,
        message?: string
    ) {
        const errorMessage = typeof message === undefined ? type : message;
        super(errorMessage);

        this.type = type;
        this.context = context;
        this.cause = cause;
    }
}

export type SpotifyAPIErrorSet =
    | SpotifyAPIError<"NetworkError">
    | SpotifyAPIError<"RequestAbortError">
    | SpotifyAPIError<"RequestError">
    | SpotifyAPIError<"ResponseError">;

export class SpotifyAuthPreCondition extends Error {}

export const SpotifyAuthPreConditionTypes = {
    TOKENS_UNDEFINED: "TokensUndefined",
    SAVE_WITHOUT_REFRESH_TOKEN: "SaveWithoutRefreshToken"
} as const
