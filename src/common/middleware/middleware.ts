import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const now = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl;

        console.log(`[${now}] ${method} ${url}`);
        next();
    }
}
