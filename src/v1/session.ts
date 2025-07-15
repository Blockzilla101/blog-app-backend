import express, { NextFunction, Request, Response } from "express";
import { orm } from "../database/index.js";
import { checkSchema, Meta } from "express-validator";
import { SessionEntity } from "../entities/session.entity.js";
import { UserAccountEntity } from "../entities/user-account.entity.js";
import { generateToken } from "../util.js";

export const sessionRoute = express();
const em = orm.em;

async function validateSession(token: string) {
    const entity = await em.findOne(SessionEntity, {
        token,
    });

    if (!entity) {
        throw new Error("Unknown session");
    }
}

export async function authorizedRoute(req: Request, res: Response, next: NextFunction) {
    const result = await checkSchema({
        Authorization: {
            in: "headers",
            isString: true,
            custom: {
                bail: true,
                options: validateSession,
            },
        },
    })
      .run(req);

    const mappedErrors = result.filter(r => !r.isEmpty())
                               .map(r => r.array())
                               .flat();

    if (mappedErrors.length > 0) {
        return res.status(403)
                  .json({ errors: mappedErrors });
    }

    next();
}

export async function createSession(req: Meta["req"], user: UserAccountEntity) {
    const session = em.create(SessionEntity, {
        user,
        token: generateToken(),
        ipAddress: req.header("X-Real-IP") ?? req.ip ?? "unknown",
    });

    await em.persistAndFlush(session);

    return session;
}

export async function getSessionAccount(req: Meta["req"]): Promise<UserAccountEntity> {
    const token = req.header("Authorization");

    if (!token) throw new Error("Request does not contain auth header");

    const session = await em.findOneOrFail(SessionEntity, {
        token,
    }, {
        populate: ["user"],
    });

    return session.user;
}

sessionRoute.use(authorizedRoute);

sessionRoute.get("/refresh", async (req, res) => {
    const token = req.header("Authorization");
    const session = await em.findOneOrFail(SessionEntity, {
        token,
    }, {
        populate: ["user"],
    });

    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await em.persistAndFlush(session);

    return res.status(200)
              .json({
                  account: {
                      firstName: session.user.firstName,
                      lastName: session.user.lastName,
                  },
                  session: {
                      token: session.token,
                      expiresAt: session.expiresAt,
                  },
              });
});

sessionRoute.get("/revoke", async (req, res) => {
    const token = req.header("Authorization");
    const session = await em.findOneOrFail(SessionEntity, {
        token,
    });

    await em.removeAndFlush(session);

    return res.status(200)
              .json({
                  success: "true",
              });
});
