import { MiddlewareHandler } from "hono";
import { createAuthorizationUrl } from "../spotify-api";
import { tokens } from "../skipify";
import { AuthorizedTokens } from "../tokens";

export const spotifyTokensMiddleware: MiddlewareHandler<{
  Variables: {
    spotifyTokens: AuthorizedTokens;
  };
}> = async (c, next) => {
  if (!tokens.authorized) {
    const spotifyAuthorizationUrl = createAuthorizationUrl();
    return c.redirect(spotifyAuthorizationUrl);
  }

  c.set("spotifyTokens", tokens);
  return await next();
};
