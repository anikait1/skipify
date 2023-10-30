import { Database } from "bun:sqlite";

const databaseName = process.env.SKIPIFY_DB;

export const db = new Database(databaseName);

export type SpotifyCredentials = {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string;
};

export type SpotifyTokens = {
  access_token: string;
  refresh_token: string;
  refreshed_at: number;
};

export type AutomationDB = Omit<Automation, "action"> & { action: string };

export type Automation = {
  spotify_id: string;
  name: string;
  action:
    | { type: "RANGE:START"; range: { start: number } }
    | { type: "RANGE:BETWEEN"; range: { start: number; stop: number } };
};

const GET_CREDENTIALS_QUERY =
  "SELECT client_id, client_secret, redirect_uri, scopes FROM spotify_credentials WHERE key = $key";

const GET_TOKENS_BY_EMAIL_QUERY =
  "SELECT access_token, refresh_token, refreshed_at FROM spotify_tokens WHERE email = $email";

const UPDATE_TOKENS = `
  UPDATE spotify_tokens
  SET access_token = $access_token, refreshed_at = $refreshed_at
  WHERE email = $email
`;

const INSERT_TOKENS = `
  INSERT INTO spotify_tokens (email, access_token, refresh_token, refreshed_at)
  VALUES ($email, $access_token, $refresh_token, $refreshed_at)
`;

const INSERT_AUTOMATION = `
  INSERT INTO automations (spotify_id, name, action)
  VALUES ($spotify_id, $name, $action)
`
const GET_AUTOMATION_BY_SPOTIFY_TRACK_ID = `SELECT * FROM automations WHERE spotify_id = $spotify_id`;
const GET_ALL_AUTOMATIONS = `SELECT * FROM automations`;

let credentials: undefined | SpotifyCredentials;
export function getSpotifyCredentials(
  key: string,
  forceRefresh: boolean = false
): SpotifyCredentials {
  if (!credentials || forceRefresh) {
    credentials = db
      .query(GET_CREDENTIALS_QUERY)
      .get({ $key: key }) as SpotifyCredentials;
  }

  return credentials;
}

export function getSpotifyTokens(email: string): SpotifyTokens | null {
  return db
    .query(GET_TOKENS_BY_EMAIL_QUERY)
    .get({ $email: email }) as SpotifyTokens;
}

export function updateSpotifyTokens(
  email: string,
  accessToken: string,
  refreshedAt: number
) {
  return db.query(UPDATE_TOKENS).get({
    $email: email,
    $access_token: accessToken,
    $refreshed_at: refreshedAt,
  });
}

export function insertSpotifyTokens(
  email: string,
  accessToken: string,
  refreshToken: string
) {
  return db.query(INSERT_TOKENS).get({
    $email: email,
    $access_token: accessToken,
    $refresh_token: refreshToken,
    $refreshed_at: Date.now(),
  });
}

export function getAutomationForTrack(spotify_id: string): Automation | null {
  return db
    .query(GET_AUTOMATION_BY_SPOTIFY_TRACK_ID)
    .get({ $spotify_id: spotify_id }) as Automation;
}

export function getAllAutomations(): Automation[] {
  const automations = db.query(GET_ALL_AUTOMATIONS).all() as AutomationDB[];
  for (const automation of automations) {
    automation.action = JSON.parse(automation.action);
  }
  return automations as unknown as Automation[];
}

export function insertAutomation(automation: AutomationDB) {
  return db.query(INSERT_AUTOMATION).get({
    $spotify_id: automation.spotify_id,
    $name: automation.name,
    $action: automation.action
  })
}