import { Collection, Entity, ManyToOne, OneToMany, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { UserAccountEntity } from "./user-account.entity.js";
import { TodoItemEntity } from "./todo-item.entity.js";

@Entity()
export class TodoListEntity {
    [OptionalProps]?: "uuid" | "createdAt" | "user";

    @PrimaryKey({ type: "uuid" })
    uuid = v4();

    @ManyToOne({ entity: () => UserAccountEntity, inversedBy: "todoLists" })
    user!: UserAccountEntity;

    @OneToMany({ entity: () => TodoItemEntity, mappedBy: "list" })
    items!: Collection<TodoItemEntity>;

    @Property()
    name!: string;

    @Property()
    createdAt: Date = new Date();
}
