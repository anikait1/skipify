import path from "node:path";
import { DB } from "./database";
import { SpotifyAPI, SpotifyAuth } from "./services/spotify/api";
import { Config } from "./services/config";
import { Player } from "./services/player";
import { consoleLogger } from "./lib/logger";

// validate env variables
const missingEnvVariables = [
  "SKIPIFY_DB",
  "CONFIG_FILE",
  "LOG_LEVEL",
  "LOG_FILE",
].filter(function keyExistenceInEnv(key) {
  return !(key in process.env);
});
if (missingEnvVariables.length > 0) {
  consoleLogger.error(
    { missingEnvVariables },
    "Environment variables are missing"
  );
  process.exit(1);
}

// construct filenames
const DB_FILENAME = path.resolve(
  import.meta.dir,
  `../${process.env.SKIPIFY_DB}`
);
const CONFIG_FILENAME = path.resolve(
  import.meta.dir,
  `../${process.env.CONFIG_FILE}`
);
const CREATE_TABLE_STATEMENT_PATH = `${import.meta.dir}/database/tables.sql`;

function exitProcessErrorHandler(error: unknown, message: string) {
  consoleLogger.error({ error }, message);
  process.exit(1);
}

// initialize database and config
const db = (await DB.initialize(DB_FILENAME, CREATE_TABLE_STATEMENT_PATH).catch(
  (error) => exitProcessErrorHandler(error, "Unable to setup database")
)) as DB;
const config = (await Config.initialize(CONFIG_FILENAME).catch((error) =>
  exitProcessErrorHandler(error, "Unable to setup configuration")
)) as Config;

const dbTokens = db.apiTokens();
const authTokens = dbTokens
  ? {
      accessToken: dbTokens.access_token,
      refreshToken: dbTokens.refresh_token,
      expiresAt: dbTokens.expires_at,
    }
  : null;

const auth = new SpotifyAuth(
  config.clientID,
  config.clientSecret,
  config.redirectURI,
  (accesstoken, expiry, refreshToken) => {
    if (!refreshToken) {
      db.updateAccessToken(accesstoken, expiry);
      return;
    }

    db.insertTokens(accesstoken, refreshToken, expiry);
  },
  authTokens
);

const controller = new AbortController();
const api = new SpotifyAPI(
  "https://api.spotify.com/v1",
  auth,
  controller.signal
);
const player = new Player(api, db.getAutomations());
player.poll();

export { auth, api, player };
