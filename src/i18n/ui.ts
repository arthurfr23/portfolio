// Dicionário de strings de UI (rótulos curtos). Conteúdo longo vive em src/data/*.

export const ui = {
  pt: {
    'nav.about': 'Sobre',
    'nav.skills': 'Stack',
    'nav.experience': 'Experiência',
    'nav.projects': 'Projetos',
    'nav.videos': 'YouTube',
    'nav.articles': 'Blog',
    'nav.talks': 'Palestras',
    'nav.certifications': 'Certificações',
    'nav.contact': 'Contato',
    'nav.cv': 'Currículo',

    'hero.cta_projects': 'Ver projetos',
    'hero.cta_cv': 'Currículo',
    'hero.available': 'Disponível para colaborações',

    'about.eyebrow': 'Sobre',
    'about.title': 'Quem é Arthur',

    'skills.eyebrow': 'Tech Stack',
    'skills.title': 'Ferramentas & tecnologias',

    'experience.eyebrow': 'Trajetória',
    'experience.title': 'Experiência',
    'experience.present': 'Atual',
    'experience.stack': 'Stack',

    'projects.eyebrow': 'Open Source',
    'projects.title': 'Projetos em destaque',
    'projects.subtitle': 'Repositórios públicos no GitHub',
    'projects.viewRepo': 'Ver repositório',
    'projects.viewAll': 'Ver todos no GitHub',
    'projects.empty': 'Repositórios em breve no GitHub.',

    'videos.eyebrow': 'YouTube',
    'videos.title': 'Vídeos recentes',
    'videos.subtitle': 'Tutoriais e conteúdo técnico',
    'videos.watch': 'Assistir',
    'videos.viewAll': 'Ver o canal',
    'videos.empty': 'Canal em breve — fique de olho.',

    'articles.eyebrow': 'Blog',
    'articles.title': 'Artigos no Medium',
    'articles.subtitle': 'Escrevendo sobre engenharia de dados e IA',
    'articles.read': 'Ler artigo',
    'articles.viewAll': 'Ver no Medium',
    'articles.empty': 'Artigos em breve no Medium.',

    'talks.eyebrow': 'Comunidade',
    'talks.title': 'Palestras & eventos',
    'talks.slides': 'Slides',
    'talks.details': 'Detalhes',

    'certifications.eyebrow': 'Credenciais',
    'certifications.title': 'Certificações',
    'certifications.inProgress': 'Em progresso',
    'certifications.verify': 'Verificar',

    'contact.eyebrow': 'Contato',
    'contact.title': 'Vamos conversar',
    'contact.subtitle': 'Aberto a projetos, palestras e trocas técnicas.',
    'contact.email': 'Enviar e-mail',

    'cv.title': 'Currículo',
    'cv.download': 'Baixar PDF',
    'cv.back': 'Voltar ao início',

    'footer.builtWith': 'Construído com Astro',
    'footer.rights': 'Todos os direitos reservados',

    'lang.switch': 'English',
    'lang.label': 'Mudar idioma',
    'theme.toggle': 'Alternar tema',
    'a11y.menu': 'Abrir menu',
    'common.comingSoon': 'Em breve',
  },
  en: {
    'nav.about': 'About',
    'nav.skills': 'Stack',
    'nav.experience': 'Experience',
    'nav.projects': 'Projects',
    'nav.videos': 'YouTube',
    'nav.articles': 'Blog',
    'nav.talks': 'Talks',
    'nav.certifications': 'Certifications',
    'nav.contact': 'Contact',
    'nav.cv': 'Resume',

    'hero.cta_projects': 'View projects',
    'hero.cta_cv': 'Resume',
    'hero.available': 'Open to collaborations',

    'about.eyebrow': 'About',
    'about.title': 'Who is Arthur',

    'skills.eyebrow': 'Tech Stack',
    'skills.title': 'Tools & technologies',

    'experience.eyebrow': 'Journey',
    'experience.title': 'Experience',
    'experience.present': 'Present',
    'experience.stack': 'Stack',

    'projects.eyebrow': 'Open Source',
    'projects.title': 'Featured projects',
    'projects.subtitle': 'Public repositories on GitHub',
    'projects.viewRepo': 'View repository',
    'projects.viewAll': 'View all on GitHub',
    'projects.empty': 'Repositories coming soon on GitHub.',

    'videos.eyebrow': 'YouTube',
    'videos.title': 'Recent videos',
    'videos.subtitle': 'Tutorials and technical content',
    'videos.watch': 'Watch',
    'videos.viewAll': 'Visit the channel',
    'videos.empty': 'Channel coming soon — stay tuned.',

    'articles.eyebrow': 'Blog',
    'articles.title': 'Articles on Medium',
    'articles.subtitle': 'Writing about data engineering and AI',
    'articles.read': 'Read article',
    'articles.viewAll': 'View on Medium',
    'articles.empty': 'Articles coming soon on Medium.',

    'talks.eyebrow': 'Community',
    'talks.title': 'Talks & events',
    'talks.slides': 'Slides',
    'talks.details': 'Details',

    'certifications.eyebrow': 'Credentials',
    'certifications.title': 'Certifications',
    'certifications.inProgress': 'In progress',
    'certifications.verify': 'Verify',

    'contact.eyebrow': 'Contact',
    'contact.title': "Let's talk",
    'contact.subtitle': 'Open to projects, talks and technical exchanges.',
    'contact.email': 'Send email',

    'cv.title': 'Resume',
    'cv.download': 'Download PDF',
    'cv.back': 'Back to home',

    'footer.builtWith': 'Built with Astro',
    'footer.rights': 'All rights reserved',

    'lang.switch': 'Português',
    'lang.label': 'Switch language',
    'theme.toggle': 'Toggle theme',
    'a11y.menu': 'Open menu',
    'common.comingSoon': 'Coming soon',
  },
} as const;

export type UIKey = keyof (typeof ui)['pt'];
