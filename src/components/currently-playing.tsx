import { player } from "../skipify";

export function CurrentTrackDetails() {
  // TODO fix id and class for the case when currently playing is null
  const currentTrack = player.currentlyPlaying;
  if (!currentTrack) {
    return (
      <section class="col-3" id="currently-playing">
        <h5>
          Playing Nothing (TODO) - need to use the standard component here
        </h5>
      </section>
    );
  }

  const progressPercentage = Math.floor(
    (currentTrack.progress_ms / currentTrack.item.duration_ms) * 100
  );

  return (
    <div id="track-details">
      <img
        src={currentTrack.item.album.images[1].url}
        class="img-fluid shadow-sm border rounded"
        alt={`Album Cover: ${currentTrack.item.name}`}
      />
      <ul class="list-group my-3">
        <li class="list-group-item">{`Name - ${currentTrack.item.name}`}</li>
        <li class="list-group-item">{`ID - ${currentTrack.item.uri}`}</li>
      </ul>
      <div
        class="progress"
        role="progressbar"
        aria-label="Song Progress"
        aria-valuenow={String(progressPercentage)}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="progress-bar bg-primary overflow-visible text-dark"
          style={`width: ${progressPercentage}%`}
        >
          {currentTrack.progress_ms} /{" "}
          {currentTrack.item.duration_ms} (ms)
        </div>
      </div>
    </div>
  );
}

export function CurrentlyPlaying() {
  const polling = player.timer !== undefined;
  const currentTrack = player.currentlyPlaying;

  return (
    <section
      class="col-3"
      id="currently-playing"
      hx-get="/currently-playing"
      hx-swap="outerHTML"
      hx-target="#track-details"
      {...(polling && { "hx-trigger": "every 1s" })}
    >
      <CurrentTrackDetails currentTrack={currentTrack} />
      <div class="d-grid gap-2 mt-3">
        <button
          class="btn btn-primary"
          type="button"
          hx-put="/toggle-player"
          hx-swap="outerHTML"
          hx-target="#currently-playing"
          hx-trigger="click consume"
        >
          <i class="bi bi-music-player-fill"></i>
          <span class="ms-2">{`${polling ? "Stop" : "Start"} Poll`}</span>
        </button>
        <button
          class="btn btn-primary"
          hx-patch="/automation-input"
          hx-swap="outerHTML"
          hx-target="#automation-input"
          hx-trigger="click consume"
        >
          <i class="bi bi-plus"></i>
          <span class="ms-2">Add Automation</span>
        </button>
      </div>
    </section>
  );
}
