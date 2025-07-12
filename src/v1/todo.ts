import express from "express";

export const todoRoute = express();

todoRoute.get("/all", async (req, res) => {
});

todoRoute.post("/create", async (req, res) => {
});

todoRoute.patch("/update/:uuid", async (req, res) => {
});

todoRoute.delete("/delete/:uuid", async (req, res) => {
});
