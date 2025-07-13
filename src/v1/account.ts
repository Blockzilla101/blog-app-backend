import express from "express";
import { orm } from "../database/index.js";
import { UserAccountEntity } from "../entities/user-account.entity.js";
import { checkSchema } from "express-validator";
import { hashPassword } from "../util.js";
import { TodoListEntity } from "../entities/todo-list.entity.js";

export const accountRoute = express();
const em = orm.em.fork();

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

    // todo return a session
    res.status(201)
       .json({ message: "Account created successfully", accountId: account.uuid });
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

    // todo return a session

    return res.status(200)
              .json(account);

});

accountRoute.get("/info", async (req, res) => {
    // todo use the provided session token
    const account = await em.findOne(UserAccountEntity, {
        uuid: "b6102c6c-b2ea-4ffd-bb6d-888a8ab46511",
    }, {
        populate: ["*"],
    });

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

    res.status(200)
       .json({
           uuid: account.uuid,
           firstName: account.firstName,
           lastName: account.lastName,
           todoLists: account.todoLists.map(t => ({
               name: t.name, uuid: t.uuid, items: t.items.map(i => ({
                   uuid: i.uuid,
                   title: i.title,
                   completed: i.completed,
               })),
           })),
       });
});
