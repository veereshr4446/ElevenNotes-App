// ============================================================
//  APP.JS — ElevenNotes
//  Everything is saved only in this browser (LocalStorage).
//  No accounts, no server, no outside connections.
// ============================================================
(function () {
    'use strict';

    // ---------- helpers ----------
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = n => String(n).padStart(2, '0');
    const KEY = 'elevenNotes_';
    const get = (k, d) => { try { const v = localStorage.getItem(KEY + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
    const set = (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    // ---------- the student's class (branch + semester) ----------
    const CLS = get('class', null) || DEFAULT_CLASS;
    const CLS_BRANCH = BRANCHES.find(b => b.id === CLS.branch) || BRANCHES[0];
    const CD = CLASS_DATA[CLS_BRANCH.id + '|' + CLS.sem] || null;
    if (CD) { SUBJECTS = CD.subjects; FACULTY = CD.faculty; TIMETABLE = CD.timetable; EXAMS = CD.exams; }
    const clsLabel = () => `${CLS_BRANCH.name} · Sem ${CLS.sem}`;
    const SUB = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));
    const DAYS = [null, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function fmtTime(min) {
        const h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'PM' : 'AM';
        return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`;
    }

    // ---------- state ----------
    const defaultProfile = { name: 'Student', usn: '', bio: 'CSE student. Building the future.', avatar: 'images/avatar-girl-1.jpeg' };
    const S = {
        profile: Object.assign({}, defaultProfile, get('profile', {})),
        tasks: get('tasks', []),
        notes: get('notes', []),
        ratings: get('ratings', {}),
        circles: get('circles', {}),
        stats: Object.assign({ tasksDone: 0, focusSessions: 0, focusMinutes: 0, notesAdded: 0, sgpaUsed: false, whatifUsed: false, darkTried: false, bonusXp: 0, visits: [] }, get('stats', {})),
        daily: get('daily', {}),
        seen: get('seen', []),
        customExams: get('customExams', []),
        sgpa: get('sgpa', null),
        focusMin: get('focusMin', 25),
        sessions: get('sessions', [])
    };
    const ui = { lib: { items: [], loaded: false, loading: false, error: false }, libQ: '', fBranch: null, fSem: null, studyTab: 'subjects', day: 0, planFilter: 'all', exam: 'last' };

    const save = k => set(k, S[k]);

    // ---------- toast & sheet ----------
    let toastTimer;
    // Toasts are only for things that happen outside what the student is looking at
    // (achievements, a finished timer) or for errors. Normal saves show on screen already.
    function toast(msg, kind, title) {
        const t = $('#toast');
        t.className = 'toast ' + (kind || '') + ' show';
        t.innerHTML = (title ? `<b>${esc(title)}</b>` : '') + `<span>${esc(msg)}</span>`;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), kind === 'err' ? 4200 : 3200);
    }
    function formError(f, msg) {
        let e = f.querySelector('.form-err');
        if (!e) { e = document.createElement('p'); e.className = 'form-err'; e.setAttribute('role', 'alert'); f.insertBefore(e, f.querySelector('[type=submit]')); }
        e.textContent = msg;
    }

    let lastFocus = null, sheetGuard = null;
    function openSheet(title, html) {
        sheetGuard = null;
        lastFocus = document.activeElement;
        $('#sheetTitle').textContent = title;
        $('#sheetBody').innerHTML = html;
        $('#sheetWrap').classList.add('open');
        $('#sheetWrap').setAttribute('aria-hidden', 'false');
        document.body.classList.add('lock');
        const first = $('#sheetBody input, #sheetBody textarea, #sheetBody select');
        if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
    }
    // ---------- anonymous usage count, private (needs supabase/stats.sql) ----------
    function pingDevice() {
        if (!libOn()) return;
        const today = dkey();
        if (get('pinged', '') === today) return;
        rpc('ping_device', { p_device: voterId() }).then(() => set('pinged', today)).catch(() => {});
    }
    function openDev() { $('#devWrap').classList.add('open'); $('#devWrap').setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); }
    function closeDev() { const w = $('#devWrap'); if (!w.classList.contains('open')) return; $('#lofi').pause(); $('#pcard').hidden = true; w.classList.remove('open'); w.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); }
    (function player() {
        const a = $('#lofi'), btn = $('#musicBtn'), seek = $('#seek'), pb = $('#playBtn');
        const PLAY = '<svg class="i" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>', PAUSE = '<svg class="i" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
        const fmt = t => isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00';
        const sync = () => {
            const on = !a.paused;
            btn.classList.toggle('playing', on); $('#pcard').classList.toggle('playing', on); btn.setAttribute('aria-pressed', on);
            $('#musicState').textContent = on ? 'Playing' : 'Paused';
            pb.innerHTML = on ? PAUSE : PLAY;
        };
        sync();
        a.addEventListener('play', sync); a.addEventListener('pause', sync);
        a.addEventListener('loadedmetadata', () => { $('#tAll').textContent = fmt(a.duration); });
        a.addEventListener('timeupdate', () => { $('#tNow').textContent = fmt(a.currentTime); if (a.duration) { seek.value = a.currentTime / a.duration * 100; seek.style.setProperty('--v', seek.value + '%'); } });
        seek.addEventListener('input', () => { seek.style.setProperty('--v', seek.value + '%'); if (a.duration) a.currentTime = seek.value / 100 * a.duration; });
    })();
    function closeSheet() {
        if (sheetGuard && !sheetGuard()) return;
        sheetGuard = null;
        $('#sheetWrap').classList.remove('open');
        $('#sheetWrap').setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lock');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // ---------- progress, XP, badges ----------
    function calcStreak() {
        const seen = new Set(S.stats.visits);
        const d = new Date();
        let n = 0;
        while (seen.has(dkey(d))) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }
    function derived() {
        return Object.assign({}, S.stats, {
            rated: Object.values(S.ratings).filter(Boolean).length,
            circles: Object.values(S.circles).filter(Boolean).length,
            streak: calcStreak(),
            profileDone: S.profile.name !== 'Student' && !!S.profile.usn
        });
    }
    function today() {
        const k = dkey();
        if (!S.daily || S.daily.date !== k) { S.daily = { date: k, tasksDone: 0, focusSessions: 0, added: 0, claimed: [] }; save('daily'); }
        return S.daily;
    }
    function checkProgress() { today(); save('daily'); save('stats'); }
    function bump(field, n = 1, dailyField) {
        S.stats[field] += n;
        if (dailyField) today()[dailyField] += 1;
        save('stats'); save('daily');
        checkProgress();
    }

    // ---------- timetable helpers ----------
    function entryInfo(e) {
        if (e.sub) { const s = SUB[e.sub]; return { title: s.name, sub: s.faculty, kind: s.kind }; }
        return { title: e.title, sub: e.detail, kind: e.kind || 'free' };
    }
    function dueInfo(d) {
        if (!d) return null;
        const t = new Date(d + 'T00:00:00'), t0 = new Date(); t0.setHours(0, 0, 0, 0);
        const diff = Math.round((t - t0) / 864e5);
        if (diff < 0) return { text: `Overdue by ${-diff} day${diff === -1 ? '' : 's'}`, late: true };
        if (diff === 0) return { text: 'Due today' };
        if (diff === 1) return { text: 'Due tomorrow' };
        if (diff < 7) return { text: `Due in ${diff} days` };
        return { text: 'Due ' + t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
    }
    const examList = () => EXAMS.concat(S.customExams);
    function nextExam() {
        const t0 = new Date(); t0.setHours(0, 0, 0, 0);
        return examList().map(e => ({ e, days: Math.round((new Date(e.date + 'T00:00:00') - t0) / 864e5) }))
            .filter(x => x.days >= 0).sort((a, b) => a.days - b.days)[0] || null;
    }

    // ============================================================
    //  PAGES
    // ============================================================
    const R = {};

    // ---------- HOME ----------
    R.home = function () {
        const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
        const h = now.getHours();
        const greet = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
        const named = S.profile.name !== 'Student';
        const first = S.profile.name.split(' ')[0];
        const list = TIMETABLE[now.getDay()] || [];
        const nextIdx = list.findIndex(e => e.t > nowMin);
        const classes = list.map((e, i) => {
            const info = entryInfo(e), end = e.t + e.n * PERIOD_MIN;
            const cur = nowMin >= e.t && nowMin < end, past = nowMin >= end, nxt = i === nextIdx;
            const cls = cur ? 'now' : nxt ? 'next' : past ? 'past' : '';
            const tag = cur ? '<span class="tag live"><i></i>Now</span>' : nxt ? '<span class="tag soon">Up next</span>' : '';
            return `<li class="cls ${cls}"><div class="cls-time">${fmtTime(e.t)}</div><div>${tag}<div class="cls-title">${esc(info.title)}</div><div class="cls-sub">${esc(info.sub)}</div></div></li>`;
        }).join('');
        const sheet = list.length
            ? `<ul class="classes">${classes}</ul>`
            : (Object.keys(TIMETABLE).length ? `<div class="empty"><b>No classes today</b>Enjoy the break, or get ahead on your tasks.</div>`
                : `<div class="empty"><b>Timetable not added yet</b>We are adding classes one by one. Check your official college timetable for now.</div>`);

        const pending = S.tasks.filter(t => !t.done);
        const soon = pending.filter(t => t.date).sort((a, b) => a.date.localeCompare(b.date))[0];
        const ne = nextExam();

        $('#page-home').innerHTML = `
            <h1 class="hello">${greet}${named ? ', ' + esc(first) : ''}<small>${named ? 'Here is your day.' : 'Add your name in the Me tab to personalise this.'}</small></h1>
            <button class="class-pill" data-act="pick-class" aria-label="Change class">🎓 ${esc(clsLabel())} <span>Change</span></button>
            ${(isStandalone() || get('installDismiss', false)) ? '' : `<div class="install-card"><button class="install-main" data-act="install"><span class="install-ico">📲</span><span class="grow"><b class="install-title">Install ElevenNotes App</b><span class="install-sub"><b class="install-size">0.6 MB</b> only · Add it to your home screen</span></span></button><button class="install-x" data-act="install-dismiss" aria-label="Hide">✕</button></div>`}
            <div class="today">
                <div class="today-top">
                    <div class="date-big"><b>${now.getDate()}</b><span>${now.toLocaleDateString('en-IN', { weekday: 'short' })}<br>${now.toLocaleDateString('en-IN', { month: 'short' })}</span></div>
                    <div class="streak-chip">🔥 ${Math.max(calcStreak(), 1)} day streak</div>
                </div>
                ${sheet}
            </div>
            <div class="flat">
                <button data-act="nav" data-to="plan"><span class="em">📋</span><span class="grow"><b>${pending.length ? pending.length + ' task' + (pending.length > 1 ? 's' : '') + ' to do' : 'Nothing pending'}</b><span>${soon ? esc(soon.title) + ', ' + dueInfo(soon.date).text.toLowerCase() : (pending.length ? 'Open your list' : 'Add a task to plan your week')}</span></span><span class="go">›</span></button>
                ${ne ? `<button data-act="tool" data-tab="count" data-exam="${esc(ne.e.id)}"><span class="em">⏳</span><span class="grow"><b>${ne.days === 0 ? 'Today: ' : ne.days + (ne.days === 1 ? ' day to ' : ' days to ')}${esc(ne.e.name)}</b><span>Open the countdown</span></span><span class="go">›</span></button>` : ''}
            </div>
            <h2 class="sec-title">Jump to</h2>
            <div class="tiles">
                <button class="tile" data-act="nav" data-to="faculty"><span>👩‍🏫</span>Faculty</button>
                <button class="tile" data-act="tool" data-tab="focus"><span>🍅</span>Focus</button>
                <button class="tile" data-act="tool" data-tab="sgpa"><span>🎓</span>SGPA</button>
                <button class="tile" data-act="study-tab" data-tab="library"><span>📝</span>Notes</button>
                <button class="tile" data-act="nav" data-to="events"><span>🎉</span>Events</button>
                <button class="tile" data-act="nav" data-to="community"><span>💬</span>Community</button>
            </div>`;
    };

    // ---------- STUDY ----------
    R.study = function () {
        const tabs = [['subjects', 'Subjects'], ['timetable', 'Timetable'], ['library', 'Notes']];
        let body = '';
        if (ui.studyTab === 'subjects') {
            body = !SUBJECTS.length ? `<div class="sheet-paper empty"><b>Subjects not added yet</b>The subjects for ${esc(clsLabel())} are not in ElevenNotes yet. You can still use tasks, notes, the shared library and all tools.</div>` : `<div class="flat">${SUBJECTS.map(s => `
                <button data-act="subject" data-id="${s.id}">
                    <span class="code-chip ${s.kind}">${s.id}</span>
                    <span class="grow"><b>${esc(s.name)}</b><span>${esc(s.faculty)}</span></span><span class="go">›</span>
                </button>`).join('')}</div>
                <p class="fine">${SUBJECTS.length} subjects, Semester ${CLS.sem}. Tap a subject to rate the faculty or add a note or task.</p>`;
        } else if (ui.studyTab === 'timetable') {
            const dow = new Date().getDay(), todayIdx = dow === 0 ? 1 : dow;
            if (!ui.day) ui.day = todayIdx;
            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
            const list = TIMETABLE[ui.day] || [];
            body = !Object.keys(TIMETABLE).length ? `<div class="sheet-paper empty"><b>Timetable not added yet</b>The timetable for ${esc(clsLabel())} is not in ElevenNotes yet. Please check your official college timetable.</div>` : `<div class="day-chips" role="tablist">${[1, 2, 3, 4, 5, 6].map(d => `<button class="chip ${ui.day === d ? 'on' : ''}" data-act="day" data-d="${d}">${DAYS[d]}${d === dow ? ' •' : ''}</button>`).join('')}</div>
                <div class="flat">${list.map(e => {
                    const info = entryInfo(e), end = e.t + e.n * PERIOD_MIN;
                    const live = ui.day === dow && nowMin >= e.t && nowMin < end;
                    return `<div class="row ${live ? 'live' : ''}"><span class="code-chip ${info.kind}" style="min-width:76px">${fmtTime(e.t)}</span><span class="grow">${live ? '<span class="tag live"><i></i>Now</span>' : ''}<b>${esc(info.title)}</b><span>${esc(info.sub)}</span></span></div>`;
                }).join('')}</div>
                <p class="fine">${esc(CD.note)} Always check your official college timetable too.</p>`;
        } else {
            body = libraryHtml();
            if (libOn() && !ui.lib.loaded && !ui.lib.loading) loadLibrary();
        }
        $('#page-study').innerHTML = `<h1 class="ptitle">Study</h1>
            <button class="class-pill" data-act="pick-class" aria-label="Change class">🎓 ${esc(clsLabel())} <span>Change</span></button>
            <div class="seg" role="tablist">${tabs.map(([id, label]) => `<button role="tab" class="${ui.studyTab === id ? 'on' : ''}" data-act="study-tab" data-tab="${id}">${label}</button>`).join('')}</div>${body}`;
    };


    // ============================================================
    //  SHARED LIBRARY — Google Drive links shared with the class.
    //  Stored in a free Supabase database (see supabase/setup.sql).
    //  Each upload gets a 6-digit PIN; only the PIN can delete it.
    //  The PIN is hashed on the server and never stored in plain text.
    // ============================================================
    const CFG = window.ELEVEN_CONFIG || {};
    const libOn = () => !!(CFG.supabaseUrl && CFG.supabaseKey);
    const classKey = () => CLS_BRANCH.id + '-' + CLS.sem;
    // Notes are filtered by branch and semester. CSE A and CSE B are separate; the two AI & ML sections are merged into one.
    const NOTE_BRANCHES = [{ id: 'CSE-A', name: 'CSE – A' }, { id: 'CSE-B', name: 'CSE – B' }, { id: 'AIML', name: 'CSE – AI & ML' }, { id: 'DS', name: 'CSE – Data Science & Cyber' }, { id: 'ISE', name: 'ISE' }, { id: 'ECE', name: 'ECE' }, { id: 'EEE', name: 'EEE' }, { id: 'ME', name: 'Mechanical' }, { id: 'CIVIL', name: 'Civil' }];
    const groupOf = id => (id === 'AIML-A' || id === 'AIML-B') ? 'AIML' : id;
    const parseKey = key => { const m = /^(.*)-(\d)$/.exec(key || ''); return m ? { group: groupOf(m[1]), sem: +m[2] } : { group: '', sem: 0 }; };
    const myGroup = () => groupOf(CLS_BRANCH.id);
    const fBranch = () => ui.fBranch == null ? myGroup() : ui.fBranch;
    const fSem = () => ui.fSem == null ? String(CLS.sem) : ui.fSem;
    const groupName = g => (NOTE_BRANCHES.find(b => b.id === g) || { name: g }).name;
    const DRIVE_RE = /^https:\/\/(drive|docs)\.google\.com\//i;

    async function rpc(name, args) {
        const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
        try {
            const headers = { 'Content-Type': 'application/json', apikey: CFG.supabaseKey };
            if (/^eyJ/.test(CFG.supabaseKey)) headers.Authorization = 'Bearer ' + CFG.supabaseKey;
            const r = await fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + name, { method: 'POST', headers, body: JSON.stringify(args), signal: ctl.signal });
            if (!r.ok) throw new Error('http ' + r.status);
            const t = await r.text();
            return t ? JSON.parse(t) : null;
        } finally { clearTimeout(to); }
    }

    function voterId() {
        let v = get('voter', null);
        if (!v) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); set('voter', v); }
        return v;
    }
    async function loadLibrary() {
        if (!libOn() || ui.lib.loading) return;
        ui.lib.loading = true; ui.lib.error = false;
        if (current === 'study' && ui.studyTab === 'library') R.study();
        try {
            let items;
            try { items = await rpc('list_notes', { p_voter: voterId() }); ui.lib.votes = true; }
            catch (e0) {   // filters SQL not run yet: fall back to this class only
                try { items = await rpc('list_resources', { p_class: classKey(), p_voter: voterId() }); ui.lib.votes = true; }
                catch (e1) { items = await rpc('list_resources', { p_class: classKey() }); ui.lib.votes = false; }
                items = (items || []).map(n => Object.assign({ class_key: classKey() }, n));
            }
            ui.lib.items = (items || []).map(n => Object.assign({ votes: 0, voted: false }, n))
                .sort((a, b) => (b.votes - a.votes) || (new Date(b.created_at) - new Date(a.created_at)));
            ui.lib.loaded = true;
        }
        catch (e) { ui.lib.error = true; ui.lib.loaded = true; }
        ui.lib.loading = false;
        if (current === 'study' && ui.studyTab === 'library') R.study();
    }

    function libItemHay(n) { return (n.subject + ' ' + n.title + ' ' + n.uploader).toLowerCase(); }
    function libraryHtml() {
        const legacy = S.notes.length ? `<h2 class="sec-title">Saved on this device</h2><div class="flat">${S.notes.map(n => `
            <div class="note">
                <div class="note-top"><span class="code-chip">${esc(n.subject)}</span><span class="date-sm">${esc(n.date)}</span></div>
                <h3>${esc(n.title)}</h3>${n.desc ? `<p>${esc(n.desc)}</p>` : ''}
                <div class="note-actions">${n.link ? `<a class="link-btn" href="${esc(n.link)}" target="_blank" rel="noopener noreferrer">Open link</a>` : ''}<button class="del" data-act="del-note" data-id="${esc(n.id)}">Delete</button></div>
            </div>`).join('')}</div>` : '';
        if (!libOn()) return `<div class="sheet-paper empty"><b>Notes sharing is not switched on yet</b>Once it is, you can share Google Drive links with your class here.</div>${legacy}`;
        const L = ui.lib, q = ui.libQ.trim().toLowerCase();
        const mine = get('mineLib', []), reported = get('reportedLib', []);
        const fb = fBranch(), fs = fSem();
        const shownItems = L.items.filter(n => { const k = parseKey(n.class_key); return (fb === 'all' || k.group === fb) && (fs === 'all' || String(k.sem) === fs); });
        let list;
        if (L.loading && !L.items.length) list = `<div class="sheet-paper empty"><b>Loading notes…</b></div>`;
        else if (L.error) list = `<div class="sheet-paper empty"><b>Could not load the notes</b>Check your internet and tap Refresh.</div>`;
        else if (!shownItems.length) list = `<div class="sheet-paper empty"><b>No notes here yet</b>${L.items.length ? 'Try another branch or semester above, or' : 'Be the first.'} Tap “Upload notes” to add a Google Drive link.</div>`;
        else list = `<div class="flat" id="libList">${shownItems.map(n => `
            <div class="note" data-hay="${esc(libItemHay(n))}" ${q && !libItemHay(n).includes(q) ? 'hidden' : ''}>
                <div class="note-top"><span class="code-chip">${esc(n.subject)}</span><span class="date-sm">${esc(new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></div>
                <h3>${esc(n.title)}</h3><p>Shared by ${esc(n.uploader)} · ${esc(groupName(parseKey(n.class_key).group))}${parseKey(n.class_key).sem ? ' Sem ' + parseKey(n.class_key).sem : ''}${mine.includes(n.id) ? ' <span class="tag">You</span>' : ''}</p>
                <div class="note-actions">${L.votes ? `<button class="vote ${n.voted ? 'on' : ''}" data-act="lib-vote" data-id="${esc(n.id)}" aria-pressed="${n.voted}" aria-label="Like"><svg class="i" viewBox="0 0 24 24"><path d="M12 20.5s-8.5-5.2-8.5-11A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8.5 2.7c0 5.8-8.5 11-8.5 11z"/></svg><span>${n.votes}</span></button>` : ''}<a class="link-btn" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">Open link</a><button class="dots" data-act="lib-menu" data-id="${esc(n.id)}" aria-label="More options"><svg class="i" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></div>
            </div>`).join('')}</div><div class="empty" id="libNone" hidden><b>No match</b>Try a different subject or title.</div>`;
        return `<p class="fine" style="margin:0 0 12px">Notes shared by your classmates as Google Drive links. Anyone can upload. Only the person who uploaded can delete, using their 6-digit PIN.</p>
            <div class="lib-actions"><button class="btn primary small" data-act="lib-add">Upload notes</button><button class="btn ghost small" data-act="lib-refresh">${L.loading ? 'Loading…' : 'Refresh'}</button></div>
            <div class="lib-filters">
                <label>Branch<select id="libBranch"><option value="all" ${fb === 'all' ? 'selected' : ''}>All branches</option>${NOTE_BRANCHES.map(b => `<option value="${b.id}" ${fb === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
                <label>Semester<select id="libSem"><option value="all" ${fs === 'all' ? 'selected' : ''}>All semesters</option>${SEMESTERS.map(n => `<option value="${n}" ${fs === String(n) ? 'selected' : ''}>Semester ${n}</option>`).join('')}</select></label>
            </div>
            ${L.items.length ? `<input class="lib-search" id="libSearch" type="search" placeholder="Search by subject or title" value="${esc(ui.libQ)}" autocomplete="off" aria-label="Search notes" />` : ''}
            ${list}
            <p class="fine">Make sure the Drive link is set to “Anyone with the link can view”. Only Google Drive and Docs links are accepted. Report anything that does not belong here.</p>${legacy}`;
    }
    function filterLib(q) {
        ui.libQ = q; q = q.trim().toLowerCase();
        let shown = 0;
        $$('#libList .note').forEach(el => { const ok = !q || el.dataset.hay.includes(q); el.hidden = !ok; if (ok) shown++; });
        const none = $('#libNone'); if (none) none.hidden = shown > 0;
    }

    function randomPin() {
        const a = new Uint32Array(1); crypto.getRandomValues(a);
        return String(a[0] % 1000000).padStart(6, '0');
    }

    function libAddSheet(subject) {
        const ub = fBranch() === 'all' ? myGroup() : fBranch(), us = fSem() === 'all' ? String(CLS.sem) : fSem();
        openSheet('Upload notes', `<form data-form="share">
            <div class="two-col">
                <label>Branch<select name="branch">${NOTE_BRANCHES.map(b => `<option value="${b.id}" ${ub === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
                <label>Semester<select name="sem">${SEMESTERS.map(n => `<option value="${n}" ${us === String(n) ? 'selected' : ''}>Semester ${n}</option>`).join('')}</select></label>
            </div>
            <label>Subject name<input name="subject" maxlength="20" required value="${esc(subject || '')}" placeholder="e.g. DSA, Maths, Java" autocapitalize="words" /></label>
            <label>Title<input name="title" maxlength="80" required placeholder="e.g. Unit 3 notes" /></label>
            <label>Google Drive link<input type="url" name="url" required placeholder="https://drive.google.com/..." /></label>
            <label>Your name <span class="opt">(shown to others)</span><input name="uploader" maxlength="30" value="${esc(S.profile.name)}" /></label>
            <label>Delete PIN <span class="opt">(6 digits, you will need it to delete)</span>
                <span class="pin-row"><input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" minlength="6" required placeholder="------" autocomplete="off" /><button type="button" class="btn ghost small" data-act="pin-gen">Make one for me</button></span></label>
            <button class="btn primary block" type="submit">Upload</button></form>`);
    }

    function receiptSheet(d) {
        const text = `ElevenNotes notes link\nTitle: ${d.title}\nSubject: ${d.subject}\nLink: ${d.url}\nShared by: ${d.uploader}\nDate: ${d.date}\nDelete PIN: ${d.pin}\n\nKeep this PIN safe. It is the only way to delete this link, and it cannot be recovered.`;
        let copied = false;
        openSheet('Uploaded. Save your PIN', `<div class="ticket">
                <div class="ticket-row"><span>Title</span><b>${esc(d.title)}</b></div>
                <div class="ticket-row"><span>Subject</span><b>${esc(d.subject)}</b></div>
                <div class="ticket-row"><span>Link</span><b class="brk">${esc(d.url)}</b></div>
                <div class="ticket-row"><span>Shared by</span><b>${esc(d.uploader)}</b></div>
                <div class="ticket-row"><span>Date</span><b>${esc(d.date)}</b></div>
                <div class="ticket-pin"><span>Delete PIN</span><b>${esc(d.pin)}</b></div>
            </div>
            <p class="fine" style="margin-top:12px">Copy these details or take a screenshot. This PIN is shown only once and cannot be recovered. Without it, nobody (including you) can delete this link.</p>
            <button class="btn primary block" id="copyAll">Copy all details</button>
            <button class="btn ghost block" data-act="close-sheet">I have saved it</button>`);
        $('#copyAll').addEventListener('click', async () => {
            let ok = false;
            try { await navigator.clipboard.writeText(text); ok = true; }
            catch (e) {
                const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
                try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove();
            }
            if (ok) { copied = true; $('#copyAll').textContent = 'Copied'; } else toast('Could not copy. Please take a screenshot instead.', 'err');
        });
        sheetGuard = () => copied || confirm('Have you saved your PIN (' + d.pin + ')? It cannot be recovered. Close anyway?');
        // the "I have saved it" button counts as confirmation
        $('#sheetBody [data-act="close-sheet"]').addEventListener('click', () => { copied = true; }, true);
    }

    function libDelSheet(id) {
        const it = ui.lib.items.find(i => i.id === id); if (!it) return;
        openSheet('Delete this link', `<form data-form="unshare"><input type="hidden" name="id" value="${esc(id)}" />
            <p><b>${esc(it.title)}</b></p>
            <label>Enter the 6-digit PIN you got when you shared it<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" minlength="6" required placeholder="------" autocomplete="off" /></label>
            <button class="btn danger block" type="submit">Delete</button></form>`);
    }


    // ============================================================
    //  CLASS PICKER + SEARCH
    // ============================================================
    const pick = { b: CLS_BRANCH.id, s: CLS.sem };
    function pickerHtml() {
        const has = (b, sem) => !!CLASS_DATA[b + '|' + sem];
        return `<p class="muted" style="margin-bottom:10px">Pick your branch and semester. ElevenNotes shows the subjects, timetable and shared notes for that class.</p>
            <h3 class="pick-h">Branch</h3>
            <div class="pick-list">${BRANCHES.map(b => `<button class="${pick.b === b.id ? 'on' : ''}" data-act="pick-b" data-id="${b.id}"><span class="em">${b.emoji}</span><span class="grow"><b>${esc(b.name)}</b><small>${esc(b.long)}</small></span><span class="tick">${pick.b === b.id ? '✓' : ''}</span></button>`).join('')}</div>
            <h3 class="pick-h">Semester</h3>
            <div class="sem-grid">${SEMESTERS.map(n => `<button class="${pick.s === n ? 'on' : ''}" data-act="pick-s" data-n="${n}">${n}${has(pick.b, n) ? '<i title="Timetable available"></i>' : ''}</button>`).join('')}</div>
            <p class="fine" style="margin-top:8px">${has(pick.b, pick.s) ? 'Timetable available for this class.' : 'Timetable for this class is not added yet. Tasks, notes, shared links and tools still work.'} A dot means a timetable is available.</p>
            <button class="btn primary block" data-act="pick-save">${(pick.b === CLS_BRANCH.id && pick.s === CLS.sem) ? 'Continue' : 'Save class'}</button>`;
    }
    function pickerSheet() { pick.b = CLS_BRANCH.id; pick.s = CLS.sem; openSheet('Choose your class', pickerHtml()); }
    function pickerRefresh() { $('#sheetBody').innerHTML = pickerHtml(); }

    function searchIndex() {
        const out = [];
        const add = (icon, title, sub, run, hay) => out.push({ icon, title, sub, run, hay: (title + ' ' + sub + ' ' + (hay || '')).toLowerCase() });
        BRANCHES.forEach(b => SEMESTERS.forEach(n => {
            const here = b.id === CLS_BRANCH.id && n === CLS.sem;
            add(b.emoji, `${b.name} · Sem ${n}`, here ? 'Your class' : 'Switch to this class', () => setClass(b.id, n), 'class branch semester sem ' + b.long);
        }));
        SUBJECTS.forEach(s => add('📘', s.name, `${s.id} · ${s.faculty}`, () => subjectSheet(s.id), s.code + ' subject'));
        FACULTY.forEach(f => add('👩‍🏫', f.name, f.subject, () => go('faculty'), 'faculty teacher staff'));
        S.notes.forEach(n => add('📝', n.title, 'Your saved note · ' + n.subject, () => { ui.studyTab = 'library'; go('study'); }, n.desc));
        S.tasks.forEach(t => add(t.done ? '✅' : '📋', t.title, 'Your task · ' + t.subject, () => go('plan')));
        ui.lib.items.forEach(i => add('🔗', i.title, 'Shared · ' + i.subject, () => { ui.studyTab = 'library'; go('study'); }, i.uploader));
        [['🗓️', 'Timetable', 'Your weekly classes', () => { ui.studyTab = 'timetable'; go('study'); }, 'schedule classes today'],
         ['📘', 'Subjects', 'All subjects of your class', () => { ui.studyTab = 'subjects'; go('study'); }],
         ['📝', 'Notes', 'Drive links shared by your class', () => { ui.studyTab = 'library'; go('study'); }, 'shared library pdf drive upload'],
         ['🎓', 'SGPA calculator', 'Estimate your SGPA', () => { go('tools'); showTool('sgpa'); }, 'grade cgpa marks'],
         ['📈', 'Attendance planner', 'Plan how many classes to attend', () => { go('tools'); showTool('att'); }, 'percent bunk'],
         ['⏳', 'Exam countdown', 'Days left for your dates', () => { go('tools'); showTool('count'); }, 'exam date'],
         ['🍅', 'Focus timer', 'Pomodoro study timer', () => { go('tools'); showTool('focus'); }, 'pomodoro'],
         ['🎉', 'Events', 'College fests and activities. Coming soon', () => go('events'), 'fest'],
         ['💬', 'Community', 'Join the community', () => go('community')],
         ['👤', 'Profile and settings', 'Your profile, class, dark mode', () => go('me'), 'streak profile settings theme'],
         ['👨‍💻', 'About the developer', 'Meet Viresh', () => openDev()]
        ].forEach(a => add(a[0], a[1], a[2], a[3], a[4]));
        return out;
    }
    function searchSheet() {
        ui.sIndex = searchIndex();
        openSheet('Search', `<input class="srch-input" id="srchInput" type="search" placeholder="Search subjects, notes, tools, classes…" autocomplete="off" aria-label="Search" />
            <div class="srch-results flat" id="srchOut"></div>`);
        runSearch('');
        const i = $('#srchInput'); if (i) i.focus();
    }
    function runSearch(q) {
        q = q.trim().toLowerCase();
        const tokens = q.split(/\s+/).filter(Boolean);
        let res;
        if (!tokens.length) res = ui.sIndex.filter(r => /Timetable|SGPA|Subjects|Notes|Focus/.test(r.title) && r.sub !== 'Your class').slice(0, 5).concat([{ icon: '🎓', title: 'Change my class', sub: clsLabel(), run: pickerSheet }]);
        else res = ui.sIndex.filter(r => tokens.every(t => r.hay.includes(t))).slice(0, 12);
        ui.sRes = res;
        $('#srchOut').innerHTML = res.length ? res.map((r, i) => `<button data-act="srch-go" data-i="${i}"><span class="em">${r.icon}</span><span class="grow"><b>${esc(r.title)}</b><span>${esc(r.sub)}</span></span><span class="go">›</span></button>`).join('')
            : `<div class="empty"><b>Nothing found</b>Try a subject, a tool name, or a class like “ece 5”.</div>`;
    }
    function setClass(branch, sem) {
        set('class', { branch, sem }); set('classAsked', true);
        set('sgpa', null);   // SGPA rows follow the class subjects
        location.reload();
    }

    // ---------- PLAN ----------
    R.plan = function () {
        const total = S.tasks.length, done = S.tasks.filter(t => t.done).length;
        const pct = total ? Math.round(done / total * 100) : 0;
        let list = S.tasks.slice();
        if (ui.planFilter === 'todo') list = list.filter(t => !t.done);
        if (ui.planFilter === 'done') list = list.filter(t => t.done);
        list.sort((a, b) => (a.done - b.done) || ((a.date || '9999').localeCompare(b.date || '9999')));
        const rank = { High: 'high', Medium: '', Low: 'low' };
        $('#page-plan').innerHTML = `<h1 class="ptitle">Plan</h1>
            <div class="plan-head"><div class="donut" style="--p:${pct}"><span>${pct}%</span></div>
                <div><h2>${total ? `${done} of ${total} done` : 'A clear list'}</h2><p class="muted">${total ? (done === total ? 'Everything is ticked. Nice work.' : `${total - done} left to go.`) : 'Add your first task to get started.'}</p></div></div>
            <div class="chips">${[['all', 'All'], ['todo', 'To do'], ['done', 'Done']].map(([id, l]) => `<button class="chip ${ui.planFilter === id ? 'on' : ''}" data-act="plan-filter" data-f="${id}">${l}</button>`).join('')}</div>
            ${list.length ? `<ul class="tasks">${list.map(t => {
                const due = dueInfo(t.date);
                return `<li class="task ${t.done ? 'done' : ''}">
                    <button class="check" data-act="toggle" data-id="${t.id}" aria-label="${t.done ? 'Mark as not done' : 'Mark as done'}">✓</button>
                    <div class="task-body"><div class="task-title">${esc(t.title)}</div>
                        <div class="task-meta"><span class="pill">${esc(t.subject)}</span><span class="pill ${rank[t.priority] || ''}">${esc(t.priority)}</span>${due ? `<span class="${due.late && !t.done ? 'pill late' : ''}">${due.text}</span>` : ''}</div></div>
                    <button class="del" data-act="del-task" data-id="${t.id}" aria-label="Delete task">✕</button></li>`;
            }).join('')}</ul>`
                : `<div class="sheet-paper empty" style="margin-top:12px"><b>${total ? 'Nothing in this list' : 'No tasks yet'}</b>${total ? 'Try another filter.' : 'Tap Add task to plan your first assignment or revision.'}</div>`}
            <button class="fab" data-act="add-task"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add task</button>`;
    };

    // ---------- ME ----------
    // ---------- install as app ----------
    let installEvt = null;
    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
    window.addEventListener('appinstalled', () => { installEvt = null; toast('ElevenNotes is installed on your home screen.', 'win', 'Installed'); closeSheet(); });
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
    function installApp() {
        if (installEvt) { const e = installEvt; installEvt = null; e.prompt(); return; }
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        openSheet('Add to home screen', `<ol class="steps">${ios
            ? '<li>Tap the <b>Share</b> button in Safari.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. ElevenNotes opens like an app.</li>'
            : '<li>Tap the <b>⋮ menu</b> in your browser.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Tap <b>Install</b>. ElevenNotes opens like an app.</li>'}</ol>
            <p class="fine">It opens full screen, loads fast and still works without internet for your timetable and tasks.</p>`);
    }
    function settingsSheet() {
        openSheet('Settings', `<div class="flat">
            <button data-act="pick-class"><span class="em">🎓</span><span class="grow"><b>My class</b><span>${esc(clsLabel())}</span></span><span class="go">›</span></button>
            <button data-act="theme"><span class="em">🌙</span><span class="grow"><b>Dark mode</b><span>Easier on the eyes at night</span></span><span class="switch ${document.documentElement.dataset.theme === 'dark' ? 'on' : ''}"></span></button>
            <button data-act="feedback"><span class="em">💬</span><span class="grow"><b>Send feedback</b><span>Suggest a feature or report a bug</span></span><span class="go">›</span></button>
            ${isStandalone() ? '' : '<button data-act="install"><span class="em">📲</span><span class="grow"><b>Install app</b><span>Only 0.6 MB. Opens like an app</span></span><span class="go">›</span></button>'}
            <button data-act="pro"><span class="em">✨</span><span class="grow"><b>ElevenNotes Pro</b><span>Plan, revise, own your progress</span></span><span class="go">›</span></button>
            <button data-act="about-dev"><span class="em">👨‍💻</span><span class="grow"><b>About the developer</b><span>Meet Viresh</span></span><span class="go">›</span></button>
            <button data-act="reset"><span class="em">🗑️</span><span class="grow"><b class="danger-text">Reset my data</b><span>Clears everything saved in this browser</span></span></button>
        </div>`);
    }
    R.me = function () {
        const p = S.profile, s = derived(), d = today();
        const ringPct = 20 + Math.round(CHALLENGES.reduce((n, c) => n + Math.min(c.val(d), c.goal) / c.goal, 0) / CHALLENGES.length * 80);
        const pend = S.tasks.filter(t => !t.done).sort((x, y) => (x.date || '9').localeCompare(y.date || '9'));
        $('#page-me').innerHTML = `
            <div class="me-top"><h1>Profile</h1><button class="icon-btn" data-act="settings" aria-label="Settings"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div>
            <div class="me-head">
                <button class="avatar-ring" style="--p:${ringPct}" data-act="avatar" aria-label="Change profile picture"><img src="${esc(p.avatar)}" alt="" /></button>
                <div><div class="me-name">${esc(p.name)}</div>${p.usn ? `<span class="usn-pill">${esc(p.usn)}</span>` : `<button class="usn-pill" data-act="edit-profile">Add your USN</button>`}</div>
            </div>
            <p class="bio">${esc(p.bio)}</p>
            <div class="me-actions"><button class="btn ghost small" data-act="edit-profile">Edit profile</button><button class="btn ghost small" data-act="avatar">Change picture</button></div>

            <div class="stats4">
                <div><b>${Math.max(s.streak, 1)}</b><span>day streak</span></div>
                <div><b>${s.tasksDone}</b><span>tasks done</span></div>
                <div><b>${s.focusMinutes}</b><span>focus min</span></div>
                <div><b>${s.notesAdded}</b><span>notes shared</span></div>
            </div>

            <h2 class="sec-title">My class</h2>
            <div class="flat"><button data-act="pick-class"><span class="em">🎓</span><span class="grow"><b>${esc(clsLabel())}</b><span>Tap to change branch or semester</span></span><span class="go">›</span></button></div>

            <h2 class="sec-title">Today's goals</h2>
            <div class="flat">${CHALLENGES.map(c => {
                const v = Math.min(c.val(d), c.goal), done = v >= c.goal;
                return `<div class="challenge ${done ? 'done' : ''}"><span class="em">${done ? '✅' : c.icon}</span><div class="grow"><b>${c.text}</b><div class="bar"><i style="width:${v / c.goal * 100}%"></i></div></div><span class="xp">${done ? 'Done' : v + '/' + c.goal}</span></div>`;
            }).join('')}</div>

            <h2 class="sec-title">Pending tasks</h2>
            ${pend.length ? `<div class="flat">${pend.slice(0, 3).map(t => `<button data-act="nav" data-to="plan"><span class="em">📋</span><span class="grow"><b>${esc(t.title)}</b><span>${t.date ? esc(dueInfo(t.date).text) : 'No due date'}</span></span><span class="go">›</span></button>`).join('')}</div>`
                : `<div class="sheet-paper empty"><b>Nothing pending</b>Add a task in the Plan tab.</div>`}`;
    };

    // ---------- FACULTY ----------
    function starsHtml(name) {
        const r = S.ratings[name] || 0;
        return `<span class="stars" data-for="${esc(name)}">${[1, 2, 3, 4, 5].map(v => `<button class="${v <= r ? 'on' : ''}" data-act="rate" data-name="${esc(name)}" data-v="${v}" aria-label="Rate ${v} of 5">★</button>`).join('')}</span>`;
    }
    R.faculty = function () {
        $('#page-faculty').innerHTML = `<div class="subhead"><button class="icon-btn" data-act="back" aria-label="Go back"><svg class="i" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button><h1>Faculty</h1></div>
            <p class="muted" style="margin:-6px 2px 12px">Your ratings stay private on this device.</p>
            ${!FACULTY.length ? `<div class="sheet-paper empty"><b>Faculty not added yet</b>Faculty for ${esc(clsLabel())} will appear here once the class is added.</div>` : ''}
            <div class="flat">${FACULTY.map(f => `<div class="fac"><span class="em" style="font-size:30px">${f.emoji}</span><div class="grow"><b>${esc(f.name)}</b><span class="s">${esc(f.subject)}${f.dept ? ' · ' + esc(f.dept) : ''}</span></div>${starsHtml(f.name)}</div>`).join('')}</div>`;
    };

    // ---------- EVENTS ----------
    R.events = function () {
        $('#page-events').innerHTML = `<div class="subhead"><button class="icon-btn" data-act="back" aria-label="Go back"><svg class="i" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button><h1>Events</h1></div>
            <div class="sheet-paper soon"><span class="soon-tag">Coming soon</span><h2>Events are on the way</h2><p>College fests, workshops and activities will appear here. Check back soon.</p></div>`;
    };

    // ---------- COMMUNITY ----------
    R.community = function () {
        $('#page-community').innerHTML = `<div class="subhead"><button class="icon-btn" data-act="back" aria-label="Go back"><svg class="i" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button><h1>Community</h1></div>
            <div class="wa"><span class="badge-un">Unofficial</span><h2>RYMEC Student Community</h2>
                <p>A student-run WhatsApp group for discussions, opportunities, academics and hackathons.</p>
                <a href="https://chat.whatsapp.com/KBKiFgUl8qg9V8QRRrGOhE" target="_blank" rel="noopener noreferrer">Join on WhatsApp</a></div>
            <h2 class="sec-title">Study circles</h2>
            <div class="flat" style="margin-top:0">${STUDY_CIRCLES.map(c => `<div class="row"><span class="em">${c.emoji}</span><span class="grow"><b>${esc(c.name)}</b><span>${esc(c.topic)}</span></span>
                <button class="btn small ${S.circles[c.id] ? 'ghost' : 'primary'}" data-act="circle" data-id="${c.id}">${S.circles[c.id] ? 'Joined' : 'Join'}</button></div>`).join('')}</div>
            <p class="fine">Study circles are a personal checklist on this device. Use the WhatsApp community to meet other students.</p>`;
    };

    // ============================================================
    //  ROUTER
    // ============================================================
    const PAGES = ['home', 'study', 'plan', 'tools', 'me', 'faculty', 'events', 'community'];
    const NAV_OF = { faculty: 'home', events: 'home', community: 'home' };
    let current = 'home';

    let routedHash = null;
    function route() {
        routedHash = location.hash;
        let p = (location.hash || '#home').slice(1);
        if (!PAGES.includes(p)) p = 'home';
        current = p;
        closeSheet();
        $$('.page').forEach(el => el.classList.toggle('on', el.dataset.page === p));
        $$('.dock a').forEach(a => a.classList.toggle('on', a.dataset.nav === (NAV_OF[p] || p)));
        document.body.dataset.view = p;
        renderCurrent();
        window.scrollTo(0, 0);
    }
    function renderCurrent() { if (R[current]) R[current](); }
    function go(p) { location.hash = '#' + p; route(); }

    // ============================================================
    //  TOOLS
    // ============================================================
    function showTool(tab) {
        $$('#toolTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
        $$('.tool').forEach(t => t.classList.toggle('on', t.id === 'tool-' + tab));
        if (tab === 'count') renderCountdown();
        if (tab === 'att') calcWhatIf(false);
        if (tab === 'sgpa') calcSgpa(false);
        if (tab === 'focus') timerUI();
    }

    // ----- SGPA -----
    function sgpaRows() {
        if (!S.sgpa) S.sgpa = SUBJECTS.map(s => ({ name: s.name, credits: s.credits, marks: '' }));
        return S.sgpa;
    }
    function renderSgpaRows() {
        $('#sgpaRows').innerHTML = sgpaRows().map((r, i) => `<div class="sgpa-row">
            <input data-f="name" data-i="${i}" value="${esc(r.name)}" aria-label="Subject name" placeholder="Subject" />
            <input data-f="credits" data-i="${i}" type="number" inputmode="decimal" min="0" max="10" value="${esc(r.credits)}" aria-label="Credits" />
            <input data-f="marks" data-i="${i}" type="number" inputmode="decimal" min="0" max="100" value="${esc(r.marks)}" placeholder="/100" aria-label="Marks out of 100" />
            <button class="rm" data-act="sgpa-rm" data-i="${i}" aria-label="Remove subject">✕</button></div>`).join('');
        calcSgpa(false);
    }
    function gradeOf(m) { return GRADES.find(g => m >= g.min); }
    function calcSgpa(userInput) {
        let cr = 0, pts = 0, n = 0;
        sgpaRows().forEach(r => {
            const m = parseFloat(r.marks), c = parseFloat(r.credits);
            if (isNaN(m) || isNaN(c) || c <= 0 || m < 0 || m > 100) return;
            cr += c; pts += c * gradeOf(m).p; n++;
        });
        $('#sgpaVal').textContent = n ? (pts / cr).toFixed(2) : '--';
        $('#sgpaNote').textContent = n ? `${cr} credits across ${n} subject${n > 1 ? 's' : ''}` : 'Add marks to see your SGPA';
        if (n && userInput && !S.stats.sgpaUsed) { S.stats.sgpaUsed = true; save('stats'); checkProgress(); }
    }

    // ----- attendance planner -----
    function calcWhatIf(userInput) {
        const v = id => parseFloat($('#' + id).value);
        const held = v('wiHeld'), att = v('wiAtt'), target = v('wiTarget'), future = v('wiFuture');
        const big = $('#wiVal'), note = $('#wiNote');
        if ([held, att, target, future].some(isNaN) || held < 0 || att < 0 || future < 0 || target <= 0 || target > 100) { big.textContent = '--'; note.textContent = 'Fill in all four boxes with valid numbers.'; return; }
        if (att > held) { big.textContent = '--'; note.textContent = 'Classes attended cannot be more than classes held.'; return; }
        const cur = held ? att / held * 100 : 0, total = held + future;
        const need = Math.max(0, Math.ceil(target / 100 * total - att - 1e-9));
        if (need > future) {
            big.textContent = '😬';
            note.textContent = `Even if you attend all ${future} remaining classes you will reach ${total ? ((att + future) / total * 100).toFixed(1) : 0}%, below your ${target}% target. You are at ${cur.toFixed(1)}% now.`;
        } else {
            const skip = future - need;
            big.textContent = skip;
            note.textContent = skip === future && future > 0 ? `You can miss all ${future} remaining classes and still stay at ${target}% or more. You are at ${cur.toFixed(1)}% now.`
                : skip === 0 ? `Attend every one of the next ${future} classes to reach ${target}%. You are at ${cur.toFixed(1)}% now.`
                : `You can miss up to ${skip} of the next ${future} classes and still finish at ${target}% or more. You are at ${cur.toFixed(1)}% now.`;
        }
        if (userInput && !S.stats.whatifUsed) { S.stats.whatifUsed = true; save('stats'); checkProgress(); }
    }

    // ----- countdown -----
    function renderCountdown() {
        const list = examList();
        if (list.length && !list.find(e => e.id === ui.exam)) ui.exam = list[0].id;
        $('#cdChips').innerHTML = list.map(e => `<button class="chip ${e.id === ui.exam ? 'on' : ''}" data-act="cd-pick" data-id="${esc(e.id)}">${esc(e.name)}${e.custom ? ` <span class="x" data-act="cd-rm" data-id="${esc(e.id)}" role="button" aria-label="Remove ${esc(e.name)}">✕</span>` : ''}</button>`).join('');
        tickCountdown();
    }
    function tickCountdown() {
        if (current !== 'tools') return;
        const e = examList().find(x => x.id === ui.exam);
        if (!e) { $('#cdName').textContent = 'Add a date to count down to'; ['D', 'H', 'M', 'S'].forEach(k => { $('#cd' + k).textContent = '00'; }); return; }
        $('#cdName').textContent = 'Countdown to ' + e.name;
        let diff = Math.max(new Date(e.date + 'T00:00:00') - Date.now(), 0);
        const d = Math.floor(diff / 864e5); diff -= d * 864e5;
        const h = Math.floor(diff / 36e5); diff -= h * 36e5;
        const m = Math.floor(diff / 6e4); diff -= m * 6e4;
        $('#cdD').textContent = pad(d); $('#cdH').textContent = pad(h); $('#cdM').textContent = pad(m); $('#cdS').textContent = pad(Math.floor(diff / 1000));
    }

    // ----- focus timer -----
    const C_RING = 552.92;
    const T = { mode: 'focus', running: false, endAt: 0, left: 0, total: 0, id: null };
    const modeSecs = m => m === 'focus' ? S.focusMin * 60 : m === 'short' ? 300 : 900;
    function timerReset(mode) {
        clearInterval(T.id); T.running = false;
        T.mode = mode || T.mode; T.total = T.left = modeSecs(T.mode);
        timerUI();
    }
    function timerUI() {
        const left = T.running ? Math.max(0, Math.round((T.endAt - Date.now()) / 1000)) : T.left;
        $('#tClock').textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
        $('#ringFg').style.strokeDashoffset = C_RING * (1 - (T.total ? left / T.total : 1));
        $('.ring').classList.toggle('brk', T.mode !== 'focus');
        $('#tLabel').textContent = T.running ? (T.mode === 'focus' ? 'Stay with it' : 'Take a breather') : (left < T.total ? 'Paused' : (T.mode === 'focus' ? 'Ready to focus' : 'Break time'));
        $('#tGo').textContent = T.running ? 'Pause' : (left < T.total ? 'Resume' : 'Start');
        $$('#modeTabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === T.mode));
        $$('#lenChips .chip').forEach(b => b.classList.toggle('on', +b.dataset.min === S.focusMin));
        $('#lenChips').style.display = T.mode === 'focus' ? '' : 'none';
        $('#tToday').textContent = today().focusSessions;
        $('#tTotal').textContent = S.stats.focusMinutes;
    }
    function timerToggle() {
        if (T.running) { T.left = Math.max(0, Math.round((T.endAt - Date.now()) / 1000)); clearInterval(T.id); T.running = false; }
        else { T.running = true; T.endAt = Date.now() + T.left * 1000; T.id = setInterval(timerTick, 250); }
        timerUI();
    }
    function timerTick() {
        timerUI();
        if (Date.now() >= T.endAt) timerDone();
    }
    function beep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.12; o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 350);
        } catch (e) { /* sound not available */ }
    }
    function timerDone() {
        const wasFocus = T.mode === 'focus';
        clearInterval(T.id); T.running = false;
        beep();
        S.sessions.unshift({ type: T.mode, min: Math.round(T.total / 60), at: Date.now() });
        S.sessions = S.sessions.slice(0, 30); save('sessions');
        if (wasFocus) { S.stats.focusSessions++; S.stats.focusMinutes += Math.round(T.total / 60); today().focusSessions++; save('stats'); save('daily'); }
        timerReset(wasFocus ? 'short' : 'focus');
        toast(wasFocus ? 'Time for a short break.' : 'Ready for the next focus session.', '', wasFocus ? 'Focus session complete' : 'Break over');
        if (wasFocus) checkProgress();
    }

    // ============================================================
    //  SHEETS (forms)
    // ============================================================
    const subjectOptions = sel => ['General'].concat(SUBJECTS.map(s => s.id)).map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${id === 'General' ? 'General' : id + ' · ' + SUB[id].name}</option>`).join('');

    function taskSheet(subject) {
        openSheet('Add a task', `<form data-form="task">
            <label>What needs doing?<input name="title" maxlength="80" required placeholder="e.g. Submit Java assignment" /></label>
            <label>Subject<select name="subject">${subjectOptions(subject || 'General')}</select></label>
            <label>Priority</label>
            <div class="prio">${['High', 'Medium', 'Low'].map(p => `<label class="chip ${p === 'Medium' ? 'on' : ''}" style="margin:0"><input type="radio" name="priority" value="${p}" ${p === 'Medium' ? 'checked' : ''} style="display:none" />${p}</label>`).join('')}</div>
            <label>Due date <span class="opt">(optional)</span><input type="date" name="date" /></label>
            <button class="btn primary block" type="submit">Save task</button></form>`);
    }
    function profileSheet() {
        const p = S.profile;
        openSheet('Edit profile', `<form data-form="profile">
            <label>Name<input name="name" maxlength="40" required value="${esc(p.name === 'Student' ? '' : p.name)}" placeholder="Your name" /></label>
            <label>USN <span class="opt">(optional)</span><input name="usn" maxlength="20" value="${esc(p.usn)}" placeholder="e.g. 3VC25CS000" autocapitalize="characters" /></label>
            <label>Bio<textarea name="bio" rows="3" maxlength="120" placeholder="A line about you">${esc(p.bio)}</textarea></label>
            <button class="btn primary block" type="submit">Save profile</button></form>`);
    }
    function avatarSheet() {
        const list = ['boy-1', 'boy-2', 'boy-3', 'girl-1', 'girl-2', 'girl-3'].map(n => `images/avatar-${n}.jpeg`);
        openSheet('Choose a picture', `<div class="avatars">${list.map(src => `<button class="${S.profile.avatar === src ? 'on' : ''}" data-act="pick-avatar" data-src="${src}" aria-label="Choose this avatar"><img src="${src}" alt="" /></button>`).join('')}</div>`);
    }
    function proSheet() {
        openSheet('ElevenNotes Pro', `<p class="muted">Plan. Revise. Own it.</p>
            <div class="pro-list"><div><b>P</b><span><strong>Plan</strong><br>Organise your studies, tasks and goals.</span></div>
            <div><b>R</b><span><strong>Revise</strong><br>Review and track your progress.</span></div>
            <div><b>O</b><span><strong>Own it</strong><br>Take control of your student journey.</span></div></div>
            <p><strong>Pro is not a paid plan.</strong> It is free for every student.</p>
            <button class="btn primary block" data-act="close-sheet">Got it</button>`);
    }
    function feedbackSheet() {
        openSheet('Send feedback', `<p>Found a bug, or want a new feature? Tell us in a short form. It opens in a new tab.</p>
            <a class="btn primary block" href="https://forms.gle/qynARnBJsS2odeTd8" target="_blank" rel="noopener noreferrer">Open the feedback form</a>`);
    }
    function subjectSheet(id) {
        const s = SUB[id];
        const nTasks = S.tasks.filter(t => t.subject === id && !t.done).length;
        openSheet(s.id, `<p><b>${esc(s.name)}</b><br><span class="muted">${esc(s.code)}</span></p>
            <p class="muted" style="margin-bottom:4px">Taught by ${esc(s.faculty)}</p>${starsHtml(s.faculty)}
            <p class="muted" style="margin-top:12px">${nTasks} open task${nTasks === 1 ? '' : 's'}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="note-for" data-id="${id}">Upload notes</button><button class="btn ghost" data-act="task-for" data-id="${id}">Add a task</button></div>`);
    }
    function examSheet() {
        openSheet('Add your own date', `<form data-form="exam">
            <label>Name<input name="name" maxlength="30" required placeholder="e.g. Lab internal" /></label>
            <label>Date<input type="date" name="date" required /></label>
            <button class="btn primary block" type="submit">Save date</button></form>`);
    }

    const FORMS = {
        async share(f) {
            const title = f.title.value.trim(), url = f.url.value.trim(), pin = f.pin.value.trim();
            if (title.length < 2) { formError(f, 'Please add a title.'); return; }
            if (!f.subject.value.trim()) { formError(f, 'Please type the subject name.'); return; }
            if (!DRIVE_RE.test(url)) { formError(f, 'Please paste a Google Drive or Google Docs link.'); return; }
            if (!/^[0-9]{6}$/.test(pin)) { formError(f, 'The PIN must be exactly 6 digits.'); return; }
            const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Uploading…';
            const d = { title, url, pin, subject: f.subject.value.trim(), uploader: f.uploader.value.trim() || 'Student', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
            try {
                const id = await rpc('add_resource', { p_class: f.branch.value + '-' + f.sem.value, p_title: d.title, p_subject: d.subject, p_url: d.url, p_uploader: d.uploader, p_pin: pin });
                const mine = get('mineLib', []); mine.push(id); set('mineLib', mine.slice(-100));
                ui.lib.loaded = false; ui.lib.items = [];
                ui.fBranch = f.branch.value; ui.fSem = f.sem.value;
                bump('notesAdded', 1, 'added');
                closeSheet(); receiptSheet(d); loadLibrary();
            } catch (e) { btn.disabled = false; btn.textContent = 'Upload'; formError(f, 'Could not upload. Check your internet connection and try again.'); }
        },
        async unshare(f) {
            const id = f.id.value, pin = f.pin.value.trim();
            if (!/^[0-9]{6}$/.test(pin)) { formError(f, 'The PIN must be exactly 6 digits.'); return; }
            const btn = f.querySelector('[type=submit]'); btn.disabled = true;
            try {
                const r = await rpc('delete_resource', { p_id: id, p_pin: pin });
                if (r === 'ok' || r === 'missing') { ui.lib.items = ui.lib.items.filter(i => i.id !== id); closeSheet(); renderCurrent(); }
                else if (r === 'locked') { btn.disabled = false; formError(f, 'Too many wrong attempts. Try again in 15 minutes.'); }
                else { btn.disabled = false; f.pin.value = ''; f.pin.focus(); formError(f, 'That PIN is not correct.'); }
            } catch (e) { btn.disabled = false; formError(f, 'Could not delete. Check your internet connection and try again.'); }
        },
        task(f) {
            const title = f.title.value.trim(); if (!title) return;
            S.tasks.unshift({ id: uid(), title, subject: f.subject.value, priority: f.priority.value, date: f.date.value || '', done: false, counted: false });
            save('tasks'); bump('tasksDone', 0, 'added');
            closeSheet(); renderCurrent();
        },
        profile(f) {
            const name = f.name.value.trim(); if (!name) return;
            S.profile.name = name; S.profile.usn = f.usn.value.trim().toUpperCase(); S.profile.bio = f.bio.value.trim() || defaultProfile.bio;
            save('profile'); checkProgress();
            closeSheet(); renderCurrent();
        },
        exam(f) {
            const name = f.name.value.trim(); if (!name || !f.date.value) return;
            const id = 'c' + uid(); S.customExams.push({ id, name, date: f.date.value, custom: true });
            save('customExams'); ui.exam = id; closeSheet(); renderCountdown();
        }
    };

    // ============================================================
    //  ACTIONS
    // ============================================================
    const A = {
        theme() {
            const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = next; set('theme', next);
            if (next === 'dark' && !S.stats.darkTried) { S.stats.darkTried = true; save('stats'); checkProgress(); }
            const sw = $('#sheetBody .switch'); if (sw) sw.classList.toggle('on', next === 'dark');
        },
        settings: settingsSheet,
        install: installApp,
        'install-dismiss'() { set('installDismiss', true); renderCurrent(); },
        'about-dev'() { closeSheet(); openDev(); },
        'close-dev': closeDev,
        pro: proSheet, feedback: feedbackSheet, avatar: avatarSheet, 'edit-profile': profileSheet,
        'close-sheet': closeSheet,
        back() { if (history.length > 1) history.back(); else go('home'); },
        nav(t) { go(t.dataset.to); },
        tool(t) {
            go('tools'); showTool(t.dataset.tab);
            if (t.dataset.exam) { ui.exam = t.dataset.exam; renderCountdown(); }
        },
        tooltab(t) { showTool(t.dataset.tab); },
        'study-tab'(t) { ui.studyTab = t.dataset.tab; if (current !== 'study') go('study'); else renderCurrent(); },
        day(t) { ui.day = +t.dataset.d; renderCurrent(); },
        subject(t) { subjectSheet(t.dataset.id); },
        'note-for'(t) { if (libOn()) libAddSheet(t.dataset.id); else toast('Notes sharing is not switched on yet.', 'err'); },
        'task-for'(t) { taskSheet(t.dataset.id); },
        search: searchSheet,
        'srch-go'(t) { const r = ui.sRes[+t.dataset.i]; if (!r) return; closeSheet(); r.run(); },
        'pick-class': pickerSheet,
        'pick-b'(t) { pick.b = t.dataset.id; pickerRefresh(); },
        'pick-s'(t) { pick.s = +t.dataset.n; pickerRefresh(); },
        'pick-save'() { if (pick.b === CLS_BRANCH.id && pick.s === CLS.sem) { set('class', { branch: pick.b, sem: pick.s }); set('classAsked', true); closeSheet(); if (current === 'me') renderCurrent(); } else setClass(pick.b, pick.s); },
        'lib-add'() { libAddSheet(); },
        'lib-refresh'() { ui.lib.loaded = false; loadLibrary(); },
        'lib-del'(t) { libDelSheet(t.dataset.id); },
        'lib-menu'(t) {
            const n = ui.lib.items.find(x => x.id === t.dataset.id); if (!n) return;
            const rep = get('reportedLib', []).includes(n.id);
            openSheet(n.title, `<div class="flat menu-list">
                <button data-act="lib-share" data-id="${esc(n.id)}"><span class="em">🔗</span><span class="grow"><b>Share</b><span>Send this link to a friend</span></span></button>
                <button data-act="lib-del" data-id="${esc(n.id)}"><span class="em">🗑️</span><span class="grow"><b>Delete</b><span>Needs your 6-digit PIN</span></span></button>
                ${rep ? '<div class="menu-off"><span class="em">🚩</span><span class="grow"><b>Reported</b><span>Thanks, we will review it</span></span></div>' : `<button data-act="lib-report" data-id="${esc(n.id)}"><span class="em">🚩</span><span class="grow"><b>Report</b><span>Spam or not suitable</span></span></button>`}
            </div>`);
        },
        async 'lib-share'(t) {
            closeSheet();
            const n = ui.lib.items.find(x => x.id === t.dataset.id); if (!n) return;
            const site = location.origin + location.pathname.replace(/index\.html$/, '');
            const text = `${n.title} (${n.subject})\n${n.url}\n\nShared on ElevenNotes: ${site}`;
            if (navigator.share) {
                try { await navigator.share({ title: n.title, text }); return; }
                catch (e) { if (e && e.name === 'AbortError') return; }
            }
            let ok = false;
            try { await navigator.clipboard.writeText(text); ok = true; }
            catch (e) {
                const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
                try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove();
            }
            toast(ok ? 'Link copied. Paste it in any chat.' : 'Could not copy the link.', ok ? '' : 'err');
        },
        'lib-vote'(t) {
            const n = ui.lib.items.find(x => x.id === t.dataset.id); if (!n) return;
            n.voted = !n.voted; n.votes += n.voted ? 1 : -1; renderCurrent();
            rpc('vote_resource', { p_id: n.id, p_voter: voterId() }).catch(() => {
                n.voted = !n.voted; n.votes += n.voted ? 1 : -1; renderCurrent();
                toast('Could not save your vote. Please try again.', 'err');
            });
        },
        'lib-report'(t) {
            closeSheet();
            const rep = get('reportedLib', []);
            if (rep.includes(t.dataset.id)) return;
            if (!confirm('Report this link as spam or not suitable?')) return;
            rep.push(t.dataset.id); set('reportedLib', rep.slice(-200)); renderCurrent();
            rpc('report_resource', { p_id: t.dataset.id }).catch(() => {
                set('reportedLib', get('reportedLib', []).filter(x => x !== t.dataset.id)); renderCurrent();
                toast('Could not send the report. Please try again later.', 'err');
            });
        },
        'pin-gen'(t) { const i = t.closest('form').pin; i.value = randomPin(); i.focus(); },
        'add-task'() { taskSheet(); },
        'del-note'(t) { S.notes = S.notes.filter(n => n.id !== t.dataset.id); save('notes'); renderCurrent(); },
        'plan-filter'(t) { ui.planFilter = t.dataset.f; renderCurrent(); },
        toggle(t) {
            const task = S.tasks.find(x => x.id === t.dataset.id); if (!task) return;
            task.done = !task.done; save('tasks');
            if (task.done && !task.counted) { task.counted = true; save('tasks'); bump('tasksDone', 1, 'tasksDone'); }
            renderCurrent();
        },
        'del-task'(t) { S.tasks = S.tasks.filter(x => x.id !== t.dataset.id); save('tasks'); renderCurrent(); },
        'pick-avatar'(t) { S.profile.avatar = t.dataset.src; save('profile'); closeSheet(); renderCurrent(); },
        badge(t) {
            const b = BADGES.find(x => x.id === t.dataset.id), got = b.val(derived()) >= b.goal;
            toast(got ? 'You have earned this badge.' : b.how, '', b.name);
        },
        rate(t) {
            const name = t.dataset.name, v = +t.dataset.v;
            S.ratings[name] = S.ratings[name] === v ? 0 : v; save('ratings');
            $$(`.stars[data-for="${CSS.escape(name)}"] button`).forEach((b, i) => b.classList.toggle('on', i < S.ratings[name]));
            checkProgress();
        },
        circle(t) {
            const id = t.dataset.id; S.circles[id] = !S.circles[id]; save('circles'); checkProgress(); renderCurrent();
        },
        'sgpa-add'() { sgpaRows().push({ name: '', credits: 3, marks: '' }); save('sgpa'); renderSgpaRows(); },
        'sgpa-rm'(t) { sgpaRows().splice(+t.dataset.i, 1); save('sgpa'); renderSgpaRows(); },
        'cd-pick'(t) { ui.exam = t.dataset.id; renderCountdown(); },
        'cd-add': examSheet,
        'cd-rm'(t, e) {
            e.stopPropagation();
            S.customExams = S.customExams.filter(x => x.id !== t.dataset.id); save('customExams');
            if (ui.exam === t.dataset.id) ui.exam = (examList()[0] || {}).id; renderCountdown();
        },
        mode(t) { if (T.running && !confirm('The timer is running. Switch and reset it?')) return; timerReset(t.dataset.mode); },
        len(t) { if (T.running && !confirm('The timer is running. Change length and reset it?')) return; S.focusMin = +t.dataset.min; set('focusMin', S.focusMin); timerReset('focus'); },
        't-toggle': timerToggle,
        't-reset'() { timerReset(); },
        't-skip'() { timerReset(T.mode === 'focus' ? 'short' : 'focus'); },
        music() {
            const c = $('#pcard'), a = $('#lofi');
            if (c.hidden) { c.hidden = false; if (a.paused) a.play().catch(() => toast('Could not play the music.', 'err')); }
            else c.hidden = true;
        },
        'player-hide'() { $('#pcard').hidden = true; },
        'play-toggle'() { const a = $('#lofi'); if (a.paused) a.play().catch(() => toast('Could not play the music.', 'err')); else a.pause(); },
        reset() {
            if (!confirm('Reset everything saved in this browser? Your tasks, notes, ratings and progress will be removed.')) return;
            try { Object.keys(localStorage).filter(k => k.indexOf(KEY) === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
            location.hash = '#home'; location.reload();
        }
    };

    document.addEventListener('click', e => {
        const t = e.target.closest('[data-act]');
        if (!t) return;
        const fn = A[t.dataset.act];
        if (fn) { fn(t, e); }
    });
    document.addEventListener('submit', e => {
        const f = e.target.closest('form[data-form]');
        if (!f) return;
        e.preventDefault();
        FORMS[f.dataset.form](f);
    });
    document.addEventListener('change', e => {
        if (e.target.name === 'priority') $$('.prio .chip').forEach(c => c.classList.toggle('on', c.contains(e.target) && e.target.checked));
    });
    document.addEventListener('input', e => {
        const el = e.target;
        const fe = el.closest && el.closest('form') && el.closest('form').querySelector('.form-err'); if (fe) fe.remove();
        if (el.id === 'srchInput') { runSearch(el.value); return; }
        if (el.id === 'libSearch') { filterLib(el.value); return; }
        if (el.closest('#sgpaRows')) { sgpaRows()[+el.dataset.i][el.dataset.f] = el.value; save('sgpa'); calcSgpa(true); }
        if (el.closest('#tool-att')) calcWhatIf(true);
    });
    document.addEventListener('change', e => {
        if (e.target.id === 'libBranch') { ui.fBranch = e.target.value; renderCurrent(); }
        else if (e.target.id === 'libSem') { ui.fSem = e.target.value; renderCurrent(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); closeDev(); } });
    window.addEventListener('hashchange', () => { if (location.hash !== routedHash) route(); });

    // ============================================================
    //  START
    // ============================================================
    const todayKey = dkey();
    if (!S.stats.visits.includes(todayKey)) { S.stats.visits.push(todayKey); S.stats.visits = S.stats.visits.slice(-400); save('stats'); }
    today();
    timerReset('focus');
    renderSgpaRows();
    setInterval(tickCountdown, 1000);
    setInterval(() => { if (current === 'home') R.home(); }, 60000);
    route();
    setTimeout(pingDevice, 1500);
    checkProgress();
    if (!get('classAsked', false)) setTimeout(() => { set('classAsked', true); pickerSheet(); }, 500);
})();
