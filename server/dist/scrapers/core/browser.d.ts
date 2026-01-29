import { ChromiumBrowser, BrowserContext } from 'playwright';
export declare function getBrowser(): Promise<{
    browser: ChromiumBrowser;
    context: BrowserContext;
}>;
export declare function closeBrowser(): Promise<void>;
export declare function randomDelay(minMs?: number, maxMs?: number): Promise<void>;
export declare function scrollPage(page: any, scrollCount?: number): Promise<void>;
export declare function getRandomProxy(): string | null;
//# sourceMappingURL=browser.d.ts.map