import type { Request, Response } from "express";
import { badRequest } from "../../utils/httpError.js";
import { scanIndex } from "./scan.service.js";

export async function scan(req: Request, res: Response) {
  if (!req.file) throw badRequest("No image file provided (field name: image)");
  const recipes = await scanIndex(req.file.buffer, req.file.mimetype);
  res.json({ recipes });
}
