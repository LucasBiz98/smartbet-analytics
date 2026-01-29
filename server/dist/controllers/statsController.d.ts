import { Request, Response, NextFunction } from 'express';
export declare const statsController: {
    getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMarketStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLeagueStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPerformanceHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=statsController.d.ts.map