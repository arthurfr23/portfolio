import { useEffect, useState, type KeyboardEvent } from 'react';
import CertDashboard, { type Person } from './CertDashboard';
import type { DashboardCopy } from '../../data/databricks-dashboard';

type Scope = 'br' | 'intl';

interface IntlData {
  snapshot: string;
  continents: Record<string, string>;
  people: Person[];
}

interface Props {
  people: Person[];
  snapshot: string;
  copy: DashboardCopy;
  locale: string;
  contactHref: string;
}

const SCOPES: Scope[] = ['br', 'intl'];
const HASH: Record<Scope, string> = { br: '', intl: '#international' };

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

export default function CertTabs({ people, snapshot, copy, locale, contactHref }: Props) {
  const [scope, setScope] = useState<Scope>('br');
  const [intl, setIntl] = useState<IntlData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (window.location.hash === HASH.intl) setScope('intl');
  }, []);

  useEffect(() => {
    if (scope !== 'intl' || intl) return;
    import('../../data/databricks-certs-intl.json')
      .then((m) => setIntl(m.default as IntlData))
      .catch(() => setFailed(true));
  }, [scope, intl]);

  const select = (s: Scope) => {
    setScope(s);
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${HASH[s]}`);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = SCOPES[(SCOPES.indexOf(scope) + 1) % SCOPES.length];
    select(next);
    document.getElementById(`dbx-tab-${next}`)?.focus();
  };

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${iso}T00:00:00Z`),
    );

  return (
    <div className="dbx-tabs">
      <div className="dbx-tablist" role="tablist" aria-label={copy.tabs.label}>
        {SCOPES.map((s) => (
          <button
            key={s}
            id={`dbx-tab-${s}`}
            type="button"
            role="tab"
            aria-selected={scope === s}
            aria-controls={`dbx-panel-${s}`}
            tabIndex={scope === s ? 0 : -1}
            onClick={() => select(s)}
            onKeyDown={onKey}
          >
            {copy.tabs[s]}
          </button>
        ))}
      </div>

      <div id="dbx-panel-br" role="tabpanel" aria-labelledby="dbx-tab-br" hidden={scope !== 'br'}>
        <p className="dbx-snapshot">{fill(copy.snapshot, { date: dateLabel(snapshot) })}</p>
        <CertDashboard people={people} copy={copy} locale={locale} contactHref={contactHref} scope="br" />
      </div>

      <div id="dbx-panel-intl" role="tabpanel" aria-labelledby="dbx-tab-intl" hidden={scope !== 'intl'}>
        {intl ? (
          <>
            <p className="dbx-snapshot">{fill(copy.snapshot, { date: dateLabel(intl.snapshot) })}</p>
            <CertDashboard
              people={intl.people}
              continents={intl.continents}
              copy={copy}
              locale={locale}
              contactHref={contactHref}
              scope="intl"
            />
          </>
        ) : (
          <p className="dbx-loading" role="status">
            {failed ? copy.tabs.error : copy.tabs.loading}
          </p>
        )}
      </div>
    </div>
  );
}
