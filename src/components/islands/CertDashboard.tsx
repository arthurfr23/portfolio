import { useId, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { CERT_LABELS, PRO_CERTS, type DashboardCopy } from '../../data/databricks-dashboard';
import './CertDashboard.css';

export interface Person {
  n: string;
  c: number;
  k: string[];
  t: string;
  w: string;
  f: string;
  s: string;
  u: string;
  r: number;
  me?: boolean;
}

interface Props {
  people: Person[];
  copy: DashboardCopy;
  locale: string;
  contactHref: string;
}

const PAGE_SIZE = 20;
const TAIL = ['other', 'unknown'];
const DIRECTORY = 'https://directory.databrickscertified.com/profile/';
const CERT_SHORT: Record<string, string> = {
  de_assoc: 'DE Assoc',
  de_pro: 'DE Pro',
  da_assoc: 'DA Assoc',
  genai_assoc: 'GenAI',
  spark: 'Spark',
  ml_assoc: 'ML Assoc',
  ml_pro: 'ML Pro',
};

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

interface Tip {
  x: number;
  y: number;
  text: string;
}

function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: MouseEvent<HTMLElement>, text: string) => {
    const host = (e.currentTarget.closest('.dbx-chart') as HTMLElement).getBoundingClientRect();
    const el = e.currentTarget.getBoundingClientRect();
    setTip({ x: el.left - host.left + el.width / 2, y: el.top - host.top, text });
  };
  return { tip, show, hide: () => setTip(null) };
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className="dbx-tip" style={{ left: tip.x, top: tip.y }} role="status">
      {tip.text}
    </div>
  );
}

interface BarRow {
  key: string;
  label: string;
  value: number;
  tip: string;
}

function BarList({ title, note, rows, fmt }: { title: string; note?: string; rows: BarRow[]; fmt: (n: number) => string }) {
  const { tip, show, hide } = useTip();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="dbx-chart">
      <figcaption>
        <span className="dbx-chart-title">{title}</span>
        {note && <span className="dbx-chart-note">{note}</span>}
      </figcaption>
      <ul className="dbx-bars">
        {rows.map((r) => (
          <li
            key={r.key}
            onMouseEnter={(e) => show(e, r.tip)}
            onMouseLeave={hide}
            tabIndex={0}
            onFocus={(e) => show(e as unknown as MouseEvent<HTMLElement>, r.tip)}
            onBlur={hide}
          >
            <span className="dbx-bar-label" title={r.label}>
              {r.label}
            </span>
            <span className="dbx-bar-track">
              <span className="dbx-bar" style={{ width: `calc((100% - 3rem) * ${r.value / max})` }} />
              <span className="dbx-bar-value">{fmt(r.value)}</span>
            </span>
          </li>
        ))}
      </ul>
      <Tooltip tip={tip} />
    </figure>
  );
}

