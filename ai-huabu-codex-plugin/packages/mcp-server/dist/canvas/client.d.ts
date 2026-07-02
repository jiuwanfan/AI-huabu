import type { CanvasStatePayload, SelectionSnapshot } from '@ai-huabu/shared';
export type CanvasRuntime = {
    url: string;
    canvasId: string;
    storagePath: string;
    port: number;
};
export declare function getCanvasRuntime(): CanvasRuntime | undefined;
export declare function openCanvas(input: {
    workspaceRoot?: string;
    canvasId?: string;
    port?: number;
}): Promise<{
    product: "ai-huabu";
    url: string;
    canvasId: string;
    storagePath: string;
}>;
export declare function ensureCanvas(): Promise<CanvasRuntime>;
export declare function fetchJson<T>(apiPath: string, explicitUrl?: string): Promise<T>;
export declare function postJson<T>(apiPath: string, body: unknown): Promise<T>;
export declare function getCanvasState(): Promise<CanvasStatePayload>;
export declare function getSelection(): Promise<SelectionSnapshot>;
//# sourceMappingURL=client.d.ts.map