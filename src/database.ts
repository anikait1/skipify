import { Database } from "bun:sqlite";

const databaseName = process.env.SKIPIFY_DB;

export const db = new Database(databaseName);
const GET_CREDENTIALS_QUERY =
  "SELECT client_id, client_secret, redirect_uri, scopes FROM spotify_credentials WHERE key = $key";

const GET_TOKENS_BY_EMAIL_QUERY =
  "SELECT access_token, refresh_token FROM spotify_tokens WHERE email = $email";

const UPDATE_TOKENS = `
  UPDATE spotify_tokens
  SET access_token = $access_token
  WHERE email = $email
`;

const INSERT_TOKENS = `
  INSERT INTO spotify_tokens (email, access_token, refresh_token)
  VALUES ($email, $access_token, $refresh_token)
`;

export type SpotifyCredentials = {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string;
};

type SpotifyTokens = {
  access_token: string;
  refresh_token: string;
};

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

export function updateSpotifyTokens(email: string, accessToken: string) {
  return db.query(UPDATE_TOKENS).get({ $email: email, $access_token: accessToken });
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
  });
}
