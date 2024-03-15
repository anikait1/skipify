import * as SpotifyAPI from "./spotify/api";
import { SongAutomation } from "../database/schema";
import { SpotifyCurrentlyPlaying } from "./spotify/schema";
import { logger } from "../lib/logger";
import poll, { EventTypes } from "./poll";

export class Player {
    currentlyPlaying: SpotifyCurrentlyPlaying | null;
    automations: Map<
        string,
        Pick<SongAutomation, "automation_id" | "spotify_song_id" | "range">[]
    >;
    accessToken: string;
    signal: AbortSignal;

    constructor(
        automations: Pick<
            SongAutomation,
            "automation_id" | "spotify_song_id" | "range"
        >[],
        accessToken: string,
        signal: AbortSignal
    ) {
        // TODO - transform the automations to map
        this.currentlyPlaying = null;
        this.automations = new Map();

        this.accessToken = accessToken;
        this.signal = signal;
    }

    updateCurrentlyPlaying(currentlyPlaying: SpotifyCurrentlyPlaying) {
        this.currentlyPlaying = currentlyPlaying;
        this.applyAutomation().catch((error) =>
            logger.error(
                { error },
                "unexpected error occured while running automation"
            )
        );
    }

    async applyAutomation() {
        if (this.currentlyPlaying === null) {
            return;
        }

        const automations = this.automations.get(this.currentlyPlaying.item.id);
        if (!automations) {
            return;
        }

        for (const automation of automations) {
            if (
                automation.range.start !== null &&
                this.currentlyPlaying.progress_ms < automation.range.start
            ) {
                return await SpotifyAPI.seek(
                    automation.range.start,
                    this.accessToken,
                    this.signal
                );
            } else if (
                automation.range.end !== null &&
                this.currentlyPlaying.progress_ms > automation.range.end
            ) {
                return await SpotifyAPI.next(this.accessToken, this.signal);
            }
        }

        return;
    }
}

poll.addEventListener(EventTypes.CURRENTLY_PLAYING, function (event: Event) {
    
})
