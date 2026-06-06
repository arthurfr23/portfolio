import { profile } from '../data/profile';
import { channels } from '../data/channels';
import { skillCategories } from '../data/skills';
import { SITE, BASE, type Locale } from '../config/site';

export function personJsonLd(lang: Locale): Record<string, unknown> {
  const knowsAbout = skillCategories.flatMap((c) => c.skills.map((s) => s.name));
  const sameAs = [
    `https://github.com/${channels.github.username}`,
    channels.linkedin.url,
    channels.youtube.url,
    channels.medium.url,
  ].filter((url) => !url.includes('PLACEHOLDER'));

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.headline[lang],
    description: profile.metaDescription[lang],
    email: `mailto:${profile.email}`,
    url: `${SITE}${BASE}/`,
    sameAs,
    knowsAbout,
  };
}
