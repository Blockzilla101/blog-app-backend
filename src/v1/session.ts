import express, { NextFunction, Request, Response } from "express";
import { orm } from "../database/index.js";
import { checkSchema, Meta } from "express-validator";
import { SessionEntity } from "../entities/session.entity.js";
import { UserAccountEntity } from "../entities/user-account.entity.js";
import { generateToken, handleValidatorError } from "../util.js";
import { maxSessionAge } from "../constants.js";

export const sessionRoute = express();
const em = orm.em;

async function validateSession(token: string) {
    const entity = await em.findOne(SessionEntity, {
        token,
    });

    if (!entity) {
        throw new Error("Unknown session");
    }

    if (entity.expiresAt < Date.now()) {
        throw new Error("Session expired");
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

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
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

    session.expiresAt = Date.now() + maxSessionAge;

    await em.persistAndFlush(session);

    return res.status(200)
              .json({
                  token: session.token,
                  expiresAt: session.expiresAt,
              });
});

sessionRoute.get("/revoke", async (req, res) => {
    const token = req.header("Authorization");
    const session = await em.findOneOrFail(SessionEntity, {
        token,
    });

    await em.removeAndFlush(session);

    return res.status(204);
});
