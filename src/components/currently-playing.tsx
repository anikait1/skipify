import { CurrentlyPlayingData } from "../spotify-api";

export function CurrentlyPlaying(props: {
  currentTrack: CurrentlyPlayingData;
  startPoll: boolean;
}) {
  // populate currentTrack such that it can be used to show dummy text
  if (!props.currentTrack) {
    return (
      <section class="col-3" id="currently-playing">
        <h5>
          Playing Nothing (TODO) - need to use the standard component here
        </h5>
      </section>
    );
  }

  const progressPercentage = Math.floor(
    (props.currentTrack.progress_ms / props.currentTrack.item.duration_ms) * 100
  );

  return (
    <section class="col-3" id="currently-playing">
      <img
        src={props.currentTrack.item.album.images[1].url}
        class="img-fluid"
        alt={`Album Cover: ${props.currentTrack.item.name}`}
      />
      <h5>Currently Playing: {props.currentTrack.item.name}</h5>
      <div
        class="progress"
        role="progressbar"
        aria-label="Song Progress"
        aria-valuenow={String(progressPercentage)}
        aria-valuemin="0"
        aria-valuemax={props.currentTrack.item.duration_ms}
      >
        <div
          class="progress-bar bg-primary overflow-visible text-dark"
          style={"width: " + String(progressPercentage)}
        >
          {props.currentTrack.progress_ms} /{" "}
          {props.currentTrack.item.duration_ms} (ms)
        </div>
      </div>
      <div class="d-grid gap-2 mt-3">
        <button class="btn btn-primary" type="button">
          <i class="bi bi-music-player"></i>
          <span class="ms-2">Start</span>
        </button>
        <button
          class="btn btn-primary"
          type="button"
          hx-get="/currently-playing"
          {...(props.startPoll && { "hx-trigger": "load delay:1s" })}
          hx-swap="outerHTML"
          hx-target="#currently-playing"
        >
          <i class="bi bi-arrow-clockwise"></i>
          <span class="ms-2">Refresh</span>
        </button>
      </div>
    </section>
  );
}
