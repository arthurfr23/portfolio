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
  // Não filtramos forks aqui: os repos exibidos são explicitamente curados em
  // projects.ts, então o filtro de fork seria redundante e quebraria repos
  // como data-agents-copilot que é um fork deliberadamente incluído.
  return data
    .filter((r) => !r.archived && !r.private)
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
  const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

  return curatedProjects.map((c): Project => {
    const info = byName.get(c.repo.toLowerCase());
    if (info) return { ...info, curated: c };

    // Fallback estático para repos que não aparecem na API (fork não retornado,
    // repo ainda privado, etc.). Usa staticUrl e description do curated.
    return {
      name: c.repo,
      description: c.description?.['pt'] ?? '',
      url: c.staticUrl ?? `https://github.com/${channels.github.username}/${c.repo}`,
      stars: 0,
      forks: 0,
      language: null,
      topics: c.tags ?? [],
      updatedAt: '',
      curated: c,
    };
  });
}
