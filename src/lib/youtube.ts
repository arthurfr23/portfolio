import { resilient, fetchWithTimeout, makeParser, asArray } from './rss';
import { channels } from '../data/channels';

export interface VideoInfo {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
  published: string;
}

async function fetchVideos(): Promise<VideoInfo[]> {
  const { channelId, featuredVideoIds } = channels.youtube;
  if (!channelId || channelId.includes('PLACEHOLDER')) return [];

  const res = await fetchWithTimeout(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
  );
  if (!res.ok) throw new Error(`YouTube feed ${res.status}`);

  const data = makeParser().parse(await res.text());
  const entries = asArray<Record<string, any>>(data?.feed?.entry);

  const all = entries.map((e) => {
    const videoId = String(e['yt:videoId'] ?? '');
    return {
      title: String(e.title ?? ''),
      videoId,
      url: e.link?.['@_href'] ?? `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail:
        e['media:group']?.['media:thumbnail']?.['@_url'] ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      published: String(e.published ?? ''),
    };
  });

  if (featuredVideoIds && featuredVideoIds.length > 0) {
    const set = new Set(featuredVideoIds);
    return all.filter((v) => set.has(v.videoId));
  }

  return all.slice(0, 6);
}

export const getVideos = (): Promise<VideoInfo[]> => resilient('youtube', [], fetchVideos);
