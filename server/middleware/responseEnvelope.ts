import type { Request, Response, NextFunction } from "express";

// Ensures every API JSON response follows: { state, message, data }
export function responseEnvelope(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res) as (body?: any) => Response;

  const wrappedJson: Response["json"] = (body?: any) => {
    // Allow controllers to opt-out by sending pre-wrapped structure
    if (body && typeof body === "object" && "state" in body && "message" in body) {
      return originalJson(body);
    }

    let message = "Success";
    let data: unknown = body ?? null;

    // If the controller only provided a message
    if (body && typeof body === "object" && "message" in body && Object.keys(body).length === 1) {
      message = (body as any).message;
      data = null;
    } else if (typeof body === "string") {
      message = body;
      data = null;
    }

    const state = res.statusCode || 200;
    return originalJson({ state, message, data });
  };

  res.json = wrappedJson;

  next();
}
