import { MiddlewareHandler } from "hono";
import { SpotifyTokens, getSpotifyTokens } from "../database";
import { createAuthorizationUrl } from "../spotify-api";

export const spotifyTokensMiddleware: MiddlewareHandler<{
  Variables: {
    spotifyTokens: SpotifyTokens;
  };
}> = async (c, next) => {
  const tokens = getSpotifyTokens(process.env.email as string);
  if (!tokens) {
    const spotifyAuthorizationUrl = createAuthorizationUrl();
    return c.redirect(spotifyAuthorizationUrl);
  }

  c.set("spotifyTokens", tokens);
  return await next();
};
