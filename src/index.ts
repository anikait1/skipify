/**
 * Initialize the database
 * Read credentials
 * In case
 */

import Database from "bun:sqlite";
import {
  SpotifyAPICredentials,
  getCredentialsByName,
} from "./database/credentials";
import { setupDB } from "./database/setup";
import { logger } from "./lib/logger";
import {
  SpotifyAPITokens,
  getTokensByUser,
  updateAccessTokenForUser,
} from "./database/tokens";
import * as SpotifyAPI from "./services/spotify/api";
import { EventEmitter } from "stream";
import { Poller } from "./services/poll";

// TODO - fix the file path for `CREATE_TABLE_STATEMENT_PATH`
const DB_FILENAME = "skipify.sqlite";
const CREATE_TABLE_STATEMENT_PATH = `${import.meta.dir}/tables.sql`;
const USER = "anikait";

let db: Database;
try {
  db = await setupDB(DB_FILENAME, CREATE_TABLE_STATEMENT_PATH);
} catch (error) {
  logger.error(
    { error, dbFilename: DB_FILENAME, sqlFile: CREATE_TABLE_STATEMENT_PATH },
    "unable to setup the database"
  );
  process.exit(1);
}
const target = new EventTarget()
const abortController = new AbortController()

const stage = SpotifyAPI.apiIntegrationStage(USER, db)
if (stage === "COMPLETE") {
  const poller = new Poller(target)

  poller.tokenPoll("", "")
  poller.currentlyPlayingPoll("", abortController.signal)

}




