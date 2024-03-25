import { object, string, parse } from "valibot";

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

export class Config {
  constructor(
    public clientID: string,
    public clientSecret: string,
    public redirectURI: string
  ) {}

  static async initialize(filename: string): Promise<Config> {
    const file = Bun.file(filename);
    if (!(await file.exists())) {
      throw new ConfigError(ConfigErrorTypes.FILE_NOT_FOUND_ERROR, {
        filename,
      });
    }

    let fileContentJSON;
    try {
      fileContentJSON = await file.json();
    } catch (error) {
      throw new ConfigError(
        ConfigErrorTypes.FILE_PARSE_ERROR,
        { filename, fileContent: await file.text() },
        error
      );
    }

    try {
      const config = parse(ConfigSchema, fileContentJSON);
      return new Config(
        config.clientID,
        config.clientSecret,
        config.redirectURI
      );
    } catch (error) {
      throw new ConfigError(
        ConfigErrorTypes.FILE_CONTENT_ERROR,
        {
          schema: ConfigSchema,
          fileContent: fileContentJSON,
          filename,
        },
        error
      );
    }
  }
}
