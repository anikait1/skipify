import { logger } from "./lib/logger";
import { setupDB } from "./database/setup";
import { setupConfig } from "./services/config";
import Poller, { EventTypes } from "./services/poll";
import { Player } from "./services/player";
import { getActiveTokens, updateAccessToken } from "./database/queries";
import { SpotifyCurrentlyPlaying } from "./services/spotify/schema";

// TODO - filenames
const DB_FILENAME = "skipify.sqlite";
const CONFIG_FILENAME =
    "";
const CREATE_TABLE_STATEMENT_PATH =
    "";

const wrappedDB = await setupDB(DB_FILENAME, CREATE_TABLE_STATEMENT_PATH);
if (wrappedDB.isErr()) {
    const error = wrappedDB.unwrapErr();

    logger.error(
        {
            error,
            filename: DB_FILENAME,
            sqlTablesFile: CREATE_TABLE_STATEMENT_PATH,
        },
        "unable to setup the database"
    );
    process.exit(1);
}
const db = wrappedDB.unwrap();

const wrappedConfig = await setupConfig(CONFIG_FILENAME);
if (wrappedConfig.isErr()) {
    const error = wrappedConfig.unwrapErr();

    logger.error({ error }, "unable to load config");
    process.exit(1);
}
const config = wrappedConfig.unwrap();
logger.info({ config, db });

const tokens = getActiveTokens(db);
const player = new Player([], "", new AbortController().signal);



Poller.addEventListener(EventTypes.ACCESS_TOKEN_FAILED, () => {});

Poller.addEventListener(EventTypes.ACCESS_TOKEN_SUCCESS, (event: Event) => {
    const customEvent = event as CustomEvent<{ accessToken: string }>;

    player.accessToken = customEvent.detail.accessToken;
    updateAccessToken(db, customEvent.detail.accessToken);
});

Poller.addEventListener(EventTypes.CURRENTLY_PLAYING, (event: Event) => {
    const customEvent = event as CustomEvent<{
        currentlyPlaying: SpotifyCurrentlyPlaying;
    }>;

    player.currentlyPlaying = customEvent.detail.currentlyPlaying;
    player.applyAutomation()
});
Poller.addEventListener(EventTypes.CURRENTLY_PLAYING_POLL_STOPPED, () => {});

export { db, config };
