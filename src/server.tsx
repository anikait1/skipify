// import { Hono } from "hono";
// import { serveStatic } from "hono/bun";
// import { html } from "hono/html";
// import { logger } from "hono/logger";
// import { getSpotifyCredentials, insertSpotifyTokens } from "./database";
// import { SpotifyAccessTokenData, exchangeSpotifyToken } from "./spotify-api";
// import { Layout } from "./components";
// import {
//   CurrentTrackDetails,
//   CurrentlyPlaying,
// } from "./components/currently-playing";
// import { spotifyTokensMiddleware } from "./middleware/spotify-tokens-middleware";
// import { player, skipifySetupPoll, tokens } from "./skipify";
// import { addAutomation, playerPoll, stopPlayerPoll } from "./player";
// import { AutomationInput } from "./components/automation-input";
// import { AutomationList } from "./components/automation-list";

import { Hono } from "hono";
import { html } from "hono/html";

// const app = new Hono();
// skipifySetupPoll();

// app.use("public/*", serveStatic({ root: "./src" }));
// app.use("*", logger());

// app.get("/currently-playing", (c) => {
//   const currentTrack = player.currentlyPlaying;
//   return c.html(<CurrentTrackDetails currentTrack={currentTrack} />);
// });

// app.put("/toggle-player", async (c) => {
//   if (!tokens.authorized) {
//     throw new Error("Setup spotify tokens middleware");
//   }

//   if (player.timer) {
//     stopPlayerPoll(player);
//   } else {
//     await playerPoll(tokens, player);
//   }

//   console.log(player.timer);

//   return c.html(
//     <CurrentlyPlaying
//       currentTrack={player.currentlyPlaying}
//       polling={player.timer !== undefined}
//     />
//   );
// });

// app.post("/automations", async (c) => {
//   // TODO add valibot
//   const formData = await c.req.formData();
//   const automation = {
//     spotify_id: formData.get("spotify-track-id"),
//     name: formData.get("automation-name"),
//     action:
//       formData.get("automation-type") == "RANGE:START"
//         ? JSON.stringify({
//             type: "RANGE:START",
//             range: { start: formData.get("range-start") },
//           })
//         : JSON.stringify({
//             type: "RANGE:BETWEEN",
//             range: {
//               start: formData.get("range-start"),
//               stop: formData.get("range-stop"),
//             },
//           }),
//   };
//   addAutomation(player, automation as any);

//   c.header("HX-Trigger", "newAutomation");
//   return c.html(<AutomationInput />);
// });

// app.get("/automations", (c) => {
//   return c.html(<AutomationList />);
// });

// app.patch("/automation-input", async (c) => {
//   return c.html(<AutomationInput populateFields={true} />);
// });

// app.get("/", spotifyTokensMiddleware, async (c) => {
//   const code = c.req.query("code");
//   const state = c.req.query("state");

//   console.log(code, state)
//   return c.html(
//     html`<!DOCTYPE html>
//       <h1>Something went wrong</h1>`
//   );
  
//   // const automations = player.automations;
//   // const currentTrack = player.currentlyPlaying;

//   // return c.html(
//   //   <Layout
//   //     currentTrack={currentTrack}
//   //     polling={player.timer !== undefined}
//   //     automations={automations}
//   //   />
//   // );
// });

// app.get("/dump-player", (c) => {
//   console.log(player.timer);
//   return c.json(player);
// });

// app.get("/spotify-redirect", async (c) => {
  // const code = c.req.query("code");
  // const state = c.req.query("state");

  // if (!state) {
  //   return c.html(
  //     html`<!DOCTYPE html>
  //       <h1>Something went wrong</h1>`
  //   );
  // }

//   let spotifyTokens: SpotifyAccessTokenData | undefined;
//   try {
//     const credentials = getSpotifyCredentials(process.env.key as string);
//     spotifyTokens = await exchangeSpotifyToken(code as string, credentials);
//   } catch (error) {
//     console.error("Unable to generate spotify tokens", error);
//     return c.html(
//       html`<!DOCTYPE html>
//         <h1>Something went wrong</h1>`
//     );
//   }

//   insertSpotifyTokens(
//     process.env.email as string,
//     spotifyTokens.access_token,
//     spotifyTokens.refresh_token
//   );

//   return c.html(
//     html`<!DOCTYPE html>
//       <h1>Successfully saved tokens</h1>`
//   );
// });



const app = new Hono();

app.get("/", (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  console.log(code, state)

  return c.html(
    html`<!DOCTYPE html>
      <h1>Something went wrong</h1>`
  );
});


export default {
  port: 8000,
  fetch: app.fetch,
};