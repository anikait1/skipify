declare module "bun" {
  interface Env {
    SKIPIFY_DB: string;
    CONFIG_FILE: string;
    LOG_LEVEL: string;
    LOG_FILE: string;
  }
}
