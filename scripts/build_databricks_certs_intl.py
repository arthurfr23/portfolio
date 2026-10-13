# Uso: python3 scripts/build_databricks_certs_intl.py <arquivo.xlsx> [snapshot YYYY-MM-DD]
# Requer openpyxl. Gera src/data/databricks-certs-intl.json a partir do export
# internacional do Databricks Certified Directory (com colunas country/location).
import json
import sys
from datetime import date
from pathlib import Path

import openpyxl

from company_names import build_normalizer

from build_databricks_certs import (
    CERTS,
    FAMILY_RULES,
    ME_PROFILE_ID,
    SENIORITY_RULES,
    classify,
    norm,
)

OUT = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'databricks-certs-intl.json'

AF, AS, EU, NA, SA, OC = 'africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania'

# nome do país no export -> (ISO 3166-1 alpha-2, continente)
COUNTRIES = {
    'Albania': ('AL', EU), 'Algeria': ('DZ', AF), 'Angola': ('AO', AF), 'Argentina': ('AR', SA),
    'Armenia': ('AM', AS), 'Australia': ('AU', OC), 'Austria': ('AT', EU), 'Azerbaijan': ('AZ', AS),
    'Bangladesh': ('BD', AS), 'Belgium': ('BE', EU), 'Bermuda': ('BM', NA), 'Bolivia': ('BO', SA),
    'Bosnia And Herzegovina': ('BA', EU), 'Brazil': ('BR', SA), 'Brunei': ('BN', AS), 'Bulgaria': ('BG', EU),
    'Canada': ('CA', NA), 'Chile': ('CL', SA), 'China': ('CN', AS), 'Colombia': ('CO', SA),
    'Costa Rica': ('CR', NA), "Côte D'ivoire": ('CI', AF), 'Croatia': ('HR', EU), 'Cyprus': ('CY', EU),
    'Czechia': ('CZ', EU), 'Democratic Republic of the Congo': ('CD', AF), 'Denmark': ('DK', EU),
    'Dominican Republic': ('DO', NA), 'Ecuador': ('EC', SA), 'Egypt': ('EG', AF), 'El Salvador': ('SV', NA),
    'Estonia': ('EE', EU), 'Ethiopia': ('ET', AF), 'Finland': ('FI', EU), 'France': ('FR', EU),
    'Georgia': ('GE', AS), 'Germany': ('DE', EU), 'Ghana': ('GH', AF), 'Greece': ('GR', EU),
    'Guatemala': ('GT', NA), 'Guinea': ('GN', AF), 'Honduras': ('HN', NA), 'Hong Kong': ('HK', AS),
    'Hungary': ('HU', EU), 'India': ('IN', AS), 'Indonesia': ('ID', AS), 'Iraq': ('IQ', AS),
    'Ireland': ('IE', EU), 'Israel': ('IL', AS), 'Italy': ('IT', EU), 'Jamaica': ('JM', NA),
    'Japan': ('JP', AS), 'Jordan': ('JO', AS), 'Kazakhstan': ('KZ', AS), 'Kenya': ('KE', AF),
    'Kosovo': ('XK', EU), 'Latvia': ('LV', EU), 'Lebanon': ('LB', AS), 'Lithuania': ('LT', EU),
    'Luxembourg': ('LU', EU), 'Malaysia': ('MY', AS), 'Malta': ('MT', EU), 'Mauritius': ('MU', AF),
    'Mexico': ('MX', NA), 'Moldova': ('MD', EU), 'Montenegro': ('ME', EU), 'Morocco': ('MA', AF),
    'Mozambique': ('MZ', AF), 'Myanmar': ('MM', AS), 'Namibia': ('NA', AF), 'Nepal': ('NP', AS),
    'Netherlands': ('NL', EU), 'New Zealand': ('NZ', OC), 'Nicaragua': ('NI', NA), 'Niger': ('NE', AF),
    'Nigeria': ('NG', AF), 'North Macedonia': ('MK', EU), 'Norway': ('NO', EU), 'Oman': ('OM', AS),
    'Pakistan': ('PK', AS), 'Panama': ('PA', NA), 'Paraguay': ('PY', SA), 'Peru': ('PE', SA),
    'Philippines': ('PH', AS), 'Poland': ('PL', EU), 'Portugal': ('PT', EU), 'Puerto Rico': ('PR', NA),
    'Qatar': ('QA', AS), 'Romania': ('RO', EU), 'Rwanda': ('RW', AF), 'Saudi Arabia': ('SA', AS),
    'Senegal': ('SN', AF), 'Serbia': ('RS', EU), 'Singapore': ('SG', AS), 'Slovakia': ('SK', EU),
    'Slovenia': ('SI', EU), 'South Africa': ('ZA', AF), 'South Korea': ('KR', AS), 'Spain': ('ES', EU),
    'Sri Lanka': ('LK', AS), 'Sweden': ('SE', EU), 'Switzerland': ('CH', EU), 'Taiwan': ('TW', AS),
    'Thailand': ('TH', AS), 'Trinidad And Tobago': ('TT', NA), 'Tunisia': ('TN', AF), 'Türkiye': ('TR', AS),
    'Uganda': ('UG', AF), 'Ukraine': ('UA', EU), 'United Arab Emirates': ('AE', AS),
    'United Kingdom': ('GB', EU), 'United States': ('US', NA), 'Uruguay': ('UY', SA),
    'Uzbekistan': ('UZ', AS), 'Venezuela': ('VE', SA), 'Vietnam': ('VN', AS), 'Zimbabwe': ('ZW', AF),
}

