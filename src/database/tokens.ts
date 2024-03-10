import { Database } from "bun:sqlite";

const GET_TOKENS =
  "SELECT * FROM api_tokens WHERE user = $user AND deleted_at IS NULL";

const INSERT_TOKENS = `
  INSERT INTO api_tokens (user, access_token, refresh_token)
  VALUES ($user, $accessToken, $refreshToken)
  RETURNING *
`;

const UPDATE_ACCESS_TOKEN = `
  UPDATE api_tokens
  SET access_token = $accessToken, updated_at = (strftime('%s', 'now'))
  WHERE user = $user and deleted_at is NULL
  RETURNING *
`;

export type SpotifyAPITokens = {
  user: string;
  access_token: string;
  refresh_token: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export function getTokensByUser(
  database: Database,
  user: string
): SpotifyAPITokens | null {
  return database.query(GET_TOKENS).get({ $user: user }) as SpotifyAPITokens;
}

export function insertTokensForUser(
  database: Database,
  user: string,
  acessToken: string,
  refreshToken: string
): SpotifyAPITokens {
  return database.query(INSERT_TOKENS).get({
    $user: user,
    $accessToken: acessToken,
    $refreshToken: refreshToken,
  }) as SpotifyAPITokens;
}

export function updateAccessTokenForUser(
  database: Database,
  user: string,
  accessToken: string
): SpotifyAPITokens {
  return database.query(UPDATE_ACCESS_TOKEN).get({
    $user: user,
    $accessToken: accessToken,
  }) as SpotifyAPITokens;
}
