import type { AnyZodObject, ZodTypeAny } from "zod";
import type { RequestHandler } from "express";

export function validateBody(schema: AnyZodObject | ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    (req as any).validatedBody = result.data;
    next();
  };
}

export function validateQuery(schema: AnyZodObject | ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    (req as any).validatedQuery = result.data;
    next();
  };
}
