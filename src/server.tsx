import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { html } from "hono/html";
import { logger } from "hono/logger";
import { getSpotifyCredentials, insertSpotifyTokens } from "./database";
import { SpotifyAccessTokenData, exchangeSpotifyToken } from "./spotify-api";
import { Layout } from "./components";
import { CurrentlyPlaying } from "./components/currently-playing";
import { spotifyTokensMiddleware } from "./middleware/spotify-tokens-middleware";
import { player, skipifySetupPoll } from "./skipify";

const app = new Hono();
skipifySetupPoll()

app.use("public/*", serveStatic({ root: "./src" }));
app.use("*", logger());

app.get("/currently-playing", (c) => {
  const currentTrack = player.currentlyPlaying;
  return c.html(
    <CurrentlyPlaying
      currentTrack={currentTrack}
      startPoll={currentTrack !== null}
    />
  );
});

app.get("/", spotifyTokensMiddleware, async (c) => {
  const automations = player.automations;
  const currentTrack = player.currentlyPlaying;

  return c.html(
    <Layout
      currentTrack={currentTrack}
      startPoll={currentTrack !== null}
      automations={automations}
    />
  );
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

export default {
  port: 8000,
  fetch: app.fetch,
};
