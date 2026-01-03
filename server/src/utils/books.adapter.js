import axios from 'axios';

const OPEN_LIBRARY_URL = 'https://openlibrary.org';
const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

const getGoogleBooksKey = () =>
process.env.GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_KEY || null;

const olClient = axios.create({ baseURL: OPEN_LIBRARY_URL });

const OL_LANG_BY_UI = {
    PT: 'por',
    EN: 'eng',
    ES: 'spa',
};

const GB_LANG_BY_UI = {
    PT: 'pt',
    EN: 'en',
    ES: 'es',
};

const BOOKS_ADAPTER_CONFIG = {
    MIN_EDITIONS_PER_LANG: 10,
    MAX_TOTAL_EDITIONS: 800,
    PAGE_SIZE: 200,
    STAGNANT_PAGES_LIMIT: 3,
};

const normalizeText = (s) =>
String(s || '')
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.replace(/[^a-z0-9\s]/g, ' ')
.replace(/\s+/g, ' ')
.trim();

const uniqStrings = (arr) => {
    const out = [];
    const seen = new Set();
    for (const v of arr || []) {
        if (typeof v !== 'string') continue;
        const t = v.trim();
        if (!t) continue;
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(t);
    }
    return out;
};

const extractYear = (input) => {
    if (!input) return null;
    const m = String(input).match(/\d{4}/);
    if (!m) return null;
    const y = parseInt(m[0], 10);
    return Number.isFinite(y) ? y : null;
};

const olDescriptionToString = (desc) => {
    if (!desc) return null;
    if (typeof desc === 'string') return desc.trim() || null;
    if (typeof desc === 'object' && typeof desc.value === 'string') return desc.value.trim() || null;
    return null;
};

const getEditionLangKey = (edition) => {
    const langs = edition?.languages;
    if (!Array.isArray(langs) || langs.length === 0) return null;
    const key = langs[0]?.key || null;
    if (!key) return null;
    const parts = String(key).split('/');
    return parts[parts.length - 1] || null;
};

const extractIsbns = (edition) => {
    const out = [];
    const add = (v) => {
        if (!v) return;
        if (Array.isArray(v)) v.forEach(add);
        else out.push(String(v));
    };
        add(edition?.isbn_13);
        add(edition?.isbn_10);

        return uniqStrings(out)
        .map((x) => x.replace(/[^0-9Xx]/g, '').toUpperCase())
        .filter((x) => x.length === 10 || x.length === 13);
};

const splitCategoryTokens = (categories) => {
    const out = [];
    for (const c of categories || []) {
        if (typeof c !== 'string') continue;
        const trimmed = c.trim();
        if (!trimmed) continue;

        const parts = trimmed.split('/').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) out.push(...parts);
        else out.push(trimmed);
    }
    return out;
};

const filterNoisyBookTokens = (tokens) => {
    const out = [];
    for (const t of tokens || []) {
        const n = normalizeText(t);
        if (!n) continue;

        if (n.includes('education') || n.includes('educacion') || n.includes('educacao')) continue;
        if (n.includes('study aid') || n.includes('study aids')) continue;
        if (n.includes('textbook') || n.includes('textbooks')) continue;
        if (n.includes('reference')) continue;
        if (n.includes('curriculum')) continue;
        if (n.includes('teaching')) continue;

        out.push(t);
    }
    return out;
};

const containsTieInTokens = (text) => {
    const t = normalizeText(text);
    if (!t) return false;

    const tokens = [
        'movie tie in',
        'film tie in',
        'motion picture',
        'official movie',
        'now a major motion picture',
        'part two',
        'part 2',
        'part one',
        'part 1',
        'graphic novel',
        'screenplay',
        'companion',
        'guide',
        'making of',
        'behind the scenes',
        'coloring book',
        'colouring book',
        'illustrated edition',
        'art and soul',
    ];

    return tokens.some((k) => t.includes(k));
};

const looksLikeFilmMarketing = (text) => {
    const t = normalizeText(text);
    if (!t) return false;

    const markers = [
        'denis villeneuve',
        'chalamet',
        'zendaya',
        'warner',
        'legendary',
        'in theaters',
        'in cinemas',
        'major motion picture',
        'motion picture',
        'directed by',
        'director',
        'part two',
        'part 2',
        'part one',
        'part 1',
    ];

    let count = 0;
    for (const m of markers) if (t.includes(m)) count += 1;

    return count >= 2;
};

const isPlausibleSynopsis = (text) => {
    if (!text) return false;
    const s = String(text).trim();
    if (!s) return false;

    if (s.length < 30) return false;
    if (looksLikeFilmMarketing(s)) return false;

    return true;
};

