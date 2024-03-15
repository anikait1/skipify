import Database from "bun:sqlite";
import { logger } from "../lib/logger";
import { Err, Ok, Result } from "oxide.ts/core";

function formatQueryLog(query: string) {
    return query.replaceAll("\n", "").split(" ").filter(Boolean).join(" ");
}

let setupComplete = false;

export async function setupDB(
    filename: string,
    sqlTablesFile: string
): Promise<Result<Database, unknown>> {
    if (setupComplete === true) {
        return Err(new Error("SetupAlreadyComplete"));
    }

    try {
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
                logger.debug(
                    { query: formatQueryLog(query) },
                    "creating table"
                );
                database.run(query);
            }
            return queries.length;
        });

        logger.debug("initializing database");
        const tablesCount = createTables(createStatements);
        logger.info(
            { tablesCount, database: filename },
            "initialized database"
        );

        setupComplete = true;
        return Ok(database);
    } catch (error) {
        return Err(error);
    }
}
