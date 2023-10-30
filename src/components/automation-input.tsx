import { player } from "../skipify";

export function AutomationInput(props: { populateFields?: boolean }) {
  const currentTrack = player.currentlyPlaying;
  const populate = props.populateFields;

  return (
    <section class="col-3" id="automation-input">
      <form validate method="post">
        <div class="mb-3">
          <label htmlFor="spotify-track-id" class="form-label">
            Track's Spotify ID
          </label>
          <input
            type="text"
            class="form-control"
            id="spotify-track-id"
            name="spotify-track-id"
            value={populate ? currentTrack?.item.uri : ""}
          />
          <div id="song-help" class="form-text">
            Unique ID provided for each spotify song.
          </div>
        </div>
        <div class="mb-3">
          <label htmlFor="automation-name" class="form-label">
            Short name for your automation
          </label>
          <input
            type="text"
            class="form-control"
            id="automation-name"
            name="automation-name"
            value={populate ? currentTrack?.item.name : ""}
          />
        </div>
        <div class="mb-3">
          <label htmlFor="automation-type" class="form-label">
            Select Automation Type
          </label>
          <select
            class="form-select"
            id="automation-type"
            name="automation-type"
          >
            <option disabled selected>
              Choose
            </option>
            <option value="RANGE:START">RANGE:START</option>
            <option value="RANGE:BETWEEN">RANGE:BETWEEN</option>
          </select>
        </div>
        <div id="range-container">
          <div class="mb-3" id="range-start-container">
            <label htmlFor="range-start" class="form-label">
              Start (ms)
            </label>
            <input
              type="number"
              class="form-control"
              id="range-start"
              name="range-start"
              disabled
            />
          </div>
          <div class="mb-3" id="range-stop-container">
            <label htmlFor="range-stop" class="form-label">
              Stop (ms)
            </label>
            <input
              type="number"
              class="form-control"
              id="range-stop"
              name="range-stop"
              disabled
            />
          </div>
        </div>
        <button
          class="btn btn-primary"
          id="submit-automation"
          hx-post="/automations"
          hx-target="#automation-input"
          hx-swap="outerHTML"
          disabled
        >
          Create
        </button>
      </form>
    </section>
  );
}
