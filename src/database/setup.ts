import Database from "bun:sqlite";
import { logger } from "../lib/logger";

// const DB_FILENAME = "skipify.sqlite";
// const CREATE_TABLE_STATEMENT_PATH = `${import.meta.dir}/tables.sql`;

function formatQueryLog(query: string) {
  return query.replaceAll("\n", "").split(" ").filter(Boolean).join(" ");
}

export async function setupDB(
  filename: string,
  sqlTablesFile: string
): Promise<Database> {
  const database = new Database(filename, { create: true });

  /**
   * Read the sql create statements from 'tables.sql'
   * Parse the sql queries from file by splitting the text on ';'
   * Run the parsed queries
   */
  const sqlStatementsFile = Bun.file(sqlTablesFile);
  const createTablesSQL = await sqlStatementsFile.text();

  const createStatements = createTablesSQL.split(";");
  const createTables = database.transaction((queries: string) => {
    for (const query of queries) {
      database.run(query);
      logger.debug({ query: formatQueryLog(query) }, "creating table");
    }
    return queries.length;
  });

  logger.debug("initializing database");
  const tablesCount = createTables(createStatements);
  logger.info({ tablesCount, database: filename }, "initialized database");

  return database;
}
