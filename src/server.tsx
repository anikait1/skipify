import { Hono } from "hono";
import { html } from "hono/html";
import { api, auth, player } from ".";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.use("/public/*", serveStatic({
  root: "./"
}))

app.get("/playing", (c) => {
  return c.json(player.currentTrack)
})

const Page = () => (
  <html>
    <head>
    <script src="public/script.js">
    </script>
    </head>
    <body>
    <h1>
    Hi
  </h1>
    </body>
  </html>
)

app.get("/", (c) => {
  return c.html(Page())
})

export default {
  port: 8000,
  fetch: app.fetch,
};