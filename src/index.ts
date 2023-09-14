import {
  CredentialsData,
  currentlyPlaying,
  loadSpotifyCredentialsFromFile,
  refreshCredentials,
  writeSpotifyCredentialsToFile,
} from "./spotify-api";
import { Track, readTracksFromFile } from "./track";
import { playerEventEmitter } from "./player";

const CREDENTIALS_FILE = process.argv[2] || "./config/credentials.json";
const TRACKS_LIST_FILE = process.argv[3] || "./config/tracks-list.json";

const CREDENTIALS_CONFIG = {
  file: process.argv[2] || "./config/credentials.json",
  refreshAttempts: 2,
  refreshInterval: 30_00_000, // 50 minutes

  reset() {
    this.refreshAttempts = 2;
    this.refreshInterval = 30_00_000;
  },

  adjustForRetry() {
    this.refreshAttempts = this.refreshAttempts - 1;
    this.refreshInterval = 300_000; // 5 minutes
  },
};

setupPolling().catch((error) => {
  console.error(`Unknown error occured, ${error}`);
});

async function refreshCredentialsPoll(credentials: CredentialsData) {
  if (CREDENTIALS_CONFIG.refreshAttempts <= 0) {
    console.error("Refresh credentials attempts exhausted");
    process.exit(1);
  }

  try {
    await refreshCredentials(credentials);
    CREDENTIALS_CONFIG.reset();
  } catch (error) {
    console.warn(`Unable to refresh credentials due to ${error}`);
    CREDENTIALS_CONFIG.adjustForRetry();
  }

  writeSpotifyCredentialsToFile(CREDENTIALS_CONFIG.file, credentials);

  setTimeout(
    refreshCredentialsPoll,
    CREDENTIALS_CONFIG.refreshInterval,
    credentials
  );
}

async function currentlyPlayingPoll(
  accessToken: string,
  tracks: Map<string, Track>
) {
  try {
    const currentTrack = await currentlyPlaying(accessToken);
    if (currentTrack) {
      playerEventEmitter.emit(
        "track-progress",
        {
          state: "PLAYING",
          track: {
            id: currentTrack.item.uri,
            name: currentTrack.item.name,
            progress: currentTrack.progress_ms,
          },
        },
        tracks,
        accessToken
      );
    }
  } catch (error) {
    console.error(`Unable to fetch current track from spotify ${error}`);
  }

  setTimeout(currentlyPlayingPoll, 1000, accessToken, tracks);
}

async function setupPolling() {
  const credentials: CredentialsData = await loadSpotifyCredentialsFromFile(
    CREDENTIALS_FILE
  );
  const tracks: Map<string, Track> = await readTracksFromFile(TRACKS_LIST_FILE);

  refreshCredentialsPoll(credentials);
  currentlyPlayingPoll(credentials.accessToken, tracks);
}