# perfis sem país, mas com cidade inequívoca no campo location
LOCATION_COUNTRY = {
    'pristina': 'Kosovo', 'prishtina': 'Kosovo', 'gjilan': 'Kosovo', 'mitrovica': 'Kosovo',
    'anantnag': 'India', 'srinagar': 'India', 'madrid': 'Spain', 'brunei': 'Brunei',
}


def resolve_country(country: str, location: str) -> str:
    if country:
        return country
    loc = norm(location)
    for key, name in LOCATION_COUNTRY.items():
        if key in loc:
            return name
    return ''


def competition_rank(people, field):
    rank = 0
    for i, p in enumerate(people):
        if i == 0 or p['c'] != people[i - 1]['c']:
            rank = i + 1
        p[field] = rank


def main() -> None:
    src = Path(sys.argv[1])
    snapshot = sys.argv[2] if len(sys.argv) > 2 else date.today().isoformat()
    ws = openpyxl.load_workbook(src, data_only=True).worksheets[0]

    people = []
    unknown_certs, unknown_countries = set(), set()
    for row in ws.iter_rows(min_row=2):
        name, count, certs_raw, _, title, workplace, country, location = (c.value for c in row[:8])
        link = row[3].hyperlink.target if row[3].hyperlink else None
        if not name or not count or not link:
            continue
        certs = set()
        for line in (certs_raw or '').split('\n'):
            line = line.strip()
            if not line:
                continue
            if line in CERTS:
                certs.add(CERTS[line])
            else:
                unknown_certs.add(line)
        title = (title or '').strip()
        workplace = (workplace or '').strip()
        family = classify(title, FAMILY_RULES, 'other')
        seniority = 'management' if family == 'management' else classify(title, SENIORITY_RULES, 'unspecified')
        country = resolve_country((country or '').strip(), location or '')
        if country and country not in COUNTRIES:
            unknown_countries.add(country)
        person = {
            'n': name.strip(),
            'c': int(count),
            'k': sorted(certs),
            't': title,
            'w': workplace,
            'f': family,
            's': seniority,
            'u': link.rsplit('/', 1)[-1],
            'g': COUNTRIES[country][0] if country in COUNTRIES else '',
        }
        if person['u'] == ME_PROFILE_ID:
            person['me'] = True
        people.append(person)

    companies = build_normalizer([p['w'] for p in people])
    for p in people:
        p['w'] = companies.get(p['w'], p['w'])

    people.sort(key=lambda p: (-p['c'], norm(p['n'])))
    competition_rank(people, 'r')
    by_country = {}
    for p in people:
        by_country.setdefault(p['g'], []).append(p)
    for code, group in by_country.items():
        if code:
            competition_rank(group, 'cr')

    if unknown_certs:
        print('WARN certificações não mapeadas:', sorted(unknown_certs))
    if unknown_countries:
        print('WARN países sem ISO/continente:', sorted(unknown_countries))

    continents = {iso: cont for iso, cont in sorted(COUNTRIES.values()) if iso in by_country}
    OUT.write_text(json.dumps({'snapshot': snapshot, 'continents': continents, 'people': people}, ensure_ascii=False, separators=(',', ':')))
    print(f'{len(people)} profissionais, {len(continents)} países -> {OUT}')


if __name__ == '__main__':
    main()
