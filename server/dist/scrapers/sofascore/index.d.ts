import { Page } from 'playwright';
export interface MatchResult {
    externalId: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
    finished: boolean;
}
export interface VerificationResult {
    success: boolean;
    results: MatchResult[];
    error?: string;
}
declare function waitForPageLoad(page: Page): Promise<boolean>;
declare function extractResultsFromPage(page: Page): Promise<MatchResult[]>;
export declare function scrapeSofascore(league?: string): Promise<VerificationResult>;
export declare function verifyMatchResults(): Promise<{
    verified: number;
    pending: number;
}>;
export { extractResultsFromPage, waitForPageLoad };
//# sourceMappingURL=index.d.ts.map