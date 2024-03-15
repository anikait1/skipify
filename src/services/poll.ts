import { logger } from "../lib/logger";
import * as SpotifyAPI from "./spotify/api";
import { SpotifyAPIErrorTypes } from "./spotify/error";
import { SpotifyCurrentlyPlaying } from "./spotify/schema";
import { match } from "oxide.ts";

const TOKEN_POLL_ERROR_COUNT = 3;
const TOKEN_POLL_TIMEOUT = 1_200_000; // 20 minutes (TODO - verify)
const TOKEN_POLL_REDUCED_TIMEOUT = 60_000; // 1 minute

// signifies the number of times polling needs to occur
// before stopping it, since no song was playing
const CURRENTLY_PLAYING_ERROR_COUNT = 3;
const CURRENTLY_PLAYING_EMPTY_RESPONSE_MAX_ATTEMPTS = 10;
const CURRENTLT_PLAYING_POLL_TIMEOUT = 1000; // 1 second

class Poller extends EventTarget {
    tokenTimer: Timer | undefined;
    currentlyPlayingTimer: Timer | undefined;
    tokenPollErrorCount: number;
    currentlyPlayingEmptyCount: number;
    currentlyPlayingErrorCount: number;

    constructor() {
        super();
        this.tokenTimer = undefined;
        this.currentlyPlayingTimer = undefined;
        this.tokenPollErrorCount = 0;
        this.currentlyPlayingEmptyCount = 0;
        this.currentlyPlayingErrorCount = 0;
    }

    async tokenPoll(
        clientID: string,
        clientSecret: string,
        refreshToken: string
    ) {
        const refreshAccessToken = await SpotifyAPI.refreshAccessToken(
            clientID,
            clientSecret,
            refreshToken
        );
        match(refreshAccessToken, {
            Err: (error) => {
                this.tokenPollErrorCount += 1;
                logger.warn({ error }, "unable to refresh access token");

                if (this.tokenPollErrorCount > TOKEN_POLL_ERROR_COUNT) {
                    this.dispatchEvent(
                        new Event(EventTypes.ACCESS_TOKEN_FAILED)
                    );

                    this.stopTokenPoll();
                    this.stopCurrentlyPlayingPoll();

                    return;
                }

                this.tokenTimer = setTimeout(
                    () => this.tokenPoll(clientID, clientSecret, refreshToken),
                    TOKEN_POLL_REDUCED_TIMEOUT
                );
                return;
            },
            Ok: (value) => {
                if (this.tokenPollErrorCount !== 0) {
                    this.tokenPollErrorCount = 0;
                }

                this.dispatchEvent(
                    new CustomEvent(EventTypes.ACCESS_TOKEN_SUCCESS, {
                        detail: { accessToken: value.access_token },
                    })
                );

                this.tokenTimer = setTimeout(
                    () => this.tokenPoll(clientID, clientSecret, refreshToken),
                    TOKEN_POLL_TIMEOUT
                );
            },
        });
    }

    stopTokenPoll() {
        if (this.tokenTimer === undefined) {
            logger.warn("no token poll setup");
            return;
        }

        clearTimeout(this.tokenTimer);
        this.tokenTimer = undefined;
        this.dispatchEvent(new Event(EventTypes.ACCESS_TOKEN_POLL_STOPPED))
    }

    async currentlyPlayingPoll(
        accessToken: string,
        signal: AbortSignal
    ): Promise<void | SpotifyCurrentlyPlaying> {
        const song = await SpotifyAPI.currentlyPlaying(accessToken, signal);
        match(song, {
            Err: (error) => {
                logger.warn(
                    { error },
                    "unable to fetch currently playing song"
                );
                if (error.type === SpotifyAPIErrorTypes.REQUEST_ABORT_ERROR) {
                    return;
                }

                this.currentlyPlayingErrorCount += 1;
                if (
                    this.currentlyPlayingErrorCount >
                    CURRENTLY_PLAYING_ERROR_COUNT
                ) {
                    this.stopCurrentlyPlayingPoll();
                    return;
                }
            },
            Ok: (value) => {
                if (value === null) {
                    this.currentlyPlayingEmptyCount += 1;
                    if (
                        this.currentlyPlayingEmptyCount >
                        CURRENTLY_PLAYING_EMPTY_RESPONSE_MAX_ATTEMPTS
                    ) {
                        this.dispatchEvent(
                            new Event(EventTypes.CURRENTLY_PLAYING_POLL_STOPPED)
                        );
                        return;
                    }

                    return;
                }

                if (this.currentlyPlayingEmptyCount !== 0) {
                    this.currentlyPlayingEmptyCount = 0;
                }

                this.dispatchEvent(
                    new CustomEvent(EventTypes.CURRENTLY_PLAYING, {
                        detail: { currentlyPlaying: song },
                    })
                );
                this.currentlyPlayingTimer = setTimeout(
                    () => this.currentlyPlayingPoll(accessToken, signal),
                    CURRENTLT_PLAYING_POLL_TIMEOUT
                );
            },
        });
    }

    stopCurrentlyPlayingPoll() {
        if (this.currentlyPlayingTimer === undefined) {
            logger.warn("no currently playing poll setup");
            return;
        }

        clearTimeout(this.currentlyPlayingTimer);
        this.currentlyPlayingTimer = undefined;
        this.dispatchEvent(new Event(EventTypes.CURRENTLY_PLAYING_POLL_STOPPED))
    }
}

export const EventTypes = {
    ACCESS_TOKEN_SUCCESS: "ACCESS_TOKEN_SUCCESS",
    ACCESS_TOKEN_FAILED: "ACCESS_TOKEN_FAILED",
    ACCESS_TOKEN_POLL_STOPPED: "ACCESS_TOKEN_POLL_STOPPED",

    CURRENTLY_PLAYING_POLL_STOPPED: "CURRENTLY_PLAYING_POLL_STOPPED",
    CURRENTLY_PLAYING: "CURRENTLY_PLAYING",
} as const;

export default new Poller();