const getEditionPublishYear = (edition) => extractYear(edition?.publish_date);

const scoreEdition = (edition, targetLangKey, originalYear) => {
    let score = 0;

    const edLang = getEditionLangKey(edition);
    if (edLang && targetLangKey && edLang === targetLangKey) score += 60;

    const isbns = extractIsbns(edition);
    if (isbns.length > 0) score += 25;

    if (Array.isArray(edition?.covers) && edition.covers.length > 0) score += 10;

    const desc = olDescriptionToString(edition?.description);
    if (desc && isPlausibleSynopsis(desc)) score += 6;

    const pubYear = getEditionPublishYear(edition);
    if (originalYear && pubYear) {
        const dist = Math.abs(pubYear - originalYear);
        if (dist <= 2) score += 12;
        else if (dist <= 5) score += 8;
        else if (dist <= 15) score += 2;
        else if (dist >= 40) score -= 12;
    }

    const title = String(edition?.title || '');
    if (title) score += 5;
    if (containsTieInTokens(title)) score -= 35;

    return score;
};

const pickBestEdition = (editions, targetLangKey, originalYear) => {
    if (!Array.isArray(editions) || editions.length === 0) return null;

    const subset = targetLangKey ? editions.filter((e) => getEditionLangKey(e) === targetLangKey) : [];
    const pool = subset.length > 0 ? subset : editions;

    let best = null;
    let bestScore = -Infinity;

    for (const ed of pool) {
        const s = scoreEdition(ed, targetLangKey, originalYear);
        if (s > bestScore) {
            bestScore = s;
            best = ed;
        }
    }

    return best;
};

const inferCountryIso2 = (edition) => {
    const code = String(edition?.publish_country || '').toLowerCase().trim();
    if (code) {
        if (code.endsWith('u')) return 'US';
        if (code.endsWith('k')) return 'GB';
        if (code.endsWith('s')) return 'ES';
        if (code.endsWith('p')) return 'PT';
        if (code.endsWith('b')) return 'BR';
        if (code.endsWith('f')) return 'FR';
        if (code.endsWith('g')) return 'DE';
    }

    const places = Array.isArray(edition?.publish_places) ? edition.publish_places : [];
    const p = normalizeText(places.join(' '));
    if (!p) return null;

    if (p.includes('new york') || p.includes('boston') || p.includes('chicago')) return 'US';
    if (p.includes('london') || p.includes('oxford') || p.includes('cambridge')) return 'GB';
    if (p.includes('madrid') || p.includes('barcelona')) return 'ES';
    if (p.includes('lisbon') || p.includes('lisboa') || p.includes('porto')) return 'PT';
    if (p.includes('sao paulo') || p.includes('rio de janeiro') || p.includes('brasilia')) return 'BR';

    return null;
};

const pickCountryIso2 = (editions, originalYear) => {
    if (!Array.isArray(editions) || editions.length === 0) return null;

    const pool = editions.filter(
        (e) => e?.publish_country || (Array.isArray(e?.publish_places) && e.publish_places.length > 0)
    );

    if (pool.length === 0) return null;

    let best = null;
    let bestScore = -Infinity;

    for (const ed of pool) {
        let score = 0;
        const y = getEditionPublishYear(ed);
        if (originalYear && y) {
            const dist = Math.abs(y - originalYear);
            if (dist <= 2) score += 25;
            else if (dist <= 5) score += 15;
            else if (dist <= 15) score += 5;
            else if (dist >= 40) score -= 10;
        }

        if (ed?.publish_country) score += 15;
        if (Array.isArray(ed?.publish_places) && ed.publish_places.length > 0) score += 8;

        if (score > bestScore) {
            bestScore = score;
            best = ed;
        }
    }

    if (!best) return null;
    return inferCountryIso2(best);
};

const googleRequest = async (params) => {
    const key = getGoogleBooksKey();
    const finalParams = key ? { ...params, key } : params;
    const res = await axios.get(GOOGLE_BOOKS_URL, { params: finalParams });
    return res.data || {};
};

const getGoogleVolumeInfo = (item) => item?.volumeInfo || {};

const googleLanguageMatches = (item, expectedLang2) => {
    const lang = String(getGoogleVolumeInfo(item)?.language || '').toLowerCase().trim();
    if (!lang) return false;
    return lang === expectedLang2 || lang.startsWith(`${expectedLang2}-`);
};

