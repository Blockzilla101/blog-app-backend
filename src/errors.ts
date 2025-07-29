import { ValidationError } from "express-validator";

export class ValidatorError extends Error {
    public result: ValidationError[];

    constructor(result: ValidationError[]) {
        super(`Parameter validation failed, ${result.length} errors`);
        this.result = result;
    }
}