import { Page } from 'playwright';
export interface PredictionData {
    externalId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchDate: Date;
    matchTime: string;
    market: string;
    odds: number;
    probability: number;
    stake: number;
    confidenceLevel: string;
    homeOdds?: number;
    drawOdds?: number;
    awayOdds?: number;
}
export interface ScrapingResult {
    success: boolean;
    predictions: PredictionData[];
    matchesFound: number;
    error?: string;
}
declare function waitForCloudflare(page: Page): Promise<boolean>;
declare function extractPredictionData(page: Page): Promise<PredictionData[]>;
export declare function scrapeFootyStats(): Promise<ScrapingResult>;
export declare function savePredictionsToDatabase(predictions: PredictionData[]): Promise<{
    saved: number;
    errors: number;
}>;
export { extractPredictionData, waitForCloudflare };
//# sourceMappingURL=index.d.ts.map