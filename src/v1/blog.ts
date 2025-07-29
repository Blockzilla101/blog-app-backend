import express from "express";
import { authorizedRoute, getSessionAccount } from "./session.js";
import { checkSchema } from "express-validator";
import { handleValidatorError } from "../util.js";
import { orm } from "../database/index.js";
import { BlogItemEntity } from "../entities/blog-item.entity.js";

export const blogRoute = express();
const em = orm.em;

function transformBlogItem(item: BlogItemEntity) {
    return {
        uuid: item.uuid,
        title: item.title,
        content: item.content,
        createdAt: item.createdAt,
        author: {
            uuid: item.author.uuid,
            firstName: item.author.firstName,
            lastName: item.author.lastName,
            avatar: item.author.avatar,
            bio: item.author.bio,
        },
    };
}

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
        // partial: {
        //     optional: true,
        //     isInt: {
        //         errorMessage: "partial must be an integer",
        //     },
        //     toInt: true,
        // },
        after: {
            optional: true,
            isString: {
                errorMessage: "after must be a string",
            },
        },
    }, ["query"])
      .run(req);

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
    }

    const cursor = await em.findByCursor(BlogItemEntity, {
        author: {
            uuid: req.query.author as string ?? undefined,
        },
    }, {
        first: req.query.limit as unknown as number ?? 10,
        after: req.query.after as string ?? undefined,
        orderBy: {
            createdAt: "desc",
        },
        populate: ["author"],
    });

    return res.status(200)
              .json({
                  blogs: cursor.items.map(transformBlogItem),
                  hasNext: cursor.hasNextPage,
                  next: cursor.endCursor,
                  total: cursor.totalCount,
              });
});

blogRoute.get("/by-uuid/:uuid", async (req, res) => {
    const result = await checkSchema({
        uuid: {
            isUUID: {
                errorMessage: "Invalid blog UUID",
            },
        },
    }, ["params"])
      .run(req);

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
    }

    const blog = await em.findOne(BlogItemEntity, {
        uuid: req.params.uuid,
    }, {
        populate: ["author"],
    });

    if (!blog) {
        return res.status(404)
                  .json({
                      errors: [
                          {
                              msg: "Blog not found",
                          },
                      ],
                  });
    }

    return res.status(200)
              .json(transformBlogItem(blog));

});

blogRoute.use(authorizedRoute);

blogRoute.post("/create", async (req, res) => {
    const result = await checkSchema({
        title: {
            isString: {
                errorMessage: "Title must be a string",
            },
            isLength: {
                options: {
                    min: 1,
                    max: 100,
                },
                errorMessage: "Title must be between 1 and 100 characters",
            },
        },
        content: {
            isString: {
                errorMessage: "Content must be a string",
            },
            isLength: {
                options: {
                    min: 50,
                    max: 4096,
                },
                errorMessage: "Content must be between 50 and 4096 characters",
            },
        },
    }, ["body"])
      .run(req);

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
    }

    const account = await getSessionAccount(req);
    const blog = em.create(BlogItemEntity, {
        title: req.body.title,
        content: req.body.content,
        author: account,
    });

    await em.persistAndFlush(blog);

    return res.status(201)
              .json(transformBlogItem(blog));
});

blogRoute.patch("/update/:uuid", async (req, res) => {
    const result = await checkSchema({
        uuid: {
            in: "params",
            isUUID: {
                errorMessage: "Invalid blog UUID",
            },
        },
        title: {
            isString: {
                errorMessage: "Title must be a string",
            },
            isLength: {
                options: {
                    min: 1,
                    max: 100,
                },
                errorMessage: "Title must be between 1 and 100 characters",
            },
        },
        content: {
            isString: {
                errorMessage: "Content must be a string",
            },
            isLength: {
                options: {
                    min: 50,
                    max: 4096,
                },
                errorMessage: "Content must be between 50 and 4096 characters",
            },
        },
    }, ["body"])
      .run(req);

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
    }

    const account = await getSessionAccount(req);
    const blog = await em.findOne(BlogItemEntity, {
        uuid: req.params.uuid,
    }, {
        populate: ["author"],
    });

    if (!blog) {
        return res.status(404)
                  .json({
                      errors: [
                          {
                              msg: "Blog not found",
                          },
                      ],
                  });
    }

    if (blog.author.uuid !== account.uuid) {
        return res.status(403)
                  .json({
                      errors: [
                          {
                              msg: "You are not allowed to update this blog",
                          },
                      ],
                  });
    }

    blog.title = req.body.title;
    blog.content = req.body.content;

    await em.persistAndFlush(blog);

    return res.status(200)
              .json(transformBlogItem(blog));
});

blogRoute.delete("/delete/:uuid", async (req, res) => {
    const result = await checkSchema({
        uuid: {
            isUUID: {
                errorMessage: "Invalid blog UUID",
            },
        },
    }, ["params"])
      .run(req);

    const errors = handleValidatorError(result);
    if (errors) {
        return res.status(400)
                  .json({ errors });
    }

    const blog = await em.findOne(BlogItemEntity, {
        uuid: req.params.uuid,
    }, {
        populate: ["author"],
    });

    if (!blog) {
        return res.status(404)
                  .json({
                      errors: [
                          {
                              msg: "Blog not found",
                          },
                      ],
                  });
    }

    const account = await getSessionAccount(req);

    if (blog.author.uuid !== account.uuid) {
        return res.status(403)
                  .json({
                      errors: [
                          {
                              msg: "You are not allowed to delete this blog",
                          },
                      ],
                  });
    }

    await em.removeAndFlush(blog);

    return res.status(204)
              .send();
});
