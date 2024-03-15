import Database from "bun:sqlite";
import { SpotifyAPITokens } from "./schema";

const GET_TOKENS =
    "SELECT * FROM api_tokens WHERE deleted_at IS NULL";
export function getActiveTokens(
    database: Database,
): SpotifyAPITokens | null {
    return database
        .query(GET_TOKENS)
        .get() as SpotifyAPITokens;
}

const INSERT_TOKENS = `
  INSERT INTO api_tokens (user_id, access_token, refresh_token)
  VALUES ($user_id, $access_token, $refresh_token)
  RETURNING *
`;
export function insertTokensForUserID(
    database: Database,
    userID: number,
    acessToken: string,
    refreshToken: string
): SpotifyAPITokens {
    return database.query(INSERT_TOKENS).get({
        $user_id: userID,
        $access_token: acessToken,
        $refresh_token: refreshToken,
    }) as SpotifyAPITokens;
}

const UPDATE_ACCESS_TOKEN = `
  UPDATE api_tokens
  SET access_token = $access_token, updated_at = (strftime('%s', 'now'))
  WHERE user_id = $user_id and deleted_at is NULL
  RETURNING *
`;
export function updateAccessToken(
    database: Database,
    accessToken: string
): SpotifyAPITokens {
    return database.query(UPDATE_ACCESS_TOKEN).get({
        $access_token: accessToken,
    }) as SpotifyAPITokens;
}
