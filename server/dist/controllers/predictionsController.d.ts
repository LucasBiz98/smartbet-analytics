import { Request, Response, NextFunction } from 'express';
export declare const predictionsController: {
    getPredictions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTodayPredictions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByStake(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLeagues(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPrediction(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=predictionsController.d.ts.map