const authorMatchesStrict = (authors, targetAuthor) => {
    if (!targetAuthor) return true;
    const target = normalizeText(targetAuthor);
    if (!target) return true;

    const first = normalizeText(Array.isArray(authors) ? authors[0] : '');
    if (!first) return false;

    return first.includes(target) || target.includes(first);
};

const scoreGoogleItem = (item, ctx) => {
    const info = getGoogleVolumeInfo(item);
    const title = String(info?.title || '').trim();
    if (!title) return -Infinity;

    const expectedLang2 = String(ctx?.expectedLang2 || '').toLowerCase();
    if (expectedLang2 && !googleLanguageMatches(item, expectedLang2)) return -Infinity;

    const authors = Array.isArray(info?.authors) ? info.authors : [];
    if (!authorMatchesStrict(authors, ctx?.targetAuthor)) return -1000;

    let score = 0;

    const titleNorm = normalizeText(title);
    const targetTitleNorm = normalizeText(ctx?.targetTitle || '');

    if (targetTitleNorm) {
        if (titleNorm === targetTitleNorm) score += 60;
        else if (titleNorm.includes(targetTitleNorm) || targetTitleNorm.includes(titleNorm)) score += 25;
        else score += 5;
    }

    if (authors.length > 0) score += 10;

    const year = extractYear(info?.publishedDate);
    if (ctx?.originalYear && year) {
        const dist = Math.abs(year - ctx.originalYear);
        if (dist <= 2) score += 12;
        else if (dist <= 5) score += 8;
        else if (dist <= 15) score += 2;
        else if (dist >= 40) score -= 20;
    }

    if (containsTieInTokens(title)) score -= 60;
    if (containsTieInTokens(info?.subtitle || '')) score -= 30;

    const desc = info?.description;
    if (typeof desc === 'string') {
        const d = desc.trim();
        if (looksLikeFilmMarketing(d)) score -= 60;
        if (isPlausibleSynopsis(d)) score += 18;
        else score -= 10;
        if (d.length > 200) score += 8;
    } else {
        score -= 12;
    }

    const bad = [
        'art and soul',
        'making of',
        'behind the scenes',
        'graphic novel',
        'screenplay',
        'companion',
        'guide',
        'coloring book',
        'colouring book',
    ];
    if (bad.some((k) => titleNorm.includes(k))) score -= 60;

    return score;
};

const googlePickBest = (items, ctx) => {
    if (!Array.isArray(items) || items.length === 0) return null;

    let best = null;
    let bestScore = -Infinity;

    for (const it of items) {
        const s = scoreGoogleItem(it, ctx);
        if (s > bestScore) {
            bestScore = s;
            best = it;
        }
    }

    if (bestScore < -200) return null;
    return best;
};

const googleGetBestByIsbns = async (isbns, ctx) => {
    const expectedLang2 = String(ctx?.expectedLang2 || '').toLowerCase();

    for (const isbn of (isbns || []).slice(0, 3)) {
        try {
            const data = await googleRequest({
                q: `isbn:${isbn}`,
                langRestrict: expectedLang2 || undefined,
                maxResults: 15,
                printType: 'books',
            });

            const items = Array.isArray(data.items) ? data.items : [];
            const best = googlePickBest(items, ctx);
            if (best) return best;
        } catch (e) {}
    }

    return null;
};

const googleSearchBestByTitleAuthor = async (titleCandidates, author, ctx) => {
    const expectedLang2 = String(ctx?.expectedLang2 || '').toLowerCase();
    const titles = Array.isArray(titleCandidates) ? titleCandidates : [titleCandidates];

    for (const t of titles) {
        const cleanTitle = String(t || '').trim();
        if (!cleanTitle) continue;

        const cleanAuthor = String(author || '').trim();
        const q = cleanAuthor
        ? `intitle:"${cleanTitle}" inauthor:"${cleanAuthor}"`
        : `intitle:"${cleanTitle}"`;

        try {
            const data = await googleRequest({
                q,
                langRestrict: expectedLang2 || undefined,
                maxResults: 20,
                printType: 'books',
                orderBy: 'relevance',
            });

            const items = Array.isArray(data.items) ? data.items : [];
            const best = googlePickBest(items, ctx);
            if (best) return best;
        } catch (e) {}
    }

    return null;
};

const upgradeGoogleCoverUrl = (url) => {
    if (!url) return null;
    let u = String(url).replace('http:', 'https:');
    u = u.replace(/zoom=1\b/g, 'zoom=2');
    return u;
};

