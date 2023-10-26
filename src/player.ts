import {
  CurrentlyPlayingData,
  currentlyPlaying,
  next,
  seek,
} from "./spotify-api";
import {
  Automation,
} from "./database";
import { AuthorizedTokens } from "./tokens";

const PLAYER_POLL_INTERVAL = 1000 // 1 second

export type InactivePlayer = { state: "STOPPED"; currentlyPlaying: null };
export type ActivePlayer = {
  state: "PLAYING" | "PAUSED";
  currentlyPlaying: Exclude<CurrentlyPlayingData, null>;
};
export type Player = (ActivePlayer | InactivePlayer) & {
  automations: Automation[];
};

export function loadPlayer(
  automations: Automation[]
): Player {
  return  {
    state: "STOPPED",
    currentlyPlaying: null,
    automations: automations,
  }
}

export async function playerPoll(tokens: AuthorizedTokens, player: Player): Promise<void> {
  try {
    const track = await currentlyPlaying(tokens.accessToken);
    if (!track) {
      setTimeout(playerPoll, PLAYER_POLL_INTERVAL, tokens, player);
      return
    }

    player.state = "PLAYING";
    player.currentlyPlaying = track;
    
    const automation = findAutomation(player.automations, track.item.uri);
    if (automation) {
     applyAutomation(tokens, automation, track);
    }

  } catch (error) {
    // TODO - brainstorm what needs to be done to the player state
    console.error("Unable to fetch currently playing track", error);
  }

  setTimeout(playerPoll, PLAYER_POLL_INTERVAL, tokens, player);
}

function findAutomation(
  automations: Automation[],
  spotifyTrackID: string
): Automation | null {
  for (const automation of automations) {
    if (automation.spotify_id === spotifyTrackID) {
      return automation;
    }
  }

  return null;
}

async function applyAutomation(
  tokens: AuthorizedTokens,
  automation: Automation,
  currentlyPlaying: Exclude<CurrentlyPlayingData, null>
): Promise<void> {
  const progress = currentlyPlaying.progress_ms;

  switch (automation.action.type) {
    case "RANGE:START":
      if (progress < automation.action.range.start) {
        await seek(automation.action.range.start, tokens.accessToken).catch(
          (error) => {
            console.error(
              `Unable to perform seek operation on ${currentlyPlaying} due to ${error}`
            );
          }
        );
      }
      break;
    case "RANGE:BETWEEN":
      if (progress < automation.action.range.start) {
        await seek(automation.action.range.start,tokens.accessToken).catch(
          (error) => {
            console.error(
              `Unable to perform seek operation on ${currentlyPlaying} due to ${error}`
            );
          }
        );
      }

      if (progress > automation.action.range.stop) {
        await next(tokens.accessToken).catch((error) => {
          console.error(`Unable to perform next operation due to ${error}`);
        });
      }
      break;
  }
}