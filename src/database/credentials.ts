import Database from "bun:sqlite";

const GET_CREDENTIALS =
  "SELECT * FROM api_credentials WHERE user = $credential_user AND deleted_at IS NULL";

export type SpotifyAPICredentials = {
  credential_id: number;
  user: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export function getCredentialsByName(
  database: Database,
  user: string
): SpotifyAPICredentials | null {
  return database
    .query(GET_CREDENTIALS)
    .get({ $credential_user: user }) as SpotifyAPICredentials;
}
