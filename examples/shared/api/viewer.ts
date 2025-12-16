import { delay } from './utils';
import { viewers } from './db';
import type { ViewerDto } from './dto';

const toViewerPreview = (viewer: ViewerDto): ViewerDto => ({
  id: viewer.id,
  name: viewer.name,
  avatarUrl: viewer.avatarUrl,
});

export const ViewerApi = {

  async getCurrentViewer(): Promise<ViewerDto> {
    await delay(300);

    return toViewerPreview(viewers[0]);
  },

  async getViewerById(id: string): Promise<ViewerDto> {
    await delay(200);

    return viewers.find(v => v.id === id)!;
  },
};
