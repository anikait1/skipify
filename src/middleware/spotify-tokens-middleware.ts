import { MiddlewareHandler } from "hono";
import { createAuthorizationUrl } from "../spotify-api";
import { Skipify } from "../skipify";
import { AuthorizedTokens } from "../tokens";

export const spotifyTokensMiddleware: MiddlewareHandler<{
  Variables: {
    spotifyTokens: AuthorizedTokens;
  };
}> = async (c, next) => {
  if (!Skipify.tokens.authorized) {
    const spotifyAuthorizationUrl = createAuthorizationUrl();
    return c.redirect(spotifyAuthorizationUrl);
  }

  c.set("spotifyTokens", Skipify.tokens);
  return await next();
};
