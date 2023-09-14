import {
  Output,
  array,
  literal,
  number,
  object,
  parse,
  string,
  union,
} from "valibot";

const ActionRangeStartSchema = object({
  type: literal("RANGE:START"),
  range: object({
    start: number(),
  }),
});
const ActionRangeBetweenSchema = object({
  type: literal("RANGE:BETWEEN"),
  range: object({
    start: number(),
    stop: number(),
  }),
});

const TrackSchema = object({
  id: string("wrong format"),
  name: string("no name"),
  actions: array(union([ActionRangeStartSchema, ActionRangeBetweenSchema])),
});
const TrackListFileSchema = array(TrackSchema);

export type Track = Output<typeof TrackSchema>;

export async function readTracksFromFile(filename: string): Promise<Map<string, Track>> {
  const tracksFile = Bun.file(filename);
  if ((await tracksFile.exists()) === false) {
    console.error(`File '${filename}' does not exist.`);
    process.exit(1);
  }

  try {
    const trackList: Track[] = parse(TrackListFileSchema, await tracksFile.json());
    const trackIdMap = new Map<string, Track>();

    for (const t of trackList) {
      trackIdMap.set(t.id, t);
    }

    return trackIdMap;
  } catch (error) {
    console.error(`Unable to parse file '${filename}' due to ${error}`);
    process.exit(1)
  }
}