function Columns({ title, axis, rows, fmt }: { title: string; axis: string; rows: BarRow[]; fmt: (n: number) => string }) {
  const { tip, show, hide } = useTip();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="dbx-chart">
      <figcaption>
        <span className="dbx-chart-title">{title}</span>
      </figcaption>
      <div className="dbx-cols">
        {rows.map((r) => (
          <div
            key={r.key}
            className="dbx-col"
            onMouseEnter={(e) => show(e, r.tip)}
            onMouseLeave={hide}
            tabIndex={0}
            onFocus={(e) => show(e as unknown as MouseEvent<HTMLElement>, r.tip)}
            onBlur={hide}
          >
            <span className="dbx-col-value">{r.value > 0 ? fmt(r.value) : ''}</span>
            <span className="dbx-col-bar" style={{ height: `${(r.value / max) * 100}%` }} />
            <span className="dbx-col-label">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="dbx-axis-label">{axis}</div>
      <Tooltip tip={tip} />
    </figure>
  );
}

function RankPicker({ people, copy, fmt }: { people: Person[]; copy: DashboardCopy; fmt: (n: number) => string }) {
  const me = people.find((p) => p.me) ?? people[0];
  const [selected, setSelected] = useState<Person>(me);
  const [query, setQuery] = useState(me.n);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const matches = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle || needle === fold(selected.n)) return [];
    return people.filter((p) => fold(p.n).includes(needle)).slice(0, 8);
  }, [people, query, selected]);

  const choose = (p: Person) => {
    setSelected(p);
    setQuery(p.n);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(selected.n);
    }
  };

  const peers = people.filter((p) => p.c >= selected.c).length;
  const vars = {
    name: selected.n,
    rank: selected.r,
    total: fmt(people.length),
    n: fmt(peers),
    c: selected.c,
    p: Math.ceil((peers / people.length) * 100),
  };
  const showList = open && query.trim() !== '' && fold(query.trim()) !== fold(selected.n);

  return (
    <div className="dbx-picker">
      <label className="dbx-picker-label" htmlFor={`${listId}-input`}>
        {copy.picker.label}
      </label>
      <div className="dbx-combo">
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={copy.picker.placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => e.target.select()}
          onBlur={() => {
            setOpen(false);
            if (!query.trim()) setQuery(selected.n);
          }}
          onKeyDown={onKey}
        />
        {showList && (
          <ul id={listId} role="listbox" className="dbx-options">
            {matches.length === 0 ? (
              <li className="dbx-option-empty">{copy.picker.empty}</li>
            ) : (
              matches.map((p, i) => (
                <li
                  key={p.u}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'active' : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(p);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="dbx-option-name">{p.n}</span>
                  <span className="dbx-option-meta">
                    {[p.w, fill(copy.picker.certs, { c: p.c })].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <p className="dbx-standing" aria-live="polite">
        {fill(selected.me ? copy.picker.me : copy.picker.other, vars)}
      </p>
    </div>
  );
}

export default function CertDashboard({ people, copy, locale, contactHref }: Props) {
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const nf1 = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }), [locale]);
  const fmt = (n: number) => nf.format(n);

  const [q, setQ] = useState('');
  const [cert, setCert] = useState('');
  const [family, setFamily] = useState('');
  const [seniority, setSeniority] = useState('');
  const [min, setMin] = useState(1);
  const [page, setPage] = useState(1);

  const maxCount = useMemo(() => Math.max(...people.map((p) => p.c)), [people]);
  const certCodes = Object.keys(CERT_LABELS);
  const familyKeys = Object.keys(copy.family).filter((k) => people.some((p) => p.f === k));
  const seniorityKeys = Object.keys(copy.seniority).filter((k) => people.some((p) => p.s === k));

  const filtered = useMemo(() => {
    const needle = fold(q.trim());
    return people.filter(
      (p) =>
        (!cert || p.k.includes(cert)) &&
        (!family || p.f === family) &&
        (!seniority || p.s === seniority) &&
        p.c >= min &&
        (!needle || fold(`${p.n} ${p.t} ${p.w}`).includes(needle)),
    );
  }, [people, q, cert, family, seniority, min]);

  const update = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const reset = () => {
    setQ('');
    setCert('');
    setFamily('');
    setSeniority('');
    setMin(1);
    setPage(1);
  };
  const dirty = q || cert || family || seniority || min > 1;

  const total = filtered.length;
  const certsHeld = filtered.reduce((s, p) => s + p.c, 0);
  const proShare = total ? filtered.filter((p) => p.k.some((k) => PRO_CERTS.includes(k))).length / total : 0;
  const companies = new Set(filtered.map((p) => p.w).filter(Boolean)).size;

  const peopleTip = (n: number) => `${fmt(n)} ${copy.charts.people}`;

  const byCert: BarRow[] = certCodes
    .map((code) => {
      const value = filtered.filter((p) => p.k.includes(code)).length;
      return { key: code, label: CERT_LABELS[code], value, tip: `${CERT_LABELS[code]}: ${peopleTip(value)}` };
    })
    .sort((a, b) => b.value - a.value);

  const dist: BarRow[] = Array.from({ length: maxCount }, (_, i) => {
    const c = i + 1;
    const value = filtered.filter((p) => p.c === c).length;
    return { key: String(c), label: String(c), value, tip: `${c} ${copy.charts.certs}: ${peopleTip(value)}` };
  });

  const companyMap = new Map<string, { people: number; certs: number }>();
  for (const p of filtered) {
    if (!p.w) continue;
    const cur = companyMap.get(p.w) ?? { people: 0, certs: 0 };
    cur.people += 1;
    cur.certs += p.c;
    companyMap.set(p.w, cur);
  }
  const topCompanies: BarRow[] = [...companyMap.entries()]
    .sort((a, b) => b[1].people - a[1].people || b[1].certs - a[1].certs || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([name, v]) => ({
      key: name,
      label: name,
      value: v.people,
      tip: `${name}: ${peopleTip(v.people)} · ${fmt(v.certs)} ${copy.charts.certs}`,
    }));

  const byFamily: BarRow[] = familyKeys
    .map((k) => {
      const value = filtered.filter((p) => p.f === k).length;
      return { key: k, label: copy.family[k], value, tip: `${copy.family[k]}: ${peopleTip(value)}` };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => Number(TAIL.includes(a.key)) - Number(TAIL.includes(b.key)) || b.value - a.value);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="dbx">
      <RankPicker people={people} copy={copy} fmt={fmt} />
      <div className="dbx-filters" role="search">
        <input
          type="search"
          value={q}
          onChange={(e) => update(setQ)(e.target.value)}
          placeholder={copy.filters.search}
          aria-label={copy.filters.search}
        />
        <label>
          <span>{copy.filters.cert}</span>
          <select value={cert} onChange={(e) => update(setCert)(e.target.value)}>
            <option value="">{copy.filters.all}</option>
            {certCodes.map((c) => (
              <option key={c} value={c}>
                {CERT_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.filters.family}</span>
          <select value={family} onChange={(e) => update(setFamily)(e.target.value)}>
            <option value="">{copy.filters.all}</option>
            {familyKeys.map((k) => (
              <option key={k} value={k}>
                {copy.family[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.filters.seniority}</span>
          <select value={seniority} onChange={(e) => update(setSeniority)(e.target.value)}>
            <option value="">{copy.filters.all}</option>
            {seniorityKeys.map((k) => (
              <option key={k} value={k}>
                {copy.seniority[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.filters.min}</span>
          <select value={min} onChange={(e) => update(setMin)(Number(e.target.value))}>
            {Array.from({ length: maxCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <div className="dbx-filter-meta">
          <span>{fill(total === 1 ? copy.filters.resultsOne : copy.filters.results, { n: fmt(total) })}</span>
          {dirty && (
            <button type="button" onClick={reset}>
              {copy.filters.reset}
            </button>
          )}
        </div>
      </div>

      <dl className="dbx-kpis">
        <div>
          <dt>{copy.kpi.people}</dt>
          <dd>{fmt(total)}</dd>
        </div>
        <div>
          <dt>{copy.kpi.certs}</dt>
          <dd>{fmt(certsHeld)}</dd>
        </div>
        <div>
          <dt>{copy.kpi.avg}</dt>
          <dd>{total ? nf1.format(certsHeld / total) : '–'}</dd>
        </div>
        <div>
          <dt>{copy.kpi.pro}</dt>
          <dd>{total ? `${Math.round(proShare * 100)}%` : '–'}</dd>
        </div>
        <div>
          <dt>{copy.kpi.companies}</dt>
          <dd>{fmt(companies)}</dd>
        </div>
      </dl>

      <div className="dbx-grid">
        <BarList title={copy.charts.byCert} note={copy.charts.byCertNote} rows={byCert} fmt={fmt} />
        <Columns title={copy.charts.dist} axis={copy.charts.distAxis} rows={dist} fmt={fmt} />
        <BarList title={copy.charts.companies} note={copy.charts.companiesNote} rows={topCompanies} fmt={fmt} />
        <BarList title={copy.charts.family} rows={byFamily} fmt={fmt} />
      </div>

      <section className="dbx-table-wrap" aria-labelledby="dbx-ranking">
        <h3 id="dbx-ranking">{copy.table.title}</h3>
        {rows.length === 0 ? (
          <p className="dbx-empty">{copy.table.empty}</p>
        ) : (
          <div className="dbx-scroll">
            <table className="dbx-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">{copy.table.name}</th>
                  <th scope="col">{copy.table.role}</th>
                  <th scope="col">{copy.table.company}</th>
                  <th scope="col" className="num">
                    {copy.table.certs}
                  </th>
                  <th scope="col">{copy.table.credentials}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.u} className={p.me ? 'is-me' : undefined}>
                    <td className="rank">{p.r}</td>
                    <td>
                      <a href={`${DIRECTORY}${p.u}`} target="_blank" rel="noopener noreferrer" title={copy.table.profile}>
                        {p.n}
                      </a>
                      {p.me && <span className="dbx-me">{copy.table.me}</span>}
                    </td>
                    <td className="muted">{p.t || '–'}</td>
                    <td className="muted">{p.w || '–'}</td>
                    <td className="num">
                      <span className="dbx-count">{p.c}</span>
                    </td>
                    <td>
                      <span className="dbx-badges">
                        {p.k.map((k) => (
                          <span key={k} className={PRO_CERTS.includes(k) ? 'pro' : undefined} title={CERT_LABELS[k]}>
                            {CERT_SHORT[k]}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav className="dbx-pager" aria-label={copy.table.title}>
            <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>
              {copy.table.prev}
            </button>
            <span>{fill(copy.table.page, { p: current, n: pages })}</span>
            <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)}>
              {copy.table.next}
            </button>
          </nav>
        )}
      </section>

      <aside className="dbx-method">
        <h3>{copy.method.title}</h3>
        <ul>
          {copy.method.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {copy.method.optout} <a href={contactHref}>{copy.method.contact}</a>.
        </p>
      </aside>
    </div>
  );
}
