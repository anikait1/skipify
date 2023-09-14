import EventEmitter from "events";
import { next, seek } from "./spotify-api";
import { Track } from "./track";

type Player = {
  state: "PLAYING" | "PAUSED";
  track: Track & { progress: number };
};

async function handleTrackProgressed(
  player: Player,
  tracks: Map<string, Track>,
  accessToken: string
) {
  const track = tracks.get(player.track.id);
  if (!track) {
    return;
  }

  const actions = track.actions;
  for (const action of actions) {
    switch (action.type) {
      case "RANGE:START":
        if (player.track.progress < action.range.start) {
          await seek(action.range.start, accessToken).catch((error) => {
            console.error(
              `Unable to perform seek operation on ${track} due to ${error}`
            );
          });
        }
        break;
      case "RANGE:BETWEEN":
        if (player.track.progress < action.range.start) {
          await seek(action.range.start, accessToken).catch((error) => {
            console.error(
              `Unable to perform seek operation on ${track} due to ${error}`
            );
          });
        }

        if (player.track.progress > action.range.stop) {
          await next(accessToken).catch((error) => {
            console.error(`Unable to perform next operation due to ${error}`);
          });
        }
        break;
    }
  }
}

export const playerEventEmitter = new EventEmitter();
playerEventEmitter.on("track-progress", handleTrackProgressed);
