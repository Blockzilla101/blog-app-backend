import { BetterSqliteDriver, Options } from "@mikro-orm/better-sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

const config: Options = {
    driver: BetterSqliteDriver,
    dbName: "data.db",
    entities: ["dist/**/*.entity.js"],
    entitiesTs: ["src/**/*.entity.ts"],
    metadataProvider: TsMorphMetadataProvider,
    debug: true,
};

export default config;