const pickBestGoogleCoverUrl = (googleItems) => {
    for (const item of googleItems || []) {
        if (!item) continue;
        const info = getGoogleVolumeInfo(item);
        const links = info?.imageLinks || {};
        const candidates = [
            links.extraLarge,
            links.large,
            links.medium,
            links.small,
            links.thumbnail,
            links.smallThumbnail,
        ].filter(Boolean);

        if (candidates.length > 0) return upgradeGoogleCoverUrl(candidates[0]);
    }
    return null;
};

const buildOlCoverByIdUrl = (coverId, size = 'L', strict = true) => {
    if (!coverId) return null;
    const suffix = strict ? '?default=false' : '';
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg${suffix}`;
};

const buildOlCoverByIsbnUrl = (isbn, size = 'L', strict = true) => {
    if (!isbn) return null;
    const clean = String(isbn).trim();
    if (!clean) return null;
    const suffix = strict ? '?default=false' : '';
    return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg${suffix}`;
};

const getEditionOlid = (edition) => {
    const key = String(edition?.key || '').trim();
    if (!key) return null;
    const parts = key.split('/');
    const last = parts[parts.length - 1] || null;
    if (!last) return null;
    if (!/^OL/i.test(last)) return null;
    return last;
};

const buildOlCoverByOlidUrl = (olid, size = 'L', strict = true) => {
    if (!olid) return null;
    const clean = String(olid).trim();
    if (!clean) return null;
    const suffix = strict ? '?default=false' : '';
    return `https://covers.openlibrary.org/b/olid/${clean}-${size}.jpg${suffix}`;
};

const isImageUrlReachable = async (url) => {
    if (!url) return false;
    try {
        const res = await axios.get(url, {
            responseType: 'stream',
            timeout: 2500,
            validateStatus: (s) => s >= 200 && s < 400,
                                    headers: {
                                        'User-Agent': 'Mazarbul/1.0 (+https://localhost)',
                                    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                                    },
        });

        const ct = String(res.headers?.['content-type'] || '').toLowerCase();
        if (res.data && typeof res.data.destroy === 'function') res.data.destroy();

        return ct.startsWith('image/');
    } catch (e) {
        return false;
    }
};

const pickFirstReachableImage = async (candidates, maxChecks = 30) => {
    const list = uniqStrings((candidates || []).filter(Boolean)).slice(0, maxChecks);
    for (const url of list) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await isImageUrlReachable(url);
        if (ok) return url;
    }
    return null;
};

const orderGenresForBooks = (tokens) => {
    const norm = tokens.map((t) => normalizeText(t)).join(' ');
    const ordered = [];

    const pushIf = (label, cond) => {
        if (cond) ordered.push(label);
    };

        pushIf(
            'Science Fiction',
            norm.includes('science fiction') ||
            norm.includes('sci fi') ||
            norm.includes('ficcao cientifica') ||
            norm.includes('ficcion cientifica') ||
            norm.includes('ciencia ficcion')
        );
        pushIf('Fantasy', norm.includes('fantasy') || norm.includes('fantasia'));
        pushIf('Horror', norm.includes('horror') || norm.includes('terror'));
        pushIf('Mystery', norm.includes('mystery') || norm.includes('crime') || norm.includes('detective'));
        pushIf('Romance', norm.includes('romance'));
        pushIf('History', norm.includes('history') || norm.includes('histor'));
        pushIf('Biography', norm.includes('biography') || norm.includes('biografia'));
        pushIf(
            'Nonfiction',
            norm.includes('nonfiction') ||
            norm.includes('non fiction') ||
            norm.includes('nao ficcao') ||
            norm.includes('no ficcion')
        );

        const rest = tokens.filter((t) => {
            const n = normalizeText(t);
            if (!n) return false;
            if (n.includes('science fiction') || n.includes('sci fi')) return false;
            if (n.includes('fantasy') || n.includes('fantasia')) return false;
            if (n.includes('horror') || n.includes('terror')) return false;
            if (n.includes('mystery') || n.includes('crime') || n.includes('detective')) return false;
            if (n.includes('romance')) return false;
            if (n.includes('history') || n.includes('histor')) return false;
            if (n.includes('biography') || n.includes('biografia')) return false;
            if (
                n.includes('nonfiction') ||
                n.includes('non fiction') ||
                n.includes('nao ficcao') ||
                n.includes('no ficcion')
            )
                return false;
                return true;
        });

        return uniqStrings([...ordered, ...rest]);
};

