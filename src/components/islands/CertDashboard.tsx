import { useId, useMemo, useState, type KeyboardEvent, type MouseEvent, type UIEvent } from 'react';
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
  g?: string;
  cr?: number;
  me?: boolean;
}

interface Props {
  people: Person[];
  copy: DashboardCopy;
  locale: string;
  contactHref: string;
  scope: 'br' | 'intl';
  continents?: Record<string, string>;
}

const PAGE_SIZE = 20;
const TAIL = ['other', 'unknown'];
const UNKNOWN = 'unknown';
type Dim = 'cert' | 'family' | 'continent' | 'country' | 'company' | 'count';
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

interface Selectable {
  selected?: string;
  onSelect?: (key: string) => void;
}

const SCROLL_STEP = 60;

interface PickProps {
  className?: string;
  role?: string;
  'aria-pressed'?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
}

function pickProps(key: string, { selected, onSelect }: Selectable): PickProps {
  if (!onSelect) return {};
  const cls = selected ? (selected === key ? 'is-active' : 'is-dim') : undefined;
  return {
    className: cls,
    role: 'button',
    'aria-pressed': selected === key,
    onClick: () => onSelect(key),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(key);
      }
    },
  };
}

function BarList({
  title,
  note,
  rows,
  fmt,
  scroll,
  ...sel
}: { title: string; note?: string; rows: BarRow[]; fmt: (n: number) => string; scroll?: boolean } & Selectable) {
  const { tip, show, hide } = useTip();
  const [limit, setLimit] = useState(SCROLL_STEP);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const visible = scroll ? rows.slice(0, limit) : rows;
  const onScroll = (e: UIEvent<HTMLUListElement>) => {
    hide();
    const el = e.currentTarget;
    if (limit < rows.length && el.scrollTop + el.clientHeight > el.scrollHeight - 120) setLimit(limit + SCROLL_STEP);
  };
  return (
    <figure className="dbx-chart">
      <figcaption>
        <span className="dbx-chart-title">{title}</span>
        {note && <span className="dbx-chart-note">{note}</span>}
      </figcaption>
      <ul className={scroll ? 'dbx-bars dbx-bars--scroll' : 'dbx-bars'} onScroll={scroll ? onScroll : undefined}>
        {visible.map((r) => (
          <li
            key={r.key}
            onMouseEnter={(e) => show(e, r.tip)}
            onMouseLeave={hide}
            tabIndex={0}
            onFocus={(e) => show(e as unknown as MouseEvent<HTMLElement>, r.tip)}
            onBlur={hide}
            {...pickProps(r.key, sel)}
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

function Columns({
  title,
  axis,
  rows,
  fmt,
  ...sel
}: { title: string; axis: string; rows: BarRow[]; fmt: (n: number) => string } & Selectable) {
  const { tip, show, hide } = useTip();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="dbx-chart">
      <figcaption>
        <span className="dbx-chart-title">{title}</span>
      </figcaption>
      <div className="dbx-cols">
        {rows.map((r) => {
          const pick = pickProps(r.key, sel);
          return (
            <div
              key={r.key}
              onMouseEnter={(e) => show(e, r.tip)}
              onMouseLeave={hide}
              tabIndex={0}
              onFocus={(e) => show(e as unknown as MouseEvent<HTMLElement>, r.tip)}
              onBlur={hide}
              {...pick}
              className={['dbx-col', pick.className].filter(Boolean).join(' ')}
            >
              <span className="dbx-col-value">{r.value > 0 ? fmt(r.value) : ''}</span>
              <span className="dbx-col-bar" style={{ height: `${(r.value / max) * 100}%` }} />
              <span className="dbx-col-label">{r.label}</span>
            </div>
          );
        })}
      </div>
      <div className="dbx-axis-label">{axis}</div>
      <Tooltip tip={tip} />
    </figure>
  );
}

function RankPicker({
  people,
  copy,
  fmt,
  countryName,
}: {
  people: Person[];
  copy: DashboardCopy;
  fmt: (n: number) => string;
  countryName?: (code: string) => string;
}) {
  const me = people.find((p) => p.me) ?? people[0];
  const [selected, setSelected] = useState<Person>(me);
  const [query, setQuery] = useState(me.n);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const names = useMemo(() => people.map((p) => fold(p.n)), [people]);

  const matches = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle || needle === fold(selected.n)) return [];
    const out: Person[] = [];
    for (let i = 0; i < people.length && out.length < 8; i++) if (names[i].includes(needle)) out.push(people[i]);
    return out;
  }, [people, names, query, selected]);

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
        {countryName && selected.g && selected.cr && ` ${countryName(selected.g)}: #${selected.cr}.`}
      </p>
    </div>
  );
}

