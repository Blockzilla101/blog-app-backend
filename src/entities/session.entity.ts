import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { UserAccountEntity } from "./user-account.entity.js";

@Entity()
export class SessionEntity {
    [OptionalProps]?: "user";

    @PrimaryKey()
    token!: string;

    @ManyToOne({ entity: () => UserAccountEntity, inversedBy: "sessions" })
    user!: UserAccountEntity;

    @Property()
    expiresAt!: Date;

    @Property()
    ipAddress!: string;
}
