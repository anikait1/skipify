import { Err, Ok, Result } from "oxide.ts/core";
import { Output, object, string, parse } from "valibot";

export const ConfigErrorTypes = {
  FILE_NOT_FOUND_ERROR: "FileNotFoundError",
  FILE_PARSE_ERROR: "FileParseError",
  FILE_CONTENT_ERROR: "FileContentError",
  SETUP_ALREADY_COMPLETE: "SetupAlreadyComplete",
} as const;

class ConfigError extends Error {
  type: (typeof ConfigErrorTypes)[keyof typeof ConfigErrorTypes];
  cause?: unknown;
  context: Record<string, any>;

  constructor(
    type: (typeof ConfigErrorTypes)[keyof typeof ConfigErrorTypes],
    context?: Record<string, any>,
    cause?: unknown,
    message?: string
  ) {
    const errorMessage = typeof message === undefined ? type : message;
    super(errorMessage);

    this.type = type;
    this.cause = cause;
    this.context = context ?? {};
  }
}

const ConfigSchema = object({
  clientID: string(),
  clientSecret: string(),
  redirectURI: string(),
});

export type Config = Output<typeof ConfigSchema>;

let setupComplete = false;

export async function setupConfig(
  filename: string
): Promise<Result<Config, ConfigError>> {
  if (setupComplete === true) {
    return Err(new ConfigError(ConfigErrorTypes.SETUP_ALREADY_COMPLETE));
  }

  const file = Bun.file(filename);
  if (!(await file.exists())) {
    return Err(
      new ConfigError(ConfigErrorTypes.FILE_NOT_FOUND_ERROR, { filename })
    );
  }

  let fileContentJSON;
  try {
    fileContentJSON = await file.json();
  } catch (error) {
    return Err(
      new ConfigError(
        ConfigErrorTypes.FILE_PARSE_ERROR,
        { filename, fileContent: await file.text() },
        error
      )
    );
  }

  try {
    const config = Ok(parse(ConfigSchema, fileContentJSON));
    setupComplete = true;
    return config;
  } catch (error) {
    return Err(
      new ConfigError(ConfigErrorTypes.FILE_CONTENT_ERROR, {
        schema: ConfigSchema,
        fileContent: fileContentJSON,
        filename,
      })
    );
  }
}
