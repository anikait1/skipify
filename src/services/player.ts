import { SongAutomation } from "../database/schema";
import { fileLogger } from "../lib/logger";
import { SpotifyAPI } from "./spotify/api";
import { SpotifyAPIError } from "./spotify/error";
import { SpotifyCurrentlyPlaying } from "./spotify/schema";

export class Player {
    constructor(
        public spotify: SpotifyAPI,
        public automations: SongAutomation[],
        public timer: Timer | undefined = undefined,
        public currentTrack: SpotifyCurrentlyPlaying | null = null
    ) {}

    static POLL_TIMER = 1000; // 1 second

    async poll() {
        try {
            this.currentTrack = await this.spotify.currentlyPlaying();
        } catch (error) {
            fileLogger.error({ error }, "error occured in currently playing");
        }

        fileLogger.debug(this.currentTrack, "currently playing")
        if (!this.currentTrack) {
            return this.schedulePoll();
        }

        try {
            await this.applyAutomation();
        } catch (error) {
            // TODO - add logic to stop the polling after a certain interval
            if (error instanceof SpotifyAPIError) {
                console.log(error.context.response)
                fileLogger.error({ error: JSON.stringify(error) }, "error occured while applying automation");
            } else {
                fileLogger.error({ error, }, "unknown error occured while applying automation");
            }
        }

        return this.schedulePoll();
    }

    private schedulePoll() {
        this.timer = setTimeout(() => {
            this.poll();
        }, Player.POLL_TIMER);
    }

    async applyAutomation(): Promise<void> {
        if (!this.currentTrack) {
            return;
        }

        const automation = this.automations.find(
            (a) => a.spotify_song_id === this.currentTrack!.item.id
        );

        if (!automation) {
            return;
        }

        // TODO - separate out the conditions in separate variables
        if (
            automation.range.start &&
            this.currentTrack!.progress_ms < automation.range.start
        ) {
            await this.spotify.seek(automation.range.start);
        } else if (
            automation.range.end &&
            this.currentTrack!.progress_ms > automation.range.end
        ) {
            await this.spotify.next();
        }

        return;
    }

    stopPoll() {
        clearTimeout(this.timer);
        this.timer = undefined;
    }
}
