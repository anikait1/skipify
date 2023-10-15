import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { html } from "hono/html";
import { logger } from "hono/logger";
import {
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
import { FC } from "hono/jsx";
import DummyLayout from "./components";
import { CurrentlyPlaying } from "./components/currently-playing";

const app = new Hono();
app.use("public/*", serveStatic({ root: "./src" }));
app.use("*", logger());


const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Skipify</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css"
        />
        <script src="https://unpkg.com/htmx.org@1.9.6"></script>
      </head>
      <body>{props.children}</body>
    </html>
  );
};

const Nav: FC = () => {
  return (
    <nav>
      <ul>
        <li style="text:center">
          <strong>Skipify</strong>
        </li>
      </ul>
    </nav>
  );
};

const HomePage = (props: { currenTrack: CurrentlyPlayingData }) => {
  return (
    <Layout>
      <main class="container">
        <Nav />
        <button
          role="button"
          class="secondary"
          hx-post="/start-poll"
          hx-swap="outerHTML"
        >
          Start Poll
        </button>
        <button
          role="button"
          hx-trigger="click"
          hx-post="/currently-playing"
          hx-target="#currently-playing"
          hx-swap="outerHTML"
        >
          Fetch Current Playing
        </button>
        <CurrentlyPlaying currentTrack={props.currenTrack} />
      </main>
    </Layout>
  );
};

app.get("/dump", async (c) => {
  const tokens = getSpotifyTokens(process.env.email as string);

  const currentTrack = await currentlyPlaying(tokens!.access_token)
  console.log(currentTrack)
  return c.html(<DummyLayout currentTrack={currentTrack}/>)
})

app.get("/currently-playing", async (c) => {
  const start = performance.now();
  const tokens = getSpotifyTokens(process.env.email as string);
  console.log(performance.now() - start);

  let currentTrack: CurrentlyPlayingData | null = null;
  try {
    currentTrack = await currentlyPlaying(tokens!.access_token);
  } catch (error) {
    console.error("Unable to fetch current track");
  }

  return c.html(<CurrentlyPlaying currentTrack={currentTrack} />);
});

app.get("/", async (c) => {
  const tokens = getSpotifyTokens(process.env.email as string);
  if (!tokens) {
    const spotifyAuthorizationUrl = createAuthorizationUrl();
    return c.redirect(spotifyAuthorizationUrl);
  }

  let currentTrack: CurrentlyPlayingData | null = null;
  try {
    const refreshedTokens = await refreshSpotifyToken(tokens.refresh_token)
    updateSpotifyTokens(process.env.email as string, refreshedTokens.access_token)
    tokens.access_token = refreshedTokens.access_token

    currentTrack = await currentlyPlaying(tokens.access_token);
    console.log(currentTrack);
  } catch (error) {
    console.error("Unable to get current track");
  }

  return c.html(<HomePage currenTrack={currentTrack} />);
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
