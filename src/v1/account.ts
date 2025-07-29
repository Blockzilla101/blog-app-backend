import express from "express";
import { orm } from "../database/index.js";
import { UserAccountEntity } from "../entities/user-account.entity.js";
import { checkSchema, Meta } from "express-validator";
import { compareSecret, hashSecret } from "../util.js";
import { authorizedRoute, createSession, getSessionAccount } from "./session.js";

export const accountRoute = express();
const em = orm.em;

async function checkEmailNotExists(email: string, meta: Meta) {
    if (meta.req.headers && meta.req.headers["authorization"]) {
        const account = await getSessionAccount(meta.req);
        if (account.email === email) {
            return true;
        }
    }

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
                options: { min: 2, max: 25 },
                errorMessage: "First name must be between 2 and 25 characters",
            },
            trim: true,
        },
        lastName: {
            isString: true,
            isLength: {
                options: { min: 2, max: 25 },
                errorMessage: "Last name must be between 2 and 25 characters",
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
        passwordHash: hashSecret(password),
    });

    await em.persistAndFlush(account);

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

    const account = await em.findOne(UserAccountEntity, { email });
    if (!account || !compareSecret(password, account.passwordHash)) {
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

    const blogs = await account.blogs.loadItems();

    res.status(200)
       .json({
           uuid: account.uuid,
           firstName: account.firstName,
           lastName: account.lastName,
           email: account.email,
           avatar: account.avatar,
           bio: account.bio,
           blogUuids: blogs.map(b => b.uuid),
       });
});

accountRoute.patch("/update", async (req, res) => {
    const result = await checkSchema({
        email: {
            optional: true,
            isEmail: {
                errorMessage: "Invalid email format",
            },
            custom: {
                options: checkEmailNotExists,
                errorMessage: "Email already exists",
                bail: true,
            },
            normalizeEmail: true,
        },
        firstName: {
            optional: true,
            isString: true,
            isLength: {
                options: { min: 2, max: 25 },
                errorMessage: "First name must be between 2 and 25 characters",
            },
            trim: true,
        },
        lastName: {
            optional: true,
            isString: true,
            isLength: {
                options: { min: 2, max: 25 },
                errorMessage: "Last name must be between 2 and 25 characters",
            },
            trim: true,
        },
        bio: {
            optional: true,
            isString: true,
            isLength: {
                options: { min: 2, max: 50 },
                errorMessage: "Bio must be between 2 and 50 characters",
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
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const bio = req.body.bio;

    const account = await getSessionAccount(req);

    if (email) account.email = email;
    if (firstName) account.firstName = firstName;
    if (lastName) account.lastName = lastName;
    if (bio) account.bio = bio;

    await em.persistAndFlush(account);

    return res.status(200)
              .json({
                  success: true,
              });
});
