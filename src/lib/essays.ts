import { getCollection, type CollectionEntry } from 'astro:content';
import { TOPICS } from '../config';

export type Essay = CollectionEntry<'essays'>;

/** All published essays, newest first. Essays with `draft: true` are hidden. */
export async function getEssays(): Promise<Essay[]> {
  const all = await getCollection('essays', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function topicName(slug: string): string {
  return TOPICS.find((t) => t.slug === slug)?.name ?? slug;
}

/** Topics shown as small slips (poems) instead of envelopes. */
const POEM_TOPICS = ['kavita', 'charoli'];

export function isPoem(essay: Essay): boolean {
  return POEM_TOPICS.includes(essay.data.topic);
}

/** First few non-empty lines of a poem. */
export function poemLines(essay: Essay, max = 4): string[] {
  return (essay.body ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max);
}
