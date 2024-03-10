import { beforeAll, expect, mock, test } from "bun:test";

beforeAll(() => {
  global.fetch = mock(() => {
    throw new Error("Failed Request");
  });
});

test("spotify-network-error", async () => {
});
