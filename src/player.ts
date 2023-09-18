import EventEmitter from "events";
import { CredentialsData, next, seek } from "./spotify-api";
import { Track } from "./track";

export class SkipifyPlayer extends EventEmitter {
  readonly credentials: Readonly<CredentialsData>;
  readonly tracks: Readonly<Map<string, Track>>;
  currenTrack?: Omit<Track, "actions"> & { progress: number };

  constructor(credenitals: CredentialsData, tracks: Map<string, Track>) {
    super();
    this.credentials = credenitals;
    this.tracks = tracks;
  }

  async updateProgress(id: string, name: string, progress: number) {
    if (!this.currenTrack) {
      this.currenTrack = {
        id,
        name,
        progress,
      };
    }

    // first call to this function when currentTrack has not been
    // initialized will lead to double assignment
    this.currenTrack.id = id;
    this.currenTrack.name = name;
    this.currenTrack.progress = progress;

    const track = this.tracks.get(id);
    if (!track) {
      return;
    }

    const actions = track.actions;
    for (const action of actions) {
      switch (action.type) {
        case "RANGE:START":
          if (progress < action.range.start) {
            await seek(action.range.start, this.credentials.accessToken).catch(
              (error) => {
                console.error(
                  `Unable to perform seek operation on ${track} due to ${error}`
                );
              }
            );
          }
          break;
        case "RANGE:BETWEEN":
          if (progress < action.range.start) {
            await seek(action.range.start, this.credentials.accessToken).catch(
              (error) => {
                console.error(
                  `Unable to perform seek operation on ${track} due to ${error}`
                );
              }
            );
          }

          if (progress > action.range.stop) {
            await next(this.credentials.accessToken).catch((error) => {
              console.error(`Unable to perform next operation due to ${error}`);
            });
          }
          break;
      }
    }
  }
}
