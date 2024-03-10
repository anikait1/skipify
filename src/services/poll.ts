import { logger } from "../lib/logger";
import * as SpotifyAPI from "./spotify/api";

const TOKEN_POLL_ERROR_COUNT = 3;
const TOKEN_POLL_TIMEOUT = 1_200_000; // 20 minutes (TODO - verify)
const TOKEN_POLL_REDUCED_TIMEOUT = 60_000; // 1 minute

// signifies the number of times polling needs to occur
// before stopping it, since no song was playing
const CURRENTLY_PLAYING_EMPTY_RESPONSE_MAX_ATTEMPTS = 10;
const CURRENTLT_PLAYING_POLL_TIMEOUT = 1000; // 1 second

export class Poller {
  tokenTimer: Timer | undefined;
  currentlyPlayingTimer: Timer | undefined;
  tokenPollErrorCount: number;
  currentlyPlayingEmptyCount: number;
  emitter: EventTarget;

  constructor(emitter: EventTarget) {
    this.tokenTimer = undefined;
    this.currentlyPlayingTimer = undefined;
    this.tokenPollErrorCount = 0;
    this.currentlyPlayingEmptyCount = 0;
    this.emitter = emitter;
  }

  async tokenPoll(clientID: string, refreshToken: string): Promise<void> {
    const wrappedRefreshedTokens = await SpotifyAPI.refreshAccessToken(
      clientID,
      refreshToken
    );
    if (wrappedRefreshedTokens.isErr()) {
      this.tokenPollErrorCount += 1;
      const error = wrappedRefreshedTokens.unwrapErr();
      logger.warn({ error });

      // retry attempts exceeded
      // fire the event to indicate failure to issue new token
      // clear the timeouts
      if (this.tokenPollErrorCount > TOKEN_POLL_ERROR_COUNT) {
        this.emitter.dispatchEvent(new Event(EventTypes.ACCESS_TOKEN_FAILED));

        clearTimeout(this.currentlyPlayingTimer);
        clearTimeout(this.tokenTimer);

        return;
      }

      // failure to issue new token, retry with a shorter frequency
      this.tokenTimer = setTimeout(
        () => this.tokenPoll(clientID, refreshToken),
        TOKEN_POLL_REDUCED_TIMEOUT
      );

      return;
    }

    const refreshedTokens = wrappedRefreshedTokens.unwrap();
    if (this.tokenPollErrorCount !== 0) {
      this.tokenPollErrorCount = 0;
    }

    this.emitter.dispatchEvent(
      new CustomEvent(EventTypes.ACCESS_TOKEN_SUCCESS, {
        detail: { accessToken: refreshedTokens.access_token },
      })
    );

    this.tokenTimer = setTimeout(
      () => this.tokenPoll(clientID, refreshToken),
      TOKEN_POLL_TIMEOUT
    );
  }

  async currentlyPlayingPoll(accessToken: string, signal: AbortSignal) {
    const wrappedSong = await SpotifyAPI.currentlyPlaying(accessToken, signal);
    if (wrappedSong.isErr()) {
      return;
    }

    const song = wrappedSong.unwrap();
    if (song === null) {
      if (
        this.currentlyPlayingEmptyCount >
        CURRENTLY_PLAYING_EMPTY_RESPONSE_MAX_ATTEMPTS
      ) {
        // possible log (TODO)
        clearTimeout(this.currentlyPlayingTimer);
        this.emitter.dispatchEvent(
          new Event(EventTypes.CURRENTLY_PLAYING_POLL_STOPPED)
        );
        return;
      }

      this.currentlyPlayingEmptyCount += 1;
    }

    if (this.currentlyPlayingEmptyCount !== 0) {
      this.currentlyPlayingEmptyCount = 0;
    }

    this.emitter.dispatchEvent(
      new CustomEvent(EventTypes.CURRENTLY_PLAYING, {
        detail: { currentlyPlaying: song },
      })
    );
    this.currentlyPlayingTimer = setTimeout(
      () => this.currentlyPlayingPoll(accessToken, signal),
      CURRENTLT_PLAYING_POLL_TIMEOUT
    );
  }
}

export function setupPolling(
  eventTarget: EventTarget,
  
) {
  const poller = new Poller(eventTarget);
}

const EventTypes = {
  ACCESS_TOKEN_SUCCESS: "ACCESS_TOKEN_SUCCESS",
  ACCESS_TOKEN_FAILED: "ACCESS_TOKEN_FAILED",

  CURRENTLY_PLAYING_POLL_STOPPED: "CURRENTLY_PLAYING_POLL_STOPPED",
  CURRENTLY_PLAYING: "CURRENTLY_PLAYING",
} as const;
