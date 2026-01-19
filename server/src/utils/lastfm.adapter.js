import axios from 'axios';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

const lastFmClient = axios.create({
    baseURL: LASTFM_API_URL,
    timeout: 15000,
});

const MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2/';
const MUSICBRAINZ_USER_AGENT =
process.env.MUSICBRAINZ_USER_AGENT ||
'Mazarbul/1.0.0 (https://github.com/0zzmandias/Mazarbul)';

const musicBrainzClient = axios.create({
    baseURL: MUSICBRAINZ_API_URL,
    timeout: 15000,
    headers: {
        'User-Agent': MUSICBRAINZ_USER_AGENT,
        'Accept': 'application/json',
    },
});

const MBID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const looksLikeMbid = (value) => MBID_REGEX.test(String(value || '').trim());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mbQueue = Promise.resolve();
let mbLastRequestAt = 0;
const MB_MIN_INTERVAL_MS = 1100;

const mbGet = (path, params) => {
    const task = async () => {
        const now = Date.now();
        const delta = now - mbLastRequestAt;
        if (delta < MB_MIN_INTERVAL_MS) {
            await sleep(MB_MIN_INTERVAL_MS - delta);
        }

        try {
            return await musicBrainzClient.get(path, { params });
        } finally {
            mbLastRequestAt = Date.now();
        }
    };

    const run = mbQueue.then(task, task);
    mbQueue = run.catch(() => undefined);
    return run;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const cacheGet = (map, key) => {
    const k = String(key || '').trim();
    if (!k) return null;
    const entry = map.get(k);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        map.delete(k);
        return null;
    }
    return entry.value;
};

