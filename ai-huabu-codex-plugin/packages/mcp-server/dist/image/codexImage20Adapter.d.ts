import type { ImageEditRequest, ImageGenerationRequest, ImageResult } from '@ai-huabu/shared';
export interface ImageAdapter {
    generateImage(request: ImageGenerationRequest): Promise<ImageResult>;
    editImage(request: ImageEditRequest): Promise<ImageResult>;
}
export declare class ExternalCodexImage20Adapter implements ImageAdapter {
    generateImage(_request: ImageGenerationRequest): Promise<ImageResult>;
    editImage(_request: ImageEditRequest): Promise<ImageResult>;
}
//# sourceMappingURL=codexImage20Adapter.d.ts.map