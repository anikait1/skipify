import { Hono, MiddlewareHandler } from "hono";
import { serveStatic } from "hono/bun";
import { html } from "hono/html";
import { logger } from "hono/logger";
import {
  SpotifyTokens,
  getSpotifyCredentials,
  getSpotifyTokens,
  insertSpotifyTokens,
  updateSpotifyTokens,
} from "./database";
import {
  CurrentlyPlayingData,
  SpotifyAccessTokenData,
  createAuthorizationUrl,
  currentlyPlaying,
  exchangeSpotifyToken,
  refreshSpotifyToken,
} from "./spotify-api";
import { Layout } from "./components";
import { CurrentlyPlaying } from "./components/currently-playing";

// TODO - move middleware to separate file
const spotifyTokensMiddleware: MiddlewareHandler<{
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

const app = new Hono();
app.use("public/*", serveStatic({ root: "./src" }));
app.use("*", logger());

app.get("/currently-playing", spotifyTokensMiddleware, async (c) => {
  const tokens = c.var.spotifyTokens

  let currentTrack: CurrentlyPlayingData | null = null;
  try {
    currentTrack = await currentlyPlaying(tokens.access_token);
  } catch (error) {
    console.error("Unable to fetch current track");
  }

  return c.html(<CurrentlyPlaying currentTrack={currentTrack} startPoll={false} />);
});

app.get("/", spotifyTokensMiddleware, async (c) => {
  const tokens = c.var.spotifyTokens;
  let currentTrack: CurrentlyPlayingData | null = null;

  try {
    const refreshedTokens = await refreshSpotifyToken(tokens.refresh_token);
    updateSpotifyTokens(
      process.env.email as string,
      refreshedTokens.access_token
    );
    tokens.access_token = refreshedTokens.access_token;

    currentTrack = await currentlyPlaying(tokens.access_token);
  } catch (error) {
    console.error("Unable to get current track", error);
  }

  return c.html(<Layout currentTrack={currentTrack} startPoll={false}/>);
});

app.get("/spotify-redirect", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!state) {
    return c.html(
      html`<!DOCTYPE html>
        <h1>Something went wrong</h1>`
    );
  }

  let spotifyTokens: SpotifyAccessTokenData | undefined;
  try {
    const credentials = getSpotifyCredentials(process.env.key as string);
    spotifyTokens = await exchangeSpotifyToken(code as string, credentials);
  } catch (error) {
    console.error("Unable to generate spotify tokens", error);
    return c.html(
      html`<!DOCTYPE html>
        <h1>Something went wrong</h1>`
    );
  }

  insertSpotifyTokens(
    process.env.email as string,
    spotifyTokens.access_token,
    spotifyTokens.refresh_token
  );

  return c.html(
    html`<!DOCTYPE html>
      <h1>Successfully saved tokens</h1>`
  );
});

app.post("/start-poll", (c) => {
  return c.html(html`<h1>Server Sent html</h1>`);
});

export default {
  port: 8000,
  fetch: app.fetch,
};
