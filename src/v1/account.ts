import express from "express";
import { orm } from "../database/index.js";
import { UserAccountEntity } from "../entities/user-account.entity.js";
import { checkSchema } from "express-validator";
import { hashPassword } from "../util.js";
import { TodoListEntity } from "../entities/todo-list.entity.js";
import { authorizedRoute, createSession, getSessionAccount } from "./session.js";

export const accountRoute = express();
const em = orm.em;

async function checkEmailNotExists(email: string) {
    const existing = await em.findOne(UserAccountEntity, { email });
    if (existing) {
        throw new Error("Account already exists, please login");
    }
}

accountRoute.post("/sign-up", async (req, res) => {
    const result = await checkSchema({
        email: {
            isEmail: {
                errorMessage: "Invalid email format",
            },
            custom: {
                options: checkEmailNotExists,
                bail: true,
            },
            normalizeEmail: true,
        },
        firstName: {
            isString: true,
            isLength: {
                options: { min: 2, max: 50 },
                errorMessage: "First name must be between 2 and 50 characters",
            },
            trim: true,
        },
        lastName: {
            isString: true,
            isLength: {
                options: { min: 2, max: 50 },
                errorMessage: "Last name must be between 2 and 50 characters",
            },
            trim: true,
        },
        password: {
            isString: true,
            isLength: {
                options: { min: 8 },
                errorMessage: "Password must be at least 8 characters long",
            },
            trim: true,
        },
    }, ["body"])
      .run(req);

    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return res.status(400)
                  .json({ errors: mappedErrors });
    }

    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    const account = em.create(UserAccountEntity, {
        email,
        firstName,
        lastName,
        passwordHash: await hashPassword(password),
    });

    const todoList = em.create(TodoListEntity, {
        user: account,
        name: "Your Todo List",
    });

    await em.persistAndFlush([account, todoList]);

    const session = await createSession(req, account);

    return res.status(200)
              .json({
                  account: {
                      firstName: account.firstName,
                      lastName: account.lastName,
                  },
                  session: {
                      token: session.token,
                      expiresAt: session.expiresAt,
                  },
              });
});

accountRoute.post("/login", async (req, res) => {
    const result = await checkSchema({
        email: {
            isEmail: {
                errorMessage: "Invalid email format",
            },
            normalizeEmail: true,
        },
        password: {
            isString: true,
            isLength: {
                options: { min: 8 },
                errorMessage: "Password must be at least 8 characters long",
            },
            trim: true,
        },
    }, ["body"])
      .run(req);

    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return res.status(400)
                  .json({ errors: mappedErrors });
    }

    const email = req.body.email;
    const password = req.body.password;

    const passwordHash = await hashPassword(password);

    const account = await em.findOne(UserAccountEntity, { email, passwordHash });
    if (!account) {
        return res.status(401)
                  .json({
                      errors: [
                          {
                              msg: "Invalid email or password",
                          },
                      ],
                  });
    }

    const session = await createSession(req, account);

    return res.status(200)
              .json({
                  account: {
                      firstName: account.firstName,
                      lastName: account.lastName,
                  },
                  session: {
                      token: session.token,
                      expiresAt: session.expiresAt,
                  },
              });
});

accountRoute.use(authorizedRoute);

accountRoute.get("/info", async (req, res) => {
    const account = await getSessionAccount(req);

    if (!account) {
        return res.status(404)
                  .json({
                      errors: [
                          {
                              msg: "Account not found.",
                          },
                      ],
                  });
    }

    const lists = await account.todoLists.loadItems();
    for (const list of lists) {
        await list.items.loadItems({
            refresh: true,
            orderBy: {
                completed: "ASC",
                createdAt: "DESC",
            },
        });
    }

    res.status(200)
       .json({
           uuid: account.uuid,
           firstName: account.firstName,
           lastName: account.lastName,
           todoLists: account.todoLists.map(t => ({
               name: t.name,
               uuid: t.uuid,
               items: t.items
                       .map(i => ({
                           uuid: i.uuid,
                           title: i.title,
                           completed: i.completed,
                           dueDate: i.dueDate,
                       })),
           })),
       });
});
