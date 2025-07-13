import express from "express";
import { orm } from "../database/index.js";
import { checkSchema, Meta } from "express-validator";
import { TodoListEntity } from "../entities/todo-list.entity.js";
import { TodoItemEntity } from "../entities/todo-item.entity.js";

export const todoRoute = express();
const em = orm.em;

// todo handle authorization

async function checkTodoList(uuid: string, meta: Meta) {
    const accountUuid = await fetchSessionAccountUuid(meta.req);
    const list = await em.findOne(TodoListEntity, {
        user: accountUuid,
        uuid,
    });

    if (!list) {
        throw new Error("List not found");
    }
}

async function getTodoItem(uuid: string, meta: { req: Meta["req"] }) {
    const accountUuid = await fetchSessionAccountUuid(meta.req);
    const listUuid = meta.req.params!.list as string;

    const item = await em.findOne(TodoItemEntity, {
        list: {
            uuid: listUuid,
            user: accountUuid,
        },
        uuid,
    });

    if (!item) {
        throw new Error("Item not found");
    }

    return item;
}

async function fetchSessionAccountUuid(req: any) {
    return "b6102c6c-b2ea-4ffd-bb6d-888a8ab46511"; // todo
}

todoRoute.post("/create/:list", async (req, res) => {
    const result = await checkSchema({
        list: {
            in: "params",
            isUUID: {
                errorMessage: "Invalid list uuid",
            },
            custom: {
                options: checkTodoList,
                bail: true,
            },
        },
        title: {
            in: "body",
            isString: true,
            isLength: {
                options: {
                    min: 1, max: 128,
                },
            },
        },
    }, ["params", "body"])
      .run(req);

    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return res.status(400)
                  .json({ errors: mappedErrors });
    }

    const listUuid = req.params.list;

    const item = em.create(TodoItemEntity, {
        list: listUuid,
        title: req.body.title,
    });

    await em.persistAndFlush(item);

    return res.status(200)
              .json({
                  uuid: item.uuid,
                  title: item.title,
                  completed: item.completed,
              });
});

todoRoute.patch("/update/:list/:todo", async (req, res) => {
    const result = await checkSchema({
        list: {
            in: "params",
            isUUID: {
                errorMessage: "Invalid list uuid",
            },
            custom: {
                options: checkTodoList,
                bail: true,
            },
        },
        todo: {
            in: "params",
            isUUID: {
                errorMessage: "Invalid todo uuid",
            },
            custom: {
                options: getTodoItem,
                bail: true,
            },
        },
        title: {
            in: "body",
            isString: true,
            isLength: {
                options: {
                    min: 1, max: 128,
                },
            },
            optional: true,
        },
        completed: {
            in: "body",
            isBoolean: true,
            optional: true,
        },
    }, ["params", "body"])
      .run(req);

    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return res.status(400)
                  .json({ errors: mappedErrors });
    }

    const item = await getTodoItem(req.params.todo, { req });
    const title = req.body.title;
    const completed = req.body.completed;

    if (title == null && completed == null) {
        return res.status(400)
                  .json({
                      errors: [{ msg: "At least one field must be provided" }],
                  });
    }

    if (title != null) item.title = title;
    if (completed != null) item.completed = completed;

    await em.persistAndFlush(item);

    return res.status(200)
              .json({
                  uuid: item.uuid,
                  title: item.title,
                  completed: item.completed,
              });
});

todoRoute.delete("/delete/:list/:todo", async (req, res) => {
    const result = await checkSchema({
        list: {
            in: "params",
            isUUID: {
                errorMessage: "Invalid list uuid",
            },
            custom: {
                options: checkTodoList,
                bail: true,
            },
        },
        todo: {
            in: "params",
            isUUID: {
                errorMessage: "Invalid todo uuid",
            },
            custom: {
                options: getTodoItem,
                bail: true,
            },
        },
    })
      .run(req);

    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return res.status(400)
                  .json({ errors: mappedErrors });
    }

    const item = await getTodoItem(req.params.todo, { req });

    await orm.em.removeAndFlush(item);

    return res.status(200)
              .json({ success: true });
});
