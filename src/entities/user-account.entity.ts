import { Collection, Entity, OneToMany, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { BlogItemEntity } from "./blog-item.entity.js";
import { SessionEntity } from "./session.entity.js";

@Entity()
export class UserAccountEntity {
    [OptionalProps]?: "uuid" | "todoLists" | "sessions" | "bio";

    @PrimaryKey({ type: "uuid" })
    uuid = v4();

    @Property()
    firstName!: string;

    @Property()
    lastName!: string;

    @Property({ unique: true })
    email!: string;

    @Property()
    avatar?: string;

    @Property()
    bio = "";

    @Property()
    passwordHash!: string;

    @OneToMany({ entity: () => BlogItemEntity, mappedBy: "author" })
    blogs!: Collection<BlogItemEntity>;

    @OneToMany({ entity: () => SessionEntity, mappedBy: "user" })
    sessions!: Collection<SessionEntity>;
}