const fetchEditionsPaged = async (workId, opts = {}) => {
    const cfg = BOOKS_ADAPTER_CONFIG;

    const limit = Number.isFinite(opts.limit) ? opts.limit : cfg.PAGE_SIZE;
    const maxTotal = Number.isFinite(opts.maxTotal) ? opts.maxTotal : cfg.MAX_TOTAL_EDITIONS;
    const minPerLang = Number.isFinite(opts.minPerLang) ? opts.minPerLang : cfg.MIN_EDITIONS_PER_LANG;
    const stagnantPagesLimit = Number.isFinite(opts.stagnantPagesLimit)
    ? opts.stagnantPagesLimit
    : cfg.STAGNANT_PAGES_LIMIT;

    const capPagesByTotal = Math.ceil(maxTotal / limit);
    const maxPages = Number.isFinite(opts.maxPages) ? Math.min(opts.maxPages, capPagesByTotal) : capPagesByTotal;

    const all = [];
    let offset = 0;

    const counts = { eng: 0, por: 0, spa: 0 };
    let stagnantPages = 0;

    const meetsMin = () => counts.eng >= minPerLang && counts.por >= minPerLang && counts.spa >= minPerLang;

    for (let page = 0; page < maxPages; page += 1) {
        if (all.length >= maxTotal) break;
        if (meetsMin()) break;

        const res = await olClient.get(`/works/${workId}/editions.json`, {
            params: { limit, offset },
        });

        const entries = Array.isArray(res.data?.entries) ? res.data.entries : [];
        if (entries.length === 0) break;

        all.push(...entries);

        let pageLangSignals = 0;
        for (const ed of entries) {
            const lk = getEditionLangKey(ed);
            if (lk === 'eng') counts.eng += 1;
            if (lk === 'por') counts.por += 1;
            if (lk === 'spa') counts.spa += 1;
            if (lk) pageLangSignals += 1;
        }

        if (pageLangSignals === 0) stagnantPages += 1;
        else stagnantPages = 0;

        if (stagnantPages >= stagnantPagesLimit) break;

        if (entries.length < limit) break;
        offset += limit;
    }

    return all.slice(0, maxTotal);
};

export const searchBooks = async (query) => {
    const results = [];
    try {
        const response = await olClient.get('/search.json', {
            params: {
                q: query,
                limit: 20,
                fields: 'key,title,author_name,first_publish_year,cover_i',
            },
        });

        const docs = Array.isArray(response.data?.docs) ? response.data.docs : [];
        for (const book of docs) {
            const key = String(book.key || '').replace('/works/', '');
            if (!key) continue;

            results.push({
                id: `ol_${key}`,
                title: book.title || 'Sem Título',
                author: Array.isArray(book.author_name) ? book.author_name[0] : 'Autor Desconhecido',
                         year: book.first_publish_year || '?',
                         poster: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                         type: 'livro',
            });
        }

        return results;
    } catch (e) {
        console.error('[BooksAdapter] Erro na OpenLibrary Search:', e.message);
        return results;
    }
};

export const getBookData = async (externalId) => {
    if (!externalId) throw new Error('ID de livro inválido.');

    if (externalId.startsWith('google_') || externalId.startsWith('g_')) {
        const realId = externalId.replace(/^google_|^g_/, '');
        return await fetchGoogleBookDetails(realId);
    }

    const workId = externalId.replace(/^ol_/, '');
    return await fetchOpenLibraryWork(workId);
};

