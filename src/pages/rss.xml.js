import rss from '@astrojs/rss';
import { SITE } from '../config';
import { getEssays } from '../lib/essays';

export async function GET(context) {
  const essays = await getEssays();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    customData: '<language>mr</language>',
    items: essays.map((essay) => ({
      title: essay.data.title,
      description: essay.data.description,
      pubDate: essay.data.pubDate,
      link: `/essays/${essay.id}/`,
    })),
  });
}
