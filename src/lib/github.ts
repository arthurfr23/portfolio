import { resilient, fetchWithTimeout } from './rss';
import { channels } from '../data/channels';
import { curatedProjects } from '../data/projects';
import type { CuratedProject } from '../data/types';

export interface RepoInfo {
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
}

export interface Project extends RepoInfo {
  curated?: CuratedProject;
}

const TOKEN = process.env.GH_API_TOKEN || process.env.GITHUB_TOKEN || '';

async function fetchRepos(): Promise<RepoInfo[]> {
  const username = channels.github.username;
  const res = await fetchWithTimeout(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'site-pessoal-build',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = (await res.json()) as Array<Record<string, unknown>>;
  return data
    .filter((r) => !r.fork && !r.archived && !r.private)
    .map((r) => ({
      name: String(r.name),
      description: (r.description as string) ?? '',
      url: String(r.html_url),
      stars: (r.stargazers_count as number) ?? 0,
      forks: (r.forks_count as number) ?? 0,
      language: (r.language as string) ?? null,
      topics: (r.topics as string[]) ?? [],
      updatedAt: (r.pushed_at as string) ?? (r.updated_at as string) ?? '',
    }));
}

export async function getProjects(): Promise<Project[]> {
  const repos = await resilient<RepoInfo[]>('github', [], fetchRepos);
  if (repos.length === 0) return [];

  const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

  // Mescla os curados (na ordem definida) com os dados reais do GitHub.
  const matched = curatedProjects
    .map((c) => {
      const info = byName.get(c.repo.toLowerCase());
      return info ? ({ ...info, curated: c } as Project) : null;
    })
    .filter((p): p is Project => p !== null);

  if (matched.length > 0) return matched;

  // Fallback: nenhum curado encontrado -> top repositórios por estrelas.
  return [...repos].sort((a, b) => b.stars - a.stars).slice(0, 6);
}
