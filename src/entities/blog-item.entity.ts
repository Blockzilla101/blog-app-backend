import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { UserAccountEntity } from "./user-account.entity.js";
import { v4 } from "uuid";

@Entity()
export class BlogItemEntity {
    [OptionalProps]?: "uuid" | "createdAt";

    @PrimaryKey({ type: "uuid" })
    uuid = v4();

    @ManyToOne({ entity: () => UserAccountEntity, inversedBy: "blogs" })
    author!: UserAccountEntity;

    @Property()
    title!: string;

    @Property()
    content!: string;

    @Property()
    createdAt: number = Date.now();
}
