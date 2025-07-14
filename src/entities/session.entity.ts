import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { UserAccountEntity } from "./user-account.entity.js";

@Entity()
export class SessionEntity {
    [OptionalProps]?: "user" | "expiresAt";

    @PrimaryKey()
    token!: string;

    @ManyToOne({ entity: () => UserAccountEntity, inversedBy: "sessions" })
    user!: UserAccountEntity;

    @Property()
    expiresAt: number = Date.now() + 30 * 24 * 60 * 60 * 1000;

    @Property()
    ipAddress!: string;
}
