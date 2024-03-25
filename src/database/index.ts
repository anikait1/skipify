import Database from "bun:sqlite";
import { consoleLogger } from "../lib/logger";
import { SongAutomation, SpotifyAPITokens } from "./schema";

function formatQueryLog(query: string) {
    return query.replaceAll("\n", "").split(" ").filter(Boolean).join(" ");
}

export class DB {
    constructor(private database: Database) {}

    apiTokens(): SpotifyAPITokens | null {
        return this.database.query(DB.GET_API_TOKENS).get() as SpotifyAPITokens;
    }

    insertTokens(accessToken: string, refreshToken: string, expiry: number) {
        return this.database.query(DB.INSERT_TOKENS).get({
            $access_token: accessToken,
            $refresh_token: refreshToken,
            $expires_at: expiry,
        });
    }

    updateAccessToken(accessToken: string, expiry: number) {
        return this.database.query(DB.UPDATE_ACCESS_TOKEN).get({
            $access_token: accessToken,
            $expires_at: expiry,
        });
    }

    getAutomations() {
        const automations = this.database.query(DB.GET_SONG_AUTOMATIONS).all() as any[]; 
        for (const automation of automations) {
            automation.range = JSON.parse(automation.range)
        } 
        return  automations as SongAutomation[]
    }

    static async initialize(filename: string, sqlTablesFile: string) {
        const database = new Database(filename, { create: true });
        /**
         * Read the sql create statements from 'tables.sql'
         * Parse the sql queries from file by splitting the text on ';'
         * Run the parsed queries
         */
        const sqlStatementsFile = Bun.file(sqlTablesFile);
        const createTablesSQL = await sqlStatementsFile.text();
        const createStatements = createTablesSQL.split(";").filter(Boolean);
        const createTables = database.transaction((queries: string) => {
            for (const query of queries) {
                consoleLogger.debug(
                    { query: formatQueryLog(query) },
                    "creating table"
                );
                database.run(query);
            }
            return queries.length;
        });

        consoleLogger.debug("initializing database");
        const tablesCount = createTables(createStatements);
        consoleLogger.info(
            { tablesCount, database: filename },
            "initialized database"
        );

        return new DB(database);
    }

    static GET_API_TOKENS = "SELECT * FROM api_tokens WHERE deleted_at IS NULL";
    static UPDATE_ACCESS_TOKEN = `
        UPDATE api_tokens
        SET 
            access_token = $access_token, 
            expires_at = $expires_at,
            updated_at = (strftime('%s', 'now'))
        WHERE deleted_at is NULL
        RETURNING *
    `;
    static INSERT_TOKENS = `
        INSERT INTO api_tokens (access_token, refresh_token, expires_at)
        VALUES ($access_token, $refresh_token, $expires_at)
        RETURNING *
    `;
    static GET_SONG_AUTOMATIONS = "SELECT * FROM song_automations WHERE deleted_at IS NULL"
}
