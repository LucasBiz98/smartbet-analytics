import { Request, Response, NextFunction } from 'express';
export declare const betsController: {
    getBets(req: Request, res: Response, next: NextFunction): Promise<void>;
    getBet(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createBet(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateBet(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteBet(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getPendingBets(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=betsController.d.ts.map