const cacheSet = (map, key, value) => {
    const k = String(key || '').trim();
    if (!k) return;
    map.set(k, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const rgByAnyMbidCache = new Map();
const rgBasicsCache = new Map();
const rgReleasesCache = new Map();
const releaseTracklistCache = new Map();

const getApiKey = () => {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) throw new Error('LASTFM_API_KEY não configurada');
    return apiKey;
};

const extractYear = (input) => {
    if (!input) return null;
    const m = String(input).match(/\b(19\d{2}|20\d{2})\b/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    return Number.isFinite(y) ? y : null;
};

const stripHtml = (text) => {
    if (!text) return null;
    return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;
};

const cleanupSummary = (text) => {
    const s = stripHtml(text);
    if (!s) return null;
    return s.replace(/\bRead\s+more\b.*$/i, '').trim() || null;
};

const pickBestImage = (images) => {
    if (!Array.isArray(images)) return null;

    const bySize = (size) => images.find((i) => i && i.size === size && i['#text']);
    return (
        bySize('mega')?.['#text'] ||
        bySize('extralarge')?.['#text'] ||
        bySize('large')?.['#text'] ||
        bySize('medium')?.['#text'] ||
        images.find((i) => i && i['#text'])?.['#text'] ||
        null
    );
};

const normalizeTagToInternal = (tagName) => {
    const raw = String(tagName || '').trim();
    if (!raw) return null;

    const slug = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

    if (!slug) return null;
    return `tag.${slug}`;
};

const b64urlEncode = (value) => {
    const s = String(value || '');
    return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const b64urlDecode = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    return Buffer.from(padded, 'base64').toString('utf8');
};

const buildAlbumExternalIdFromArtistAlbum = (artist, album) => {
    return `aa_${b64urlEncode(artist)}.${b64urlEncode(album)}`;
};

const parseAlbumExternalId = (externalId) => {
    const raw = String(externalId || '').trim();
    if (!raw) return { mode: 'unknown' };

    if (raw.startsWith('rg_')) {
        const rg = raw.slice(3);
        return looksLikeMbid(rg) ? { mode: 'release_group', releaseGroupMbid: rg } : { mode: 'unknown' };
    }

    if (raw.startsWith('mb_')) {
        const mb = raw.slice(3);
        return looksLikeMbid(mb) ? { mode: 'mbid', mbid: mb } : { mode: 'unknown' };
    }

    if (raw.startsWith('aa_')) {
        const payload = raw.slice(3);
        const parts = payload.split('.');
        if (parts.length === 2) {
            const artist = b64urlDecode(parts[0]).trim();
            const album = b64urlDecode(parts[1]).trim();
            if (artist && album) {
                return { mode: 'artist_album', artist, album, canonicalExternalId: raw };
            }
        }
        return { mode: 'unknown' };
    }

    if (looksLikeMbid(raw)) return { mode: 'mbid', mbid: raw };

    return { mode: 'unknown' };
};

const formatDurationFromSeconds = (secondsValue) => {
    const n = parseInt(String(secondsValue || '0'), 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    const mm = Math.floor(n / 60);
    const ss = n % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
};

const formatDurationFromMilliseconds = (msValue) => {
    const n = parseInt(String(msValue || '0'), 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    const totalSeconds = Math.round(n / 1000);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
};

const normalizeTitleKey = (value) => {
    return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

const EDITION_KEYWORDS = /(?:remaster(?:ed)?|deluxe|expanded|anniversary|reissue|special edition|bonus|collector(?:'s)? edition|extended)/i;

const isCdFormats = (formats) => {
    const list = Array.isArray(formats) ? formats : [];
    return list.some((f) => String(f || '').toLowerCase().includes('cd'));
};

const isYearLikeTag = (value) => {
    const s = String(value || '').trim();
    if (!s) return false;

    const now = new Date().getFullYear() + 1;

    if (/^\d{4}$/.test(s)) {
        const y = parseInt(s, 10);
        return Number.isFinite(y) && y >= 1900 && y <= now;
    }

    if (/^\d{4}s$/i.test(s)) {
        const y = parseInt(s.slice(0, 4), 10);
        return Number.isFinite(y) && y >= 1900 && y <= now;
    }

    if (/^\d{2}s$/i.test(s)) {
        return true;
    }

    return false;
};

const shouldDropGenreTag = (value) => {
    const s = String(value || '').trim();
    if (!s) return true;

    if (/^\d+$/.test(s)) {
        return true;
    }

    if (isYearLikeTag(s)) {
        return true;
    }

    return false;
};

const resolveReleaseGroupMbid = async (anyMbid) => {
    const mbid = String(anyMbid || '').trim();
    if (!looksLikeMbid(mbid)) return null;

    const cached = cacheGet(rgByAnyMbidCache, mbid);
    if (cached !== null) return cached;

    try {
        await mbGet(`release-group/${mbid}`, { fmt: 'json' });
        cacheSet(rgByAnyMbidCache, mbid, mbid);
        return mbid;
    } catch (e) {
    }

    try {
        const res = await mbGet(`release/${mbid}`, { inc: 'release-groups', fmt: 'json' });
        const rgid = res.data?.['release-group']?.id;
        if (looksLikeMbid(rgid)) {
            cacheSet(rgByAnyMbidCache, mbid, rgid);
            return rgid;
        }
    } catch (e) {
    }

    cacheSet(rgByAnyMbidCache, mbid, null);
    return null;
};

const lookupReleaseGroupBasics = async (releaseGroupMbid) => {
    const rgid = String(releaseGroupMbid || '').trim();
    if (!looksLikeMbid(rgid)) return null;

    const cached = cacheGet(rgBasicsCache, rgid);
    if (cached !== null) return cached;

    try {
        const res = await mbGet(`release-group/${rgid}`, { inc: 'artists', fmt: 'json' });
        const data = res.data || {};

        const title = String(data.title || '').trim() || null;
        const firstReleaseYear = extractYear(data['first-release-date']) || null;

        let artist = null;
        const ac = data['artist-credit'];
        if (Array.isArray(ac) && ac.length > 0) {
            const first = ac[0];
            artist =
            (typeof first?.name === 'string' && first.name.trim()) ||
            (typeof first?.artist?.name === 'string' && first.artist.name.trim()) ||
            null;
        }

        const basics = { title, artist, firstReleaseYear };
        cacheSet(rgBasicsCache, rgid, basics);
        return basics;
    } catch (e) {
        cacheSet(rgBasicsCache, rgid, null);
        return null;
    }
};

const lookupReleaseGroupReleases = async (releaseGroupMbid) => {
    const rgid = String(releaseGroupMbid || '').trim();
    if (!looksLikeMbid(rgid)) return [];

    const cached = cacheGet(rgReleasesCache, rgid);
    if (cached !== null) return cached || [];

    try {
        const releases = [];

        let offset = 0;
        const limit = 100;

        for (let page = 0; page < 2; page++) {
            const res = await mbGet('release', {
                'release-group': rgid,
                limit,
                offset,
                fmt: 'json',
            });

            const batch = Array.isArray(res.data?.releases) ? res.data.releases : [];
            for (const r of batch) releases.push(r);

            const total = typeof res.data?.['release-count'] === 'number' ? res.data['release-count'] : null;
            offset += batch.length;

            if (!batch.length) break;
            if (!total) break;
            if (offset >= total) break;
        }

        cacheSet(rgReleasesCache, rgid, releases);
        return releases;
    } catch (e) {
        cacheSet(rgReleasesCache, rgid, []);
        return [];
    }
};

const fetchReleaseTracklist = async (releaseMbid) => {
    const rid = String(releaseMbid || '').trim();
    if (!looksLikeMbid(rid)) return null;

    const cached = cacheGet(releaseTracklistCache, rid);
    if (cached !== null) return cached;

    try {
        const res = await mbGet(`release/${rid}`, { inc: 'recordings', fmt: 'json' });
        const media = Array.isArray(res.data?.media) ? res.data.media : [];

        const formats = [];
        const tracksOut = [];

        let offset = 0;

        for (const medium of media) {
            const format = String(medium?.format || '').trim();
            if (format) formats.push(format);

            const tracks = Array.isArray(medium?.tracks) ? medium.tracks : [];
            for (let i = 0; i < tracks.length; i++) {
                const t = tracks[i];

                const posRaw =
                (typeof t?.position === 'number' ? t.position : parseInt(String(t?.position || ''), 10)) ||
                (typeof t?.number === 'string' ? parseInt(t.number, 10) : null) ||
                (i + 1);

                const pos = Number.isFinite(posRaw) ? posRaw : (i + 1);

                const title = String(t?.title || t?.recording?.title || '').trim();
                if (!title) continue;

                const length = formatDurationFromMilliseconds(t?.length);

                tracksOut.push({
                    no: offset + pos,
                    title,
                    length,
                });
            }

            offset += tracks.length;
        }

        const uniqFormats = Array.from(new Set(formats.map((f) => String(f || '').trim()).filter(Boolean)));

        const normalized = tracksOut
        .filter((t) => t && t.title)
        .sort((a, b) => (a.no || 0) - (b.no || 0))
        .map((x, idx) => ({
            no: Number.isFinite(x.no) ? x.no : (idx + 1),
                          title: x.title,
                          length: x.length,
        }));

        const payload = { tracks: normalized, trackCount: normalized.length, formats: uniqFormats };
        cacheSet(releaseTracklistCache, rid, payload);
        return payload;
    } catch (e) {
        cacheSet(releaseTracklistCache, rid, null);
        return null;
    }
};

const pickBaseReleaseCd = async (releases, rgTitle) => {
    const list = Array.isArray(releases) ? releases : [];
    if (!list.length) return { baseRelease: null, baseTracklist: null };

    const titleKey = normalizeTitleKey(rgTitle);

    const byDateAsc = [...list].sort((a, b) => {
        const da = String(a?.date || '').trim();
        const db = String(b?.date || '').trim();
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.localeCompare(db);
    });

    const preferExactTitle = byDateAsc.filter((r) => normalizeTitleKey(r?.title) === titleKey);
    const rest = byDateAsc.filter((r) => normalizeTitleKey(r?.title) !== titleKey);
    const pool = [...preferExactTitle, ...rest].filter((r) => r?.id);

    for (const r of pool.slice(0, 14)) {
        const tl = await fetchReleaseTracklist(r.id);
        if (!tl || !tl.trackCount) continue;
        if (!isCdFormats(tl.formats)) continue;
        if (tl.trackCount < 5 || tl.trackCount > 30) continue;
        return { baseRelease: r, baseTracklist: tl };
    }

    for (const r of pool.slice(0, 14)) {
        const tl = await fetchReleaseTracklist(r.id);
        if (!tl || !tl.trackCount) continue;
        if (tl.trackCount < 5 || tl.trackCount > 30) continue;
        return { baseRelease: r, baseTracklist: tl };
    }

    return { baseRelease: null, baseTracklist: null };
};

const pickBestBonusCdRelease = async (releases, baseRelease, baseTracklist) => {
    const list = Array.isArray(releases) ? releases : [];
    if (!list.length || !baseRelease?.id || !baseTracklist?.tracks?.length) return null;

    const baseCount = baseTracklist.tracks.length;

    const baseTitleSet = new Set(
        baseTracklist.tracks.map((t) => normalizeTitleKey(t?.title)).filter(Boolean)
    );

    const byDateDesc = [...list].sort((a, b) => {
        const da = String(a?.date || '').trim();
        const db = String(b?.date || '').trim();
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.localeCompare(da);
    });

    let best = null;

    const candidates = byDateDesc
    .filter((r) => r?.id && r.id !== baseRelease.id)
    .slice(0, 18);

    for (const r of candidates) {
        const tl = await fetchReleaseTracklist(r.id);
        if (!tl || !tl.tracks || tl.tracks.length === 0) continue;
        if (!isCdFormats(tl.formats)) continue;

        const candCount = tl.tracks.length;
        if (candCount <= baseCount) continue;
        if (candCount > baseCount + 8) continue;

        const candTitleSet = new Set(tl.tracks.map((t) => normalizeTitleKey(t?.title)).filter(Boolean));

        let hits = 0;
        for (const bt of baseTitleSet) {
            if (candTitleSet.has(bt)) hits += 1;
        }

        const coverage = baseCount > 0 ? (hits / baseCount) : 0;
        if (coverage < 0.85) continue;

        const extras = tl.tracks.filter((t) => !baseTitleSet.has(normalizeTitleKey(t?.title)));
        if (!extras.length) continue;
        if (extras.length > 5) continue;

        const isOfficial = String(r?.status || '').toLowerCase() === 'official';
        const title = String(r?.title || '').trim();
        const year = extractYear(r?.date);

        let score = coverage * 1000;
        if (isOfficial) score += 25;
        if (candCount === baseCount + 1) score += 60;
        score -= extras.length * 8;
        if (EDITION_KEYWORDS.test(title)) score += 12;
        if (year) score += Math.min(10, Math.max(0, (year - 1970) / 10));

        if (!best || score > best.score) {
            best = {
                release: r,
                tracklist: tl,
                extras,
                score,
            };
        }
    }

    if (!best) return null;

    const baseNextNo = baseCount + 1;

    const normalizedExtras = best.extras.map((x, idx) => ({
        no: baseNextNo + idx,
        title: String(x?.title || '').trim(),
                                                          length: String(x?.length || '').trim() || null,
    })).filter((x) => x.title);

    if (!normalizedExtras.length) return null;

    const year = extractYear(best.release?.date);
    const title = String(best.release?.title || '').trim();
    const country = String(best.release?.country || '').trim();

    let sectionTitle = 'CD Bonus Tracks';
    if (year) sectionTitle = `${year} ${sectionTitle}`;
    if (title && EDITION_KEYWORDS.test(title)) sectionTitle = year ? `${year} ${title}` : title;
    if (country) sectionTitle = `${sectionTitle} (${country})`;

    return {
        title: sectionTitle,
        tracks: normalizedExtras,
    };
};

const buildBonusSectionsFromReleaseGroup = async (releaseGroupMbid, rgTitle) => {
    const releases = await lookupReleaseGroupReleases(releaseGroupMbid);
    if (!releases.length) {
        return { baseTracks: null, bonusSections: [] };
    }

    const { baseRelease, baseTracklist } = await pickBaseReleaseCd(releases, rgTitle);
    if (!baseRelease || !baseTracklist?.tracks?.length) {
        return { baseTracks: null, bonusSections: [] };
    }

    const bonus = await pickBestBonusCdRelease(releases, baseRelease, baseTracklist);
    const bonusSections = bonus ? [bonus] : [];

    return { baseTracks: baseTracklist.tracks, bonusSections };
};

const fetchLastFmAlbumInfoByArtistAlbum = async ({ artist, album, lang = 'pt' }) => {
    const apiKey = getApiKey();
    const response = await lastFmClient.get('', {
        params: {
            method: 'album.getinfo',
            api_key: apiKey,
            artist,
            album,
            autocorrect: 1,
            format: 'json',
                lang,
        },
    });
    return response.data?.album || null;
};

const fetchLastFmAlbumInfoByMbid = async ({ mbid, lang = 'pt' }) => {
    const apiKey = getApiKey();
    const response = await lastFmClient.get('', {
        params: {
            method: 'album.getinfo',
            api_key: apiKey,
            mbid,
            format: 'json',
                lang,
        },
    });
    return response.data?.album || null;
};

const buildTracklistFromLastFm = (album) => {
    const rawTracks = album?.tracks?.track;
    const trackArr = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : [];

    const out = [];
    for (let i = 0; i < trackArr.length; i++) {
        const t = trackArr[i];

        const title = String((typeof t === 'string' ? t : t?.name) || '').trim();
        if (!title) continue;

        const rankRaw = (typeof t === 'object' && t?.['@attr']?.rank) ? t['@attr'].rank : null;
        const rank = rankRaw ? parseInt(String(rankRaw), 10) : null;

        const no = Number.isFinite(rank) ? rank : i + 1;
        const length = formatDurationFromSeconds(typeof t === 'object' ? t?.duration : null);

        out.push({ no, title, length });
    }

    return out
    .map((x, idx) => ({
        no: Number.isFinite(x.no) ? x.no : idx + 1,
                      title: x.title,
                      length: x.length,
    }))
    .sort((a, b) => (a.no || 0) - (b.no || 0));
};

export const getAlbumData = async (externalId) => {
    try {
        const parsed = parseAlbumExternalId(externalId);

        let releaseGroupMbid = null;
        let artistForLastFm = null;
        let albumForLastFm = null;
        let lastfmAlbumMbid = null;
        let album = null;
        let firstReleaseYearFromMb = null;

        let mbBaseTracks = null;
        let mbBonusSections = [];

        if (parsed.mode === 'release_group') {
            releaseGroupMbid = parsed.releaseGroupMbid;

            const basics = await lookupReleaseGroupBasics(releaseGroupMbid);
            if (!basics?.artist || !basics?.title) {
                artistForLastFm = null;
                albumForLastFm = null;
            } else {
                artistForLastFm = basics.artist;
                albumForLastFm = basics.title;
                firstReleaseYearFromMb = basics.firstReleaseYear || null;

                const rgTracks = await buildBonusSectionsFromReleaseGroup(releaseGroupMbid, basics.title);
                mbBaseTracks = rgTracks.baseTracks;
                mbBonusSections = rgTracks.bonusSections || [];
            }

            try {
                if (artistForLastFm && albumForLastFm) {
                    album = await fetchLastFmAlbumInfoByArtistAlbum({
                        artist: artistForLastFm,
                        album: albumForLastFm,
                        lang: 'pt',
                    });
                }
            } catch (e) {
                album = null;
            }
        } else if (parsed.mode === 'mbid') {
            lastfmAlbumMbid = parsed.mbid;

            try {
                album = await fetchLastFmAlbumInfoByMbid({ mbid: lastfmAlbumMbid, lang: 'pt' });
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    album = null;
                } else {
                    throw err;
                }
            }

            const candidateMbid = String(album?.mbid || lastfmAlbumMbid || '').trim();
            releaseGroupMbid = await resolveReleaseGroupMbid(candidateMbid);

            if (releaseGroupMbid) {
                const basics = await lookupReleaseGroupBasics(releaseGroupMbid);
                if (basics) {
                    firstReleaseYearFromMb = basics.firstReleaseYear || null;
                    artistForLastFm = basics.artist;
                    albumForLastFm = basics.title;

                    if (basics.title) {
                        const rgTracks = await buildBonusSectionsFromReleaseGroup(releaseGroupMbid, basics.title);
                        mbBaseTracks = rgTracks.baseTracks;
                        mbBonusSections = rgTracks.bonusSections || [];
                    }
                }

                if (!album && artistForLastFm && albumForLastFm) {
                    try {
                        album = await fetchLastFmAlbumInfoByArtistAlbum({
                            artist: artistForLastFm,
                            album: albumForLastFm,
                            lang: 'pt',
                        });
                    } catch (e) {
                        album = null;
                    }
                }
            }
        } else if (parsed.mode === 'artist_album') {
            artistForLastFm = parsed.artist;
            albumForLastFm = parsed.album;

            try {
                album = await fetchLastFmAlbumInfoByArtistAlbum({
                    artist: artistForLastFm,
                    album: albumForLastFm,
                    lang: 'pt',
                });
            } catch (e) {
                album = null;
            }

            if (album) {
                const candidateMbid = String(album.mbid || '').trim();
                if (looksLikeMbid(candidateMbid)) {
                    releaseGroupMbid = await resolveReleaseGroupMbid(candidateMbid);
                    if (releaseGroupMbid) {
                        const basics = await lookupReleaseGroupBasics(releaseGroupMbid);
                        if (basics) {
                            firstReleaseYearFromMb = basics.firstReleaseYear || null;
                            if (basics.title) {
                                const rgTracks = await buildBonusSectionsFromReleaseGroup(releaseGroupMbid, basics.title);
                                mbBaseTracks = rgTracks.baseTracks;
                                mbBonusSections = rgTracks.bonusSections || [];
                            }
                        }
                    }
                }
            }
        } else {
            throw new Error('ID de álbum inválido.');
        }

        const albumName = String(album?.name || albumForLastFm || '').trim() || 'Sem Título';
        const artistName =
        (typeof album?.artist === 'string' && album.artist.trim()) ||
        (typeof album?.artist?.name === 'string' && album.artist.name.trim()) ||
        artistForLastFm ||
        'Artista Desconhecido';

            const releaseYear =
            firstReleaseYearFromMb ||
            extractYear(album?.releasedate) ||
            extractYear(album?.wiki?.published) ||
            extractYear(album?.wiki?.content) ||
            null;

            const rawTags = album?.tags?.tag;
            const tagsListRaw = Array.isArray(rawTags)
            ? rawTags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
            : rawTags
            ? [typeof rawTags === 'string' ? rawTags : rawTags?.name].filter(Boolean)
            : [];

            const tagsList = (() => {
                const out = [];
                const seen = new Set();
                for (const t of tagsListRaw) {
                    const name = String(t || '').trim();
                    if (!name) continue;
                    if (shouldDropGenreTag(name)) continue;

                    const key = name.toLowerCase();
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(name);
                }
                return out;
            })();

            const tags = tagsList.map(normalizeTagToInternal).filter(Boolean);

            const posterUrl = album ? pickBestImage(album.image) : null;
            const synopsisCandidate = album ? (cleanupSummary(album.wiki?.summary) || cleanupSummary(album.wiki?.content)) : null;

            const canonicalExternalId = releaseGroupMbid
            ? `rg_${releaseGroupMbid}`
            : buildAlbumExternalIdFromArtistAlbum(artistName, albumName);

            const id = `lastfm_${canonicalExternalId}`;

            const titles = {
                PT: albumName,
                EN: albumName,
                ES: albumName,
                DEFAULT: albumName,
            };

            const synopses = {
                PT: synopsisCandidate || 'Sem descrição disponível.',
                EN: synopsisCandidate || 'No description available.',
                ES: synopsisCandidate || 'Sin descripción disponible.',
                DEFAULT: synopsisCandidate || 'Sem descrição disponível.',
            };

            const genres = {
                PT: tagsList,
                EN: tagsList,
                ES: tagsList,
                DEFAULT: tagsList,
            };

            const mainTracks =
            (Array.isArray(mbBaseTracks) && mbBaseTracks.length > 0)
            ? mbBaseTracks
            : (album ? buildTracklistFromLastFm(album) : []);

            const bonusSections =
            Array.isArray(mbBonusSections) && mbBonusSections.length > 0
            ? mbBonusSections
            : [];

            return {
                id,
                type: 'album',

                titles,
                synopses,

                posterUrl,
                backdropUrl: null,

                releaseYear,
                runtime: null,

                director: artistName,

                genres,
                countries: null,

                details: {
                    Artista: artistName,
                    Tracklist: Array.isArray(mainTracks) ? mainTracks : [],
                    BonusSections: bonusSections,
                },

                tags,
                externalIds: {
                    mbid: String(album?.mbid || lastfmAlbumMbid || '').trim() || null,
                    releaseGroupMbid: releaseGroupMbid || null,
                    lastfm: album?.url || null,
                    artist: artistName,
                    album: albumName,
                },
            };
    } catch (error) {
        console.error('Erro no LastFM Adapter:', error.message);
        return null;
    }
};

export const searchAlbums = async (query) => {
    const apiKey = getApiKey();

    const q = String(query || '').trim();
    if (!q) return [];

    try {
        const response = await lastFmClient.get('', {
            params: {
                method: 'album.search',
                api_key: apiKey,
                album: q,
                format: 'json',
                    limit: 10,
            },
        });

        const raw = response.data?.results?.albummatches?.album;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

        const dedup = new Map();
        for (const item of list) {
            const title = String(item?.name || '').trim();
            const artist = String(item?.artist || '').trim();
            const mbid = String(item?.mbid || '').trim();

            if (!title || !artist) continue;

            let canonicalExternalId = null;
            if (looksLikeMbid(mbid)) {
                const rgid = await resolveReleaseGroupMbid(mbid);
                if (rgid) {
                    canonicalExternalId = `rg_${rgid}`;
                }
            }

            if (!canonicalExternalId) {
                canonicalExternalId = buildAlbumExternalIdFromArtistAlbum(artist, title);
            }

            const id = `lastfm_${canonicalExternalId}`;

            const existing = dedup.get(id);
            const poster = pickBestImage(item?.image);

            if (!existing) {
                dedup.set(id, {
                    id,
                    title,
                    artist,
                    year: '?',
                    poster,
                    type: 'album',
                });
            } else if (!existing.poster && poster) {
                existing.poster = poster;
            }
        }

        return Array.from(dedup.values());
    } catch (error) {
        console.error('Erro no LastFM Adapter (search):', error.message);
        return [];
    }
};
