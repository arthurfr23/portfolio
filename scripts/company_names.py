# Normalização dos nomes de empresa digitados livremente no Databricks Certified Directory.
# 1) BRANDS: marcas conhecidas (subsidiárias, siglas, erros de digitação) -> nome canônico.
# 2) Chave genérica: sem acento/caixa/pontuação, sem sufixo societário (Ltd, Pvt, Inc, S.A., Ltda...),
#    sem parênteses e sem o que vem depois da vírgula; país no fim é removido se a marca "pura" existir.
# 3) Erro de digitação raro é unido a uma chave frequente quase idêntica.
# O nome exibido de cada grupo é a grafia mais comum dentro dele.
import re
import unicodedata
from collections import Counter
from difflib import SequenceMatcher

BRANDS = [
    (r'^(tata ?con\w*|tcs\b)|\(tcs\)', 'Tata Consultancy Services'),
    (r'^accenture\b', 'Accenture'),
    (r'\bdeloitte\b', 'Deloitte'),
    (r'^cognizant\b', 'Cognizant'),
    (r'^infosys\b(?! ?system)', 'Infosys'),
    (r'^wipro\b', 'Wipro'),
    (r'^capgemini\b', 'Capgemini'),
    (r'^ey\b|^ernst ?(and)? ?you|ernst and young', 'EY'),
    (r'^kpmg\b', 'KPMG'),
    (r'^pwc\b|^pricewaterhouse', 'PwC'),
    (r'^ibm\b', 'IBM'),
    (r'^hcl', 'HCLTech'),
    # LTIMindtree passou a se chamar LTM Limited em 17/03/2026
    (r'^ltim|^lti ?mindtree|^l ?and ?t mindtree|^larsen and toubro infotech|^ltm\b', 'LTM (LTIMindtree)'),
    (r'^databricks\b', 'Databricks'),
    (r'^microsoft\b', 'Microsoft'),
    (r'^amazon web services\b|^aws$', 'Amazon Web Services (AWS)'),
    (r'^ntt data\b', 'NTT DATA'),
    (r'^tech ?mahindra\b', 'Tech Mahindra'),
    (r'^epam\b', 'EPAM Systems'),
    (r'^tredence\b', 'Tredence'),
    (r'^exl\b', 'EXL'),
    (r'^sigmoid\b', 'Sigmoid'),
    (r'^brillio\b', 'Brillio'),
    (r'^nagarro\b', 'Nagarro'),
    (r'^impetus\b', 'Impetus Technologies'),
    (r'^qburst\b', 'QBurst'),
    (r'^dxc\b', 'DXC Technology'),
    (r'^xorbix\b', 'Xorbix Technologies'),
    (r'^eclerx\b', 'eClerx'),
    (r'^bitwise\b', 'Bitwise'),
    (r'^mercedes ?benz\b', 'Mercedes-Benz'),
    (r'^fpt\b', 'FPT Software'),
    (r'^ust( global)?$|^ust inc', 'UST'),
    (r'^neudesic\b', 'Neudesic'),
    (r'^bluetab\b', 'Bluetab (an IBM Company)'),
    (r'^r ?systems\b', 'R Systems'),
    (r'^agilisium\b', 'Agilisium'),
    (r'^citiustech\b', 'CitiusTech'),
    (r'^bridgenext\b', 'Bridgenext'),
    (r'^jade global\b', 'Jade Global'),
    (r'^teksystems\b', 'TEKsystems'),
    (r'^stefanini\b', 'Stefanini'),
    (r'^adesso\b', 'adesso'),
    (r'^procter|^proctor and gamble', 'Procter & Gamble'),
    (r'^gft\b', 'GFT Technologies'),
    (r'^mercado li[bv]re\b', 'Mercado Livre'),
    (r'^perficient\b', 'Perficient'),
    (r'^syngenta\b', 'Syngenta'),
    (r'^fractal( analytics)?\b', 'Fractal Analytics'),
    (r'^tiger an', 'Tiger Analytics'),
    (r'^celebal\b', 'Celebal Technologies'),
    (r'^mphasis\b', 'Mphasis'),
    (r'^genpact\b', 'Genpact'),
    (r'^avanade\b', 'Avanade'),
    (r'^thoughtworks\b', 'Thoughtworks'),
    (r'^indicium\b', 'Indicium AI'),
    (r'^j ?p ?morgan', 'JPMorgan Chase'),
    (r'^globant\b', 'Globant'),
    (r'^slalom\b', 'Slalom'),
    (r'^persistent( systems?)?$|^persistent systems?\b', 'Persistent Systems'),
    (r'^virtusa\b', 'Virtusa'),
    (r'^zs associate', 'ZS Associates'),
    (r'^lovelytics\b', 'Lovelytics'),
    (r'^blueshift\b', 'BlueShift'),
    (r'^bcp$', 'Banco de Crédito BCP'),
    (r'^itau( unibanco)?$', 'Itaú Unibanco'),
]