const fetchOpenLibraryWork = async (workId) => {
    try {
        const workRes = await olClient.get(`/works/${workId}.json`);
        const workData = workRes.data || {};

        let authorName = 'Autor Desconhecido';
        try {
            const authorEntry = Array.isArray(workData.authors) ? workData.authors[0] : null;
            const authorKey = authorEntry?.author?.key || authorEntry?.key || null;
            if (authorKey) {
                const authorRes = await olClient.get(`${authorKey}.json`);
                if (authorRes.data?.name) authorName = authorRes.data.name;
            }
        } catch (e) {}

        const editions = await fetchEditionsPaged(workId);

        const workYear = extractYear(workData.first_publish_date);
        let originalYear = workYear;

        if (!originalYear && editions.length > 0) {
            const years = editions.map(getEditionPublishYear).filter((y) => Number.isFinite(y));
            if (years.length > 0) originalYear = Math.min(...years);
        }

        const bestEditionPT = pickBestEdition(editions, OL_LANG_BY_UI.PT, originalYear);
        const bestEditionEN = pickBestEdition(editions, OL_LANG_BY_UI.EN, originalYear);
        const bestEditionES = pickBestEdition(editions, OL_LANG_BY_UI.ES, originalYear);

        const titles = {
            PT: bestEditionPT?.title || workData.title || null,
            EN: bestEditionEN?.title || workData.title || null,
            ES: bestEditionES?.title || workData.title || null,
        };
        titles.DEFAULT = titles.PT || titles.EN || titles.ES || workData.title || 'Título Indisponível';

        const ctxPT = {
            expectedLang2: GB_LANG_BY_UI.PT,
            targetTitle: titles.PT || workData.title,
            targetAuthor: authorName,
            originalYear,
        };
        const ctxEN = {
            expectedLang2: GB_LANG_BY_UI.EN,
            targetTitle: titles.EN || workData.title,
            targetAuthor: authorName,
            originalYear,
        };
        const ctxES = {
            expectedLang2: GB_LANG_BY_UI.ES,
            targetTitle: titles.ES || workData.title,
            targetAuthor: authorName,
            originalYear,
        };

        const googleItemPT =
        (await googleGetBestByIsbns(extractIsbns(bestEditionPT), ctxPT)) ||
        (await googleSearchBestByTitleAuthor([ctxPT.targetTitle, workData.title], authorName, ctxPT));

        const googleItemEN =
        (await googleGetBestByIsbns(extractIsbns(bestEditionEN), ctxEN)) ||
        (await googleSearchBestByTitleAuthor([ctxEN.targetTitle, workData.title], authorName, ctxEN));

        const googleItemES =
        (await googleGetBestByIsbns(extractIsbns(bestEditionES), ctxES)) ||
        (await googleSearchBestByTitleAuthor([ctxES.targetTitle, workData.title], authorName, ctxES));

        const synopsisPTCandidate =
        (getGoogleVolumeInfo(googleItemPT)?.description || null) ||
        (olDescriptionToString(bestEditionPT?.description) || null);

        const isLikelySpanish = (s) => {
            const raw = String(s || '');
            if (!raw.trim()) return false;

            const n = ` ${normalizeText(raw)} `;

            const esHits = [
                ' el ',
                ' la ',
                ' los ',
                ' las ',
                ' que ',
                ' y ',
                ' en ',
                ' de ',
                ' del ',
                ' al ',
                ' una ',
                ' un ',
                ' por ',
                ' para ',
                ' con ',
                ' se ',
                ' su ',
                ' sus ',
            ].filter((w) => n.includes(w)).length;

            const frHits = [
                ' le ',
                ' les ',
                ' des ',
                ' dans ',
                ' tout ',
                ' edition ',
                ' preface ',
                ' postface ',
                ' traduit ',
                ' traduction ',
                ' etats unis ',
            ].filter((w) => n.includes(w)).length;

            if (frHits >= 3 && frHits >= esHits) return false;
            return esHits >= 3;
        };

        const googleEsDesc = getGoogleVolumeInfo(googleItemES)?.description || null;
        const olEsDesc = olDescriptionToString(bestEditionES?.description) || null;

        const synopsisESCandidate =
        (isPlausibleSynopsis(googleEsDesc) && isLikelySpanish(googleEsDesc) ? String(googleEsDesc).trim() : null) ||
        (isPlausibleSynopsis(olEsDesc) && isLikelySpanish(olEsDesc) ? String(olEsDesc).trim() : null) ||
        null;

        const isLikelyEnglish = (s) => {
            const raw = String(s || '');
            if (!raw.trim()) return false;

            if (/[æøå]/i.test(raw)) return false;

            const n = ` ${normalizeText(raw)} `;
            const enHits = [' the ', ' and ', ' of ', ' to ', ' in ', ' that ', ' with ', ' from ', ' for '].filter((w) =>
            n.includes(w)
            ).length;

            const ptEsHits = [
                ' que ',
                ' para ',
                ' com ',
                ' uma ',
                ' nao ',
                ' não ',
                ' el ',
                ' la ',
                ' los ',
                ' las ',
                ' por ',
                ' una ',
            ].filter((w) => n.includes(w)).length;

            return enHits >= 3 && enHits > ptEsHits;
        };

        const olEnglishCandidatesStrict = (editions || [])
        .filter((ed) => getEditionLangKey(ed) === 'eng')
        .map((ed) => olDescriptionToString(ed?.description))
        .filter(Boolean)
        .map((s) => String(s).trim())
        .filter((s) => isPlausibleSynopsis(s));

        let bestOlEnglishSynopsis = olEnglishCandidatesStrict.sort((a, b) => b.length - a.length)[0] || null;

        if (!bestOlEnglishSynopsis) {
            const olEnglishCandidatesHeuristic = (editions || [])
            .map((ed) => olDescriptionToString(ed?.description))
            .filter(Boolean)
            .map((s) => String(s).trim())
            .filter((s) => isPlausibleSynopsis(s) && isLikelyEnglish(s));

            bestOlEnglishSynopsis = olEnglishCandidatesHeuristic.sort((a, b) => b.length - a.length)[0] || null;
        }

        const googleEnglishSynopsis = getGoogleVolumeInfo(googleItemEN)?.description || null;
        const synopsisENCandidate =
        bestOlEnglishSynopsis ||
        (isPlausibleSynopsis(googleEnglishSynopsis) ? String(googleEnglishSynopsis).trim() : null);

        const synopses = {
            PT: isPlausibleSynopsis(synopsisPTCandidate) ? String(synopsisPTCandidate).trim() : null,
            EN: synopsisENCandidate ? String(synopsisENCandidate).trim() : null,
            ES: isPlausibleSynopsis(synopsisESCandidate) ? String(synopsisESCandidate).trim() : null,
        };
        synopses.DEFAULT = synopses.PT || synopses.EN || synopses.ES || null;

        const countryIso2 = pickCountryIso2(editions, originalYear);

        const olSubjects = Array.isArray(workData.subjects) ? workData.subjects : [];

        const gbCatsPT = Array.isArray(getGoogleVolumeInfo(googleItemPT)?.categories)
        ? getGoogleVolumeInfo(googleItemPT).categories
        : [];
        const gbCatsEN = Array.isArray(getGoogleVolumeInfo(googleItemEN)?.categories)
        ? getGoogleVolumeInfo(googleItemEN).categories
        : [];
        const gbCatsES = Array.isArray(getGoogleVolumeInfo(googleItemES)?.categories)
        ? getGoogleVolumeInfo(googleItemES).categories
        : [];

        const tokensPT = filterNoisyBookTokens([...splitCategoryTokens(gbCatsPT), ...olSubjects]);
        const tokensEN = filterNoisyBookTokens([...splitCategoryTokens(gbCatsEN), ...olSubjects]);
        const tokensES = filterNoisyBookTokens([...splitCategoryTokens(gbCatsES), ...olSubjects]);

        const rawGenresPT = orderGenresForBooks(tokensPT);
        const rawGenresEN = orderGenresForBooks(tokensEN);
        const rawGenresES = orderGenresForBooks(tokensES);

        const genres = {
            PT: rawGenresPT.slice(0, 12),
            EN: rawGenresEN.slice(0, 12),
            ES: rawGenresES.slice(0, 12),
        };

        // CAPA: prioriza Open Library, só usa Google se não houver nenhuma alternativa.
        const candidatesOl = [];
        const candidatesGoogle = [];

        // 1) Open Library por OLID da edição escolhida (muito estável no browser)
        const olidPT = getEditionOlid(bestEditionPT);
        const olidEN = getEditionOlid(bestEditionEN);
        const olidES = getEditionOlid(bestEditionES);

        for (const olid of [olidPT, olidEN, olidES].filter(Boolean)) {
            candidatesOl.push(buildOlCoverByOlidUrl(olid, 'L', true));
            candidatesOl.push(buildOlCoverByOlidUrl(olid, 'M', true));
        }

        // 2) Open Library por cover ids do work
        if (Array.isArray(workData.covers)) {
            for (const cid of workData.covers) candidatesOl.push(buildOlCoverByIdUrl(cid, 'L', true));
            for (const cid of workData.covers) candidatesOl.push(buildOlCoverByIdUrl(cid, 'M', true));
        }

        // 3) Open Library por covers da edição (quando vierem)
        const editionCoverIds = [];
        const pushEditionCovers = (ed) => {
            if (!ed || !Array.isArray(ed.covers)) return;
            for (const c of ed.covers) {
                if (!editionCoverIds.includes(c)) editionCoverIds.push(c);
            }
        };
        pushEditionCovers(bestEditionPT);
        pushEditionCovers(bestEditionEN);
        pushEditionCovers(bestEditionES);

        for (const cid of editionCoverIds) candidatesOl.push(buildOlCoverByIdUrl(cid, 'L', true));
        for (const cid of editionCoverIds) candidatesOl.push(buildOlCoverByIdUrl(cid, 'M', true));

        // 4) Open Library por ISBN
        const isbns = uniqStrings([
            ...extractIsbns(bestEditionPT),
                                  ...extractIsbns(bestEditionEN),
                                  ...extractIsbns(bestEditionES),
        ]);
        for (const isbn of isbns) candidatesOl.push(buildOlCoverByIsbnUrl(isbn, 'L', true));
        for (const isbn of isbns) candidatesOl.push(buildOlCoverByIsbnUrl(isbn, 'M', true));

        // 5) Google Books (apenas se OL não fornecer nada)
        const googleCover = pickBestGoogleCoverUrl([googleItemPT, googleItemEN, googleItemES]);
        if (googleCover) candidatesGoogle.push(googleCover);

        let posterUrl = await pickFirstReachableImage(candidatesOl, 35);
        if (!posterUrl) {
            posterUrl = await pickFirstReachableImage(candidatesGoogle, 10);
        }

        // Fallback final que sempre gera uma imagem (mesmo se for placeholder do OL).
        if (!posterUrl) {
            if (isbns.length > 0) posterUrl = buildOlCoverByIsbnUrl(isbns[0], 'L', false);
            else if (Array.isArray(workData.covers) && workData.covers.length > 0)
                posterUrl = buildOlCoverByIdUrl(workData.covers[0], 'L', false);
            else if (olidPT || olidEN || olidES) posterUrl = buildOlCoverByOlidUrl(olidPT || olidEN || olidES, 'L', false);
            else posterUrl = 'https://via.placeholder.com/300x450?text=Cover+Not+Available';
        }

        return {
            id: `ol_${workId}`,
            type: 'livro',
            titles,
            synopses,
            posterUrl,
            backdropUrl: null,
            releaseYear: originalYear || null,
            runtime: null,
            director: authorName,
            genres,
            countries: countryIso2 ? [countryIso2] : null,
            details: null,
            tags: [],
            externalIds: {
                openLibraryWorkId: workId,
                googleBooksId: {
                    PT: googleItemPT?.id || null,
                    EN: googleItemEN?.id || null,
                    ES: googleItemES?.id || null,
                },
            },
        };
    } catch (error) {
        console.error(`[BooksAdapter] ERRO CRÍTICO no work ${workId}:`, error.message || error);
        return {
            id: `ol_${workId}`,
            type: 'livro',
            titles: { DEFAULT: 'Erro ao carregar detalhes', PT: null, EN: null, ES: null },
            synopses: {
                DEFAULT: 'Não foi possível carregar os dados completos deste livro.',
                PT: null,
                EN: null,
                ES: null,
            },
            posterUrl: null,
            backdropUrl: null,
            releaseYear: null,
            runtime: null,
            director: null,
            genres: null,
            countries: null,
            details: null,
            tags: [],
            externalIds: { openLibraryWorkId: workId },
        };
    }
};

