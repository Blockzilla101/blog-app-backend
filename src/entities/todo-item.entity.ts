import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { TodoListEntity } from "./todo-list.entity.js";

@Entity()
export class TodoItemEntity {
    [OptionalProps]?: "uuid" | "createdAt" | "completed";

    @PrimaryKey({ type: "uuid" })
    uuid = v4();

    @ManyToOne({ entity: () => TodoListEntity, inversedBy: "items" })
    list!: TodoListEntity;

    @Property()
    title!: string;

    @Property()
    completed: boolean = false;

    @Property()
    dueDate!: number;

    @Property()
    createdAt: Date = new Date();
}