LEGAL = {
    'private', 'pvt', 'limited', 'ltd', 'ltda', 'inc', 'incorporated', 'llc', 'llp', 'plc', 'corp',
    'corporation', 'co', 'company', 'gmbh', 'ag', 'ab', 'as', 'oy', 'bv', 'nv', 'sa', 'sas', 'sarl',
    'srl', 'spa', 'sl', 'slu', 'pty', 'pte', 'kk', 'eireli', 'and', 'the', 'de', 'cv', 'rl', 'sp', 'z', 'o',
}

GEO = {
    'india', 'brasil', 'brazil', 'uk', 'usa', 'us', 'canada', 'australia', 'italia', 'italy', 'portugal',
    'peru', 'mexico', 'latam', 'europe', 'emea', 'apac', 'america', 'americas', 'netherlands', 'nederland',
    'germany', 'deutschland', 'spain', 'espana', 'iberia', 'france', 'poland', 'polska', 'sweden', 'finland',
    'norway', 'denmark', 'belgium', 'singapore', 'philippines', 'chile', 'argentina', 'colombia', 'japan',
    'ireland', 'switzerland', 'romania', 'vietnam', 'morocco', 'egypt', 'uae',
}


def fold(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    text = text.replace('&', ' and ').replace('.', '')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9()]+', ' ', text)).strip()


def base_key(name: str) -> str:
    if not fold(name).strip('() '):
        return name.strip().lower()
    key = fold(name.split(',')[0]) or fold(name)
    key = re.sub(r'\([^)]*\)', ' ', key).strip() or key.strip('() ')
    words = key.split()
    while len(words) > 1 and words[-1] in LEGAL:
        words.pop()
    return ' '.join(words)


def brand(name: str) -> str | None:
    folded = fold(name)
    for pattern, canonical in BRANDS:
        if re.search(pattern, folded):
            return canonical
    return None


def build_normalizer(names: list[str]):
    """Recebe todos os nomes (com repetição) e devolve um dict nome_original -> nome_normalizado."""
    counts = Counter(n for n in names if n and re.search(r'\w', n))
    key_of = {}
    for name in counts:
        b = brand(name)
        key_of[name] = f'#{b}' if b else base_key(name)

    key_counts = Counter()
    for name, c in counts.items():
        key_counts[key_of[name]] += c

    def strip_geo(key: str) -> str:
        words = key.split()
        while len(words) > 1 and words[-1] in GEO and ' '.join(words[:-1]) in key_counts:
            words.pop()
        return ' '.join(words)

    merged = {k: strip_geo(k) if not k.startswith('#') else k for k in key_counts}

    final_counts = Counter()
    for k, c in key_counts.items():
        final_counts[merged[k]] += c
    frequent = [k for k, c in final_counts.items() if c >= 5 and not k.startswith('#') and len(k) >= 8]
    for k, c in list(final_counts.items()):
        if c > 2 or k.startswith('#') or len(k) < 8:
            continue
        best = max(frequent, key=lambda f: SequenceMatcher(None, k, f).ratio(), default=None)
        if best and best[0] == k[0] and SequenceMatcher(None, k, best).ratio() >= 0.93:
            for orig, target in merged.items():
                if target == k:
                    merged[orig] = best

    spellings: dict[str, Counter] = {}
    for name, c in counts.items():
        spellings.setdefault(merged[key_of[name]], Counter())[name] += c

    out = {n: '' for n in set(names) if n and n not in counts}
    for group, names_c in spellings.items():
        # prefere a grafia "limpa" (sem sufixo societário/parênteses); empate -> mais curta
        clean = [n for n in names_c if fold(n) == base_key(n)] or list(names_c)
        display = group[1:] if group.startswith('#') else min(clean, key=lambda n: (-names_c[n], len(n)))
        for name in names_c:
            out[name] = display
    return out
