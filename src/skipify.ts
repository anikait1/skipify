import { getAllAutomations, getSpotifyTokens } from "./database";
import { Player, loadPlayer, playerPoll } from "./player";
import { Tokens, loadTokens, tokensPoll } from "./tokens";

let _player: Player | null = null;
let _tokens: Tokens | null = null;
let initialized = false;

export const Skipify = {
  get player(): Player {
    if (!initialized || !_player) {
      throw new Error("Skipifiy has not been initialized");
    }

    return _player;
  },

  get tokens(): Tokens {
    if (!initialized || !_tokens) {
      throw new Error("Skipifiy has not been initialized");
    }

    return _tokens;
  },

  init(): void {
    if (initialized) {
      console.warn("Skifiy has already been initialized");
      return;
    }

    const automations = getAllAutomations();
    _player = loadPlayer(automations);

    const spotifyTokens = getSpotifyTokens(process.env.email as string);
    _tokens = loadTokens(spotifyTokens);

    if (!_tokens.authorized) {
      initialized = true;
      console.warn("Email is not authorized, skipping setting up timers");
      return;
    }

    initialized = true;
    tokensPoll(_tokens);
    playerPoll(_tokens, _player);
  },
};
