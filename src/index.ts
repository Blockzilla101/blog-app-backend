import "dotenv/config";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { create, Log } from "./log.js";
import { v1 } from "./v1/index.js";
import rateLimit from "express-rate-limit";

Log.rotate();
const log = create("main");

const limiter = rateLimit({
    windowMs: 30 * 1000,
    limit: 50,
});

const app = express();
const port = 8085;

app.use(limiter);

app.use((req, res, next) => {
    log.info(`${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use("/v1", v1);

app.use(bodyParser.json());

app.listen(port, () => {
    log.info(`Server is running on port ${port}`);
});
