import express from "express";
import { orm } from "../database/index.js";
import { UserAccountEntity } from "../entities/user-account.entity.js";

export const accountRoute = express();
const em = orm.em.fork();

accountRoute.post("/sign-up", async (req, res) => {
    const email = req.body.email;
    const passwordHash = req.body.passwordHash;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    if (!email || !passwordHash || !firstName || !lastName) {
        return res.status(400)
                  .json({ error: "Missing required fields" });
    }

    if (firstName.length < 2 || firstName.length > 50) {
        return res.status(400)
                  .json({ error: "First name must be between 2 and 50 characters" });
    }

    if (lastName.length < 2 || lastName.length > 50) {
        return res.status(400)
                  .json({ error: "Last name must be between 2 and 50 characters" });
    }

    // todo validate email

    const existing = await em.findOne("UserAccountEntity", { email });
    if (existing) {
        return res.status(400)
                  .json({ error: "Account with same email already exists" });
    }

    const account = em.create(UserAccountEntity, {
        email,
        firstName,
        lastName,
        passwordHash,
    });

    await em.persistAndFlush(account);

    // todo return a session
});

accountRoute.post("/login", async (req, res) => {
    const email = req.body.email;
    const passwordHash = req.body.passwordHash;

    if (!email || !passwordHash) {
        return res.status(400)
                  .json({ error: "Missing required fields" });
    }

    // todo validate email

    const account = await em.findOne("UserAccountEntity", { email, passwordHash });
    if (!account) {
        return res.status(401)
                  .json({ error: "Invalid email or password" });
    }

    // todo return a session
});
