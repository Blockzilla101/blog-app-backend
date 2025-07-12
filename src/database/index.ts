import { MikroORM } from "@mikro-orm/better-sqlite";

export const orm = await MikroORM.init();

await orm.getMigrator().up();

const generator = orm.getSchemaGenerator();
await generator.updateSchema();
