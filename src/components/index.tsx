import { FC } from "hono/jsx";
import { CurrentlyPlaying } from "./currently-playing";
import { CurrentlyPlayingData } from "../spotify-api";

type LayoutProps = {
  currentTrack: CurrentlyPlayingData
  startPoll: boolean
}

export const Layout: FC<LayoutProps> = (props) => {
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
      </head>
      <body>
        <main class="container mt-5">
          <div class="row">
            <CurrentlyPlaying
              currentTrack={props.currentTrack}
              startPoll={false}
            />
            <section class="col-6"></section>
            <section class="col-3"></section>
          </div>
        </main>
      </body>
    </html>
  );
};
