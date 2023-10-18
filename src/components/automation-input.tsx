export function AutomationInput() {
  return (
    <section class="col-3">
      <form>
        <div class="mb-3">
          <label htmlFor="spotifySongID" class="form-label">
            Song's Spotify ID
          </label>
          <input type="text" class="form-control" id="spotifySongID" />
          <div id="song-help" class="form-text">
            Unique ID provided for each spotify song.
          </div>
        </div>
        <div class="mb-3">
          <label htmlFor="automationName" class="form-label">
            Short name for your automation
          </label>
          <input type="text" class="form-control" id="automationName" />
        </div>
        <div class="mb-3">
          <label htmlFor="automationType" class="form-label">
            Select Automation Type
          </label>
          <select class="form-select" id="automationType">
            <option selected>Choose</option>
            <option value="RANGE:START">RANGE:START</option>
            <option value="RANGE:BETWEEN">RANGE:BETWEEN</option>
          </select>
        </div>
        <div class="mb-3 d-none" id="rangeStartContainer">
          <label htmlFor="rangeStart" class="form-label">
            Start (ms)
          </label>
          <input type="number" class="form-control" id="rangeStart" />
        </div>
        <div class="mb-3 d-none" id="rangeStopContainer">
          <label htmlFor="rangeStop" class="form-label">
            Stop (ms)
          </label>
          <input type="number" class="form-control" id="rangeStop" />
        </div>
      </form>
    </section>
  );
}
