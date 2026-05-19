import { Request, Response, NextFunction } from 'express';

export function validateBody(validator: (body: any) => string | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const error = validator(req.body);
    if (error) {
      res.status(400).json({ success: false, error });
      return;
    }
    next();
  };
}
