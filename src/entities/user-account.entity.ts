import { Collection, Entity, OneToMany, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { TodoListEntity } from "./todo-list.entity.js";
import { SessionEntity } from "./session.entity.js";

@Entity()
export class UserAccountEntity {
    [OptionalProps]?: "uuid" | "todoLists" | "sessions";

    @PrimaryKey({ type: "uuid" })
    uuid = v4();

    @Property()
    firstName!: string;

    @Property()
    lastName!: string;

    @Property()
    email!: string;

    @Property()
    passwordHash!: string;

    @OneToMany({ entity: () => TodoListEntity, mappedBy: "user" })
    todoLists!: Collection<TodoListEntity>;

    @OneToMany({ entity: () => SessionEntity, mappedBy: "user" })
    sessions!: Collection<SessionEntity>;
}
