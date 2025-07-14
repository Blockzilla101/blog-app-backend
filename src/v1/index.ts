import express from "express";
import { accountRoute } from "./account.js";
import { todoRoute } from "./todo.js";
import { sessionRoute } from "./session.js";

export const v1 = express();
v1.use("/account", accountRoute);
v1.use("/todo", todoRoute);
v1.use("/session", sessionRoute);
