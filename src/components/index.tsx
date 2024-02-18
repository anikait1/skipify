import { FC } from "hono/jsx";
import { CurrentlyPlaying } from "./currently-playing";
import { AutomationList } from "./automation-list";
import { AutomationInput } from "./automation-input";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Skipify</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        <script src="https://unpkg.com/htmx.org@1.9.6"></script>
        <script defer src="public/script.js"></script>
      </head>
      <body>
        <main class="container mt-5">
          <div class="row">
            <CurrentlyPlaying />
            <AutomationList />
            <AutomationInput />
          </div>
        </main>
        <section class="bg-danger-subtle fixed-bottom">
          <div class="container-fluid d-flex justify-content-between">
            <div id="track-details" class="d-flex align-items-center">
              <img src="https://i.scdn.co/image/ab67616d00004851a7fea62d802290850db366c5" alt="" class="img-fluid shadow-sm border rounded"/>
              <div class="ms-2">
              <p class="my-0">0.99 Paisa</p>
              <p class="text-black-50 my-0">Attending Donkey</p>
              </div>
            </div>
            <div id="track-actions">
            <i class="bi bi-play-fill"></i>
              <div>Pause</div>
              <div>Progress</div>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
};
