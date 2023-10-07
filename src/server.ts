import { Hono } from "hono";
import { html } from "hono/html";
import { logger } from "hono/logger";
import { getSpotifyTokens, insertSpotifyTokens } from "./database";
import {
  SpotifyAccessTokenData,
  createAuthorizationUrl,
  exchangeSpotifyToken,
} from "./spotify-api";

const app = new Hono();
app.use("*", logger());

app.get("/", (c) => {
  const tokens = getSpotifyTokens(process.env.email as string);
  if (!tokens) {
    const spotifyAuthorizationUrl = createAuthorizationUrl();
    return c.redirect(spotifyAuthorizationUrl);
  }

  return c.html(
    html`<!DOCTYPE html>
      <h1>Hello, World</h1>`
  );
});

app.get("/ping", (c) => {
  return c.html(
    html`<!DOCTYPE html>
      <h1>PONG</h1>`
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
    spotifyTokens = await exchangeSpotifyToken(code as string);
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
  )

  return c.html(
    html`<!DOCTYPE html>
      <h1>Successfully saved tokens</h1>`
  );
});

export default {
  port: 8000,
  fetch: app.fetch,
};
