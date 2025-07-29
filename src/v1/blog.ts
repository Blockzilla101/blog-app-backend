import express from "express";
import { authorizedRoute } from "./session.js";
import { checkSchema } from "express-validator";
import { handleValidatorError } from "../util.js";

export const blogRoute = express();
// const em = orm.em;

blogRoute.get("/blogs", async (req, res) => {
    const result = await checkSchema({
        author: {
            optional: true,
            isUUID: {
                errorMessage: "Invalid author UUID",
            },
        },
        limit: {
            optional: true,
            isLength: {
                options: {
                    min: 5,
                    max: 50,
                },
                errorMessage: "Limit must be between 5 and 50",
            },
            isInt: {
                errorMessage: "Limit must be an integer",
            },
            default: {
                options: 10,
            },
            toInt: true,
        },
        cursor: {
            optional: true,
            isString: {
                errorMessage: "Cursor must be a string",
            },
        },
    }, ["query"])
      .run(req);

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
    }

    return res.json({
        msg: "not implemented yet",
    });
});

blogRoute.get("/by-uuid/:uuid", async (req, res) => {
});

blogRoute.use(authorizedRoute);

blogRoute.post("/create", async (req, res) => {
});

blogRoute.patch("/update/:uuid", async (req, res) => {
});

blogRoute.delete("/delete/:uuid", async (req, res) => {
});