const fetchGoogleBookDetails = async (googleId) => {
    try {
        const key = getGoogleBooksKey();
        const params = key ? { key } : undefined;

        const response = await axios.get(`${GOOGLE_BOOKS_URL}/${googleId}`, { params });
        const info = response.data?.volumeInfo || {};

        const year = extractYear(info.publishedDate);
        const desc = typeof info.description === 'string' ? info.description : null;
        const title = info.title || null;

        const categories = splitCategoryTokens(Array.isArray(info.categories) ? info.categories : []);

        const cover =
        info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.small ||
        info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail ||
        null;

        return {
            id: `google_${response.data?.id || googleId}`,
            type: 'livro',
            titles: { DEFAULT: title, PT: title, EN: title, ES: title },
            synopses: { DEFAULT: desc, PT: desc, EN: desc, ES: desc },
            posterUrl: cover ? upgradeGoogleCoverUrl(cover) : 'https://via.placeholder.com/300x450?text=Cover+Not+Available',
            backdropUrl: null,
            releaseYear: Number.isFinite(year) ? year : null,
            runtime: null,
            director: Array.isArray(info.authors) ? info.authors.join(', ') : 'Autor Desconhecido',
            genres: { PT: categories, EN: categories, ES: categories },
            countries: null,
            details: null,
            tags: [],
            externalIds: { googleBooksId: googleId },
        };
    } catch (error) {
        console.error('[BooksAdapter] Erro ao buscar detalhes no Google Books:', error.message || error);
        return {
            id: `google_${googleId}`,
            type: 'livro',
            titles: { DEFAULT: 'Erro ao carregar detalhes', PT: null, EN: null, ES: null },
            synopses: {
                DEFAULT: 'Não foi possível carregar os dados completos deste livro.',
                PT: null,
                EN: null,
                ES: null,
            },
            posterUrl: 'https://via.placeholder.com/300x450?text=Cover+Not+Available',
            backdropUrl: null,
            releaseYear: null,
            runtime: null,
            director: null,
            genres: null,
            countries: null,
            details: null,
            tags: [],
            externalIds: { googleBooksId: googleId },
        };
    }
};
