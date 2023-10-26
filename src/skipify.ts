import { getAllAutomations, getSpotifyTokens } from "./database";
import { loadPlayer, playerPoll } from "./player";
import { loadTokens, tokensPoll } from "./tokens";

let pollingInitialized = false;
const automations = getAllAutomations();
export const player = loadPlayer(automations);

const spotifyTokens = getSpotifyTokens(process.env.email as string);
export const tokens = loadTokens(spotifyTokens);

export function skipifySetupPoll(): void {
  if (pollingInitialized) {
    console.warn("Skipify has already been initialized");
    return;
  }

  if (!tokens.authorized) {
    console.warn("Email is not authorized, skipping setting up timers.");
    return;
  }

  pollingInitialized = true;
  tokensPoll(tokens);
  playerPoll(tokens, player);
}
