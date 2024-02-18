declare module "bun" {
    interface Env {
        SKIPIFY_DB: string
        LOG_LEVEL: string
    }
}