export default function CertDashboard({ people, copy, locale, contactHref, scope, continents }: Props) {
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const nf1 = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }), [locale]);
  const fmt = (n: number) => nf.format(n);

  const [q, setQ] = useState('');
  const [cert, setCert] = useState('');
  const [family, setFamily] = useState('');
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [exact, setExact] = useState(0);
  const [min, setMin] = useState(1);
  const [page, setPage] = useState(1);

  const maxCount = useMemo(() => Math.max(...people.map((p) => p.c)), [people]);
  const certCodes = Object.keys(CERT_LABELS);
  const familyKeys = Object.keys(copy.family).filter((k) => people.some((p) => p.f === k));
  const search = useMemo(() => people.map((p) => fold(`${p.n} ${p.t} ${p.w}`)), [people]);

  const intl = scope === 'intl' && !!continents;
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);
  const countryName = (code: string) => (code ? (regionNames?.of(code) ?? code) : copy.continent[UNKNOWN]);
  const continentOf = (p: Person) => (p.g ? continents?.[p.g] : undefined) ?? UNKNOWN;
  const continentKeys = Object.keys(copy.continent).filter((k) => people.some((p) => continentOf(p) === k));
  const knownCountries = intl
    ? Object.keys(continents ?? {})
        .filter((c) => !continent || continents?.[c] === continent)
        .sort((a, b) => countryName(a).localeCompare(countryName(b), locale))
    : [];
  const countryKeys = !continent || continent === UNKNOWN ? [...knownCountries, UNKNOWN] : knownCountries;

  const needle = fold(q.trim());
  const active: Record<Dim, boolean> = {
    cert: !!cert,
    family: !!family,
    continent: !!continent,
    country: !!country,
    company: !!company,
    count: exact > 0,
  };
  const match = (p: Person, i: number, skip?: Dim) =>
    (skip === 'cert' || !cert || p.k.includes(cert)) &&
    (skip === 'family' || !family || p.f === family) &&
    (skip === 'continent' || !continent || continentOf(p) === continent) &&
    (skip === 'country' || !country || (p.g || UNKNOWN) === country) &&
    (skip === 'company' || !company || p.w === company) &&
    (skip === 'count' || !exact || p.c === exact) &&
    p.c >= min &&
    (!needle || search[i].includes(needle));

  const filtered = useMemo(
    () => people.filter((p, i) => match(p, i)),
    [people, search, needle, cert, family, continent, country, company, exact, min],
  );
  // cada gráfico ignora o próprio filtro (como no Power BI), para continuar mostrando as demais barras
  const except = (dim: Dim) => (active[dim] ? people.filter((p, i) => match(p, i, dim)) : filtered);

  const update = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const toggle = <T,>(setter: (v: T) => void, current: T, empty: T) => (v: T) => update(setter)(current === v ? empty : v);
  const pickContinent = (v: string) => {
    update(setContinent)(v);
    if (country && v && (country === UNKNOWN ? v !== UNKNOWN : continents?.[country] !== v)) setCountry('');
  };
  const reset = () => {
    setQ('');
    setCert('');
    setFamily('');
    setContinent('');
    setCountry('');
    setCompany('');
    setExact(0);
    setMin(1);
    setPage(1);
  };
  const dirty = q || cert || family || continent || country || company || exact || min > 1;
  const countryRank = !!country && country !== UNKNOWN;

  const total = filtered.length;
  const certsHeld = filtered.reduce((s, p) => s + p.c, 0);
  const proShare = total ? filtered.filter((p) => p.k.some((k) => PRO_CERTS.includes(k))).length / total : 0;
  const companies = new Set(filtered.map((p) => p.w).filter(Boolean)).size;
  const countries = new Set(filtered.map((p) => p.g).filter(Boolean)).size;

  const peopleTip = (n: number) => `${fmt(n)} ${copy.charts.people}`;

  const certBase = except('cert');
  const byCert: BarRow[] = certCodes
    .map((code) => {
      const value = certBase.filter((p) => p.k.includes(code)).length;
      return { key: code, label: CERT_LABELS[code], value, tip: `${CERT_LABELS[code]}: ${peopleTip(value)}` };
    })
    .sort((a, b) => b.value - a.value);

  const countBase = except('count');
  const dist: BarRow[] = Array.from({ length: maxCount }, (_, i) => {
    const c = i + 1;
    const value = countBase.filter((p) => p.c === c).length;
    return { key: String(c), label: String(c), value, tip: `${c} ${copy.charts.certs}: ${peopleTip(value)}` };
  });

  const companyMap = new Map<string, { people: number; certs: number }>();
  for (const p of except('company')) {
    if (!p.w) continue;
    const cur = companyMap.get(p.w) ?? { people: 0, certs: 0 };
    cur.people += 1;
    cur.certs += p.c;
    companyMap.set(p.w, cur);
  }
  const topCompanies: BarRow[] = [...companyMap.entries()]
    .sort((a, b) => b[1].people - a[1].people || b[1].certs - a[1].certs || a[0].localeCompare(b[0]))
    .map(([name, v]) => ({
      key: name,
      label: name,
      value: v.people,
      tip: `${name}: ${peopleTip(v.people)} · ${fmt(v.certs)} ${copy.charts.certs}`,
    }));

  const topCompanyCerts: BarRow[] = [...companyMap.entries()]
    .sort((a, b) => b[1].certs - a[1].certs || b[1].people - a[1].people || a[0].localeCompare(b[0]))
    .map(([name, v]) => ({
      key: name,
      label: name,
      value: v.certs,
      tip: `${name}: ${fmt(v.certs)} ${copy.charts.certs} · ${peopleTip(v.people)}`,
    }));

  const familyBase = except('family');
  const byFamily: BarRow[] = familyKeys
    .map((k) => {
      const value = familyBase.filter((p) => p.f === k).length;
      return { key: k, label: copy.family[k], value, tip: `${copy.family[k]}: ${peopleTip(value)}` };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => Number(TAIL.includes(a.key)) - Number(TAIL.includes(b.key)) || b.value - a.value);

  const countryMap = new Map<string, number>();
  const continentMap = new Map<string, number>();
  if (intl) {
    for (const p of except('country')) if (p.g) countryMap.set(p.g, (countryMap.get(p.g) ?? 0) + 1);
    for (const p of except('continent')) {
      const k = continentOf(p);
      continentMap.set(k, (continentMap.get(k) ?? 0) + 1);
    }
  }
  const topCountries: BarRow[] = [...countryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, value]) => ({ key: code, label: countryName(code), value, tip: `${countryName(code)}: ${peopleTip(value)}` }));
  const byContinent: BarRow[] = [...continentMap.entries()]
    .map(([k, value]) => ({ key: k, label: copy.continent[k], value, tip: `${copy.continent[k]}: ${peopleTip(value)}` }))
    .sort((a, b) => Number(TAIL.includes(a.key)) - Number(TAIL.includes(b.key)) || b.value - a.value);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="dbx">
      <RankPicker people={people} copy={copy} fmt={fmt} countryName={intl ? countryName : undefined} />
      <div className="dbx-filters" role="search">
        <input
          type="search"
          value={q}
          onChange={(e) => update(setQ)(e.target.value)}
          placeholder={copy.filters.search}
          aria-label={copy.filters.search}
        />
        {intl && (
          <>
            <label>
              <span>{copy.filters.continent}</span>
              <select
                value={continent}
                onChange={(e) => pickContinent(e.target.value)}
              >
                <option value="">{copy.filters.all}</option>
                {continentKeys.map((k) => (
                  <option key={k} value={k}>
                    {copy.continent[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.filters.country}</span>
              <select value={country} onChange={(e) => update(setCountry)(e.target.value)}>
                <option value="">{copy.filters.all}</option>
                {countryKeys.map((c) => (
                  <option key={c} value={c}>
                    {c === UNKNOWN ? copy.continent[UNKNOWN] : countryName(c)}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
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
          {company && (
            <button type="button" className="dbx-chip" onClick={() => update(setCompany)('')} aria-label={`${copy.filters.remove}: ${company}`}>
              {copy.filters.company}: {company} ×
            </button>
          )}
          {exact > 0 && (
            <button type="button" className="dbx-chip" onClick={() => update(setExact)(0)} aria-label={copy.filters.remove}>
              {fill(copy.filters.exact, { c: exact })} ×
            </button>
          )}
          {dirty && (
            <button type="button" onClick={reset}>
              {copy.filters.reset}
            </button>
          )}
        </div>
      </div>

      <dl className={intl ? 'dbx-kpis dbx-kpis--6' : 'dbx-kpis'}>
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
        {intl && (
          <div>
            <dt>{copy.kpi.countries}</dt>
            <dd>{fmt(countries)}</dd>
          </div>
        )}
      </dl>

      <p className="dbx-hint">{copy.charts.hint}</p>
      <div className="dbx-grid">
        <BarList
          title={copy.charts.byCert}
          note={copy.charts.byCertNote}
          rows={byCert}
          fmt={fmt}
          selected={cert}
          onSelect={toggle(setCert, cert, '')}
        />
        <Columns
          title={copy.charts.dist}
          axis={copy.charts.distAxis}
          rows={dist}
          fmt={fmt}
          selected={exact ? String(exact) : ''}
          onSelect={(k) => toggle(setExact, exact, 0)(Number(k))}
        />
        <BarList
          title={copy.charts.companies}
          note={fill(copy.charts.scrollNote, { n: fmt(topCompanies.length) })}
          rows={topCompanies}
          fmt={fmt}
          scroll
          selected={company}
          onSelect={toggle(setCompany, company, '')}
        />
        <BarList
          title={copy.charts.companyCerts}
          note={fill(copy.charts.scrollNote, { n: fmt(topCompanyCerts.length) })}
          rows={topCompanyCerts}
          fmt={fmt}
          scroll
          selected={company}
          onSelect={toggle(setCompany, company, '')}
        />
        <BarList title={copy.charts.family} rows={byFamily} fmt={fmt} selected={family} onSelect={toggle(setFamily, family, '')} />
        {intl && (
          <>
            <BarList
              title={copy.charts.countries}
              note={fill(copy.charts.scrollNote, { n: fmt(topCountries.length) })}
              rows={topCountries}
              fmt={fmt}
              scroll
              selected={country}
              onSelect={toggle(setCountry, country, '')}
            />
            <BarList
              title={copy.charts.continents}
              note={copy.charts.continentsNote}
              rows={byContinent}
              fmt={fmt}
              selected={continent}
              onSelect={(k) => pickContinent(continent === k ? '' : k)}
            />
          </>
        )}
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
                  <th scope="col" title={countryRank ? copy.table.countryRank : undefined}>
                    #
                  </th>
                  <th scope="col">{copy.table.name}</th>
                  <th scope="col">{copy.table.role}</th>
                  <th scope="col">{copy.table.company}</th>
                  {intl && <th scope="col">{copy.table.country}</th>}
                  <th scope="col" className="num">
                    {copy.table.certs}
                  </th>
                  <th scope="col">{copy.table.credentials}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.u} className={p.me ? 'is-me' : undefined}>
                    <td className="rank">{countryRank ? p.cr : p.r}</td>
                    <td>
                      <a href={`${DIRECTORY}${p.u}`} target="_blank" rel="noopener noreferrer" title={copy.table.profile}>
                        {p.n}
                      </a>
                      {p.me && <span className="dbx-me">{copy.table.me}</span>}
                    </td>
                    <td className="muted">{p.t || '–'}</td>
                    <td className="muted">{p.w || '–'}</td>
                    {intl && <td className="muted">{p.g ? countryName(p.g) : '–'}</td>}
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
          {[...copy.method.source[scope], ...copy.method.items].map((item) => (
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
