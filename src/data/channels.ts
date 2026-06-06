import type { Channels } from './types';

// github, youtube e medium confirmados (feeds testados no build).
// ⚠️ AINDA CONFIRMAR pelo dono:
//  - linkedin.url: URL completa do perfil.
export const channels: Channels = {
  github: { username: 'arthurfr23' },
  youtube: {
    channelId: 'UCgO7KIRDTiWYiIH2mdfxcMw',
    url: 'https://www.youtube.com/@arthur_ferreirareis',
  },
  medium: {
    username: '@arthurfr23',
    url: 'https://medium.com/@arthurfr23',
  },
  linkedin: {
    url: 'https://www.linkedin.com/in/arthurfr23/', // TODO: confirmar URL
  },
};
