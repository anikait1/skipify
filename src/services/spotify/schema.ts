import { Output, array, number, object, string } from "valibot";

export const SpotifyAccessTokenSchema = object({
  access_token: string(),
  token_type: string(),
  expires_in: number(),
});
export type SpotifyAccessToken = Output<typeof SpotifyAccessTokenSchema>;

export const SpotifyTokenSchema = object({
  access_token: string(),
  refresh_token: string(),
  token_type: string(),
  expires_in: number(),
});
export type SpotifyToken = Output<typeof SpotifyTokenSchema>;

export const SpotifyCurrentlyPlayingSchema = object({
  progress_ms: number(),
  item: object({
    type: string(),
    name: string(),
    uri: string(),
    id: string(),
    duration_ms: number(),
    album: object({
      images: array(
        object({ height: number(), url: string(), width: number() })
      ),
    }),
  }),
  currently_playing_type: string(),
});
export type SpotifyCurrentlyPlaying = Output<typeof SpotifyCurrentlyPlayingSchema>;

