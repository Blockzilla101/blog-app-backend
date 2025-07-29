import express from "express";
import { accountRoute } from "./account.js";
import { sessionRoute } from "./session.js";
import { blogRoute } from "./blog.js";

export const v1 = express();
v1.use("/account", accountRoute);
v1.use("/blog", blogRoute);
v1.use("/session", sessionRoute);
