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
    if (CLS.branch === 'ECE') CLS.branch = 'ECE-A';   // ECE was split into sections A and B
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
    const defaultProfile = { name: 'Student', usn: '', bio: 'CSE student. Building the future.', avatar: 'images/avatar-boy-1.jpeg' };
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
        sessions: get('sessions', []),
        att: get('att', {})
    };
    const ui = { lib: { items: [], loaded: false, loading: false, error: false }, libQ: '', fBranch: null, fSem: null, fKind: 'all', studyTab: 'subjects', attMode: 'track', attDay: 0, day: 0, planFilter: 'all', exam: 'last' };

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
        const first = S.profile.name.split(' ')[0].replace(/^(.)(.*)$/, (m, a, b) => a.toUpperCase() + b.toLowerCase());
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
            ${(q => `<div class="thought"><span>Quote of the day</span><p>${esc(q[0])}</p>${q[1] ? `<em>~ ${esc(q[1])}</em>` : ''}</div>`)(quoteOfDay())}
            <button class="class-pill" data-act="pick-class" aria-label="Change class">🎓 ${esc(clsLabel())} <span>Change</span></button>
            ${(isStandalone() || get('installDismiss', false)) ? '' : `<div class="install-card"><button class="install-main" data-act="install"><span class="install-ico">📲</span><span class="grow"><b>Install ElevenNotes</b><span>Only 0.6 MB. Add it to your home screen</span></span></button><button class="install-x" data-act="install-dismiss" aria-label="Hide">✕</button></div>`}
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
    //  Each upload gets a password (6 to 30 characters); only that password can edit or delete it.
    //  The PIN is hashed on the server and never stored in plain text.
    // ============================================================
    const CFG = window.ELEVEN_CONFIG || {};
    const libOn = () => !!(CFG.supabaseUrl && CFG.supabaseKey);
    const classKey = () => CLS_BRANCH.id + '-' + CLS.sem;
    // Notes are filtered by branch and semester. CSE A and CSE B are separate; the two AI & ML sections are merged into one.
    const NOTE_BRANCHES = [{ id: 'CSE-A', name: 'CSE – A' }, { id: 'CSE-B', name: 'CSE – B' }, { id: 'CSE-C', name: 'CSE – C' }, { id: 'AIML', name: 'CSE – AI & ML' }, { id: 'DS', name: 'CSE – Data Science & Cyber' }, { id: 'ISE', name: 'ISE' }, { id: 'ECE-A', name: 'ECE – A' }, { id: 'ECE-B', name: 'ECE – B' }, { id: 'EEE', name: 'EEE' }, { id: 'ME', name: 'Mechanical' }, { id: 'CIVIL', name: 'Civil' }];
    const groupOf = id => (id === 'AIML-A' || id === 'AIML-B') ? 'AIML' : id === 'ECE' ? 'ECE-A' : id;
    const parseKey = key => { const m = /^(.*)-(\d)$/.exec(key || ''); return m ? { group: groupOf(m[1]), sem: +m[2] } : { group: '', sem: 0 }; };
    const myGroup = () => groupOf(CLS_BRANCH.id);
    const fBranch = () => ui.fBranch == null ? 'all' : ui.fBranch;
    const fSem = () => ui.fSem == null ? 'all' : ui.fSem;
    const groupName = g => (NOTE_BRANCHES.find(b => b.id === g) || { name: g }).name;
    const NOTE_TYPES = [['Notes', 'Notes'], ['Question paper', 'Question papers'], ['Lab manual', 'Lab manuals'], ['Assignment', 'Assignments']];
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
            ui.lib.items = (items || []).map(n => Object.assign({ votes: 0, voted: false, kind: 'Notes' }, n))
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
        const shownItems = L.items.filter(n => { const k = parseKey(n.class_key); return (fb === 'all' || k.group === fb) && (fs === 'all' || String(k.sem) === fs) && (ui.fKind === 'all' || n.kind === ui.fKind); });
        let list;
        if (L.loading && !L.items.length) list = `<div class="sheet-paper empty"><b>Loading notes…</b></div>`;
        else if (L.error) list = `<div class="sheet-paper empty"><b>Could not load the notes</b>Check your internet and tap Refresh.</div>`;
        else if (!shownItems.length) list = `<div class="sheet-paper empty"><b>No notes here yet</b>${L.items.length ? 'Try another branch or semester above, or' : 'Be the first.'} Tap “Upload notes” to add a Google Drive link.</div>`;
        else list = `<div class="flat" id="libList">${shownItems.map(n => `
            <div class="note" data-hay="${esc(libItemHay(n))}" ${q && !libItemHay(n).includes(q) ? 'hidden' : ''}>
                <div class="note-top"><span class="note-chips"><span class="code-chip">${esc(n.subject)}</span>${n.kind && n.kind !== 'Notes' ? `<span class="kind-chip">${esc(n.kind)}</span>` : ''}</span><span class="date-sm">${esc(new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></div>
                <h3>${esc(n.title)}</h3><p>Shared by ${esc(n.uploader)} · ${esc(groupName(parseKey(n.class_key).group))}${parseKey(n.class_key).sem ? ' Sem ' + parseKey(n.class_key).sem : ''}${mine.includes(n.id) ? ' <span class="tag">You</span>' : ''}</p>
                <div class="note-actions">${L.votes ? `<button class="vote ${n.voted ? 'on' : ''}" data-act="lib-vote" data-id="${esc(n.id)}" aria-pressed="${n.voted}" aria-label="Like"><svg class="i" viewBox="0 0 24 24"><path d="M12 20.5s-8.5-5.2-8.5-11A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8.5 2.7c0 5.8-8.5 11-8.5 11z"/></svg><span>${n.votes}</span></button>` : ''}<a class="link-btn" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">Open link</a><button class="dots" data-act="lib-menu" data-id="${esc(n.id)}" aria-label="More options"><svg class="i" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></div>
            </div>`).join('')}</div><div class="empty" id="libNone" hidden><b>No match</b>Try a different subject or title.</div>`;
        return `<p class="fine" style="margin:0 0 12px">Notes shared by your classmates as Google Drive links. Anyone can upload. Only the person who uploaded can edit or delete it, using their password.</p>
            <div class="lib-actions"><button class="btn primary small" data-act="lib-add">Upload notes</button><button class="btn ghost small" data-act="lib-refresh">${L.loading ? 'Loading…' : 'Refresh'}</button></div>
            <div class="lib-filters">
                <label>Branch<select id="libBranch"><option value="all" ${fb === 'all' ? 'selected' : ''}>All branches</option>${NOTE_BRANCHES.map(b => `<option value="${b.id}" ${fb === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
                <label>Semester<select id="libSem"><option value="all" ${fs === 'all' ? 'selected' : ''}>All semesters</option>${SEMESTERS.map(n => `<option value="${n}" ${fs === String(n) ? 'selected' : ''}>Semester ${n}</option>`).join('')}</select></label>
            </div>
            <div class="chips" id="libKinds">${[['all', 'All']].concat(NOTE_TYPES).map(([v, t]) => `<button class="chip ${ui.fKind === v ? 'on' : ''}" data-act="lib-kind" data-k="${esc(v)}">${t}</button>`).join('')}</div>
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

    function randomPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', a = new Uint32Array(8); crypto.getRandomValues(a);
        const p = Array.from(a, n => chars[n % chars.length]).join('');
        return p.slice(0, 4) + '-' + p.slice(4);
    }

    function libAddSheet(subject) {
        const ub = fBranch() === 'all' ? myGroup() : fBranch(), us = fSem() === 'all' ? String(CLS.sem) : fSem();
        openSheet('Upload notes', `<form data-form="share">
            <details class="howto" open><summary>How to get the Drive link</summary>
                <ol>
                    <li>Open your PDF in <b>Google Drive</b> and tap the <b>three dots</b> next to it.</li>
                    <li>Tap <b>Manage access</b>.</li>
                    <li>Under <b>General access</b>, tap <b>Change</b>.</li>
                    <li>Select <b>Anyone with the link</b> and tap <b>Save</b>.</li>
                    <li>Tap <b>Copy link</b> and paste it below.</li>
                </ol>
                <a href="images/drive-link-guide.jpg" target="_blank" rel="noopener"><img class="howto-img" src="images/drive-link-guide.jpg" alt="Step by step pictures: open the three dots, Manage access, Change, Anyone with the link, Save, Copy link" loading="lazy" /></a>
                <p>Tap the picture to see it full size. If this is skipped, other students will see "You need access" and cannot open your notes.</p>
            </details>
            <div class="two-col">
                <label>Branch<select name="branch">${NOTE_BRANCHES.map(b => `<option value="${b.id}" ${ub === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
                <label>Semester<select name="sem">${SEMESTERS.map(n => `<option value="${n}" ${us === String(n) ? 'selected' : ''}>Semester ${n}</option>`).join('')}</select></label>
            </div>
            <label>Type<select name="kind">${NOTE_TYPES.map(([v, t]) => `<option value="${v}" ${v === (ui.fKind !== 'all' ? ui.fKind : 'Notes') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <label>Subject name<input name="subject" maxlength="20" required value="${esc(subject || '')}" placeholder="e.g. DSA, Maths, Java" autocapitalize="words" /></label>
            <label>Title<input name="title" maxlength="80" required placeholder="e.g. Unit 3 notes or 2023 question paper" /></label>
            <label>Google Drive link <span class="opt">(set to Anyone with the link)</span><input type="url" name="url" required placeholder="https://drive.google.com/..." /></label>
            <label>Your name <span class="opt">(shown to others)</span><input name="uploader" maxlength="30" value="${esc(S.profile.name)}" /></label>
            <label>Password <span class="opt">(6 to 30 characters, you need it to edit or delete)</span>
                <span class="pin-row"><input type="password" name="pin" minlength="6" maxlength="30" required placeholder="Choose a password" autocomplete="new-password" /><button type="button" class="btn ghost small" data-act="pin-show">Show</button></span></label>
            <button type="button" class="btn ghost small" data-act="pin-gen" style="margin:-4px 0 10px">Make one for me</button>
            <button class="btn primary block" type="submit">Upload</button></form>`);
    }

    function receiptSheet(d) {
        const text = `ElevenNotes notes link\nTitle: ${d.title}\nSubject: ${d.subject}\nLink: ${d.url}\nShared by: ${d.uploader}\nDate: ${d.date}\nPassword: ${d.pin}\n\nKeep this password safe. It is the only way to edit or delete this link, and it cannot be recovered.`;
        let copied = false;
        openSheet('Uploaded. Save your password', `<div class="ticket">
                <div class="ticket-row"><span>Title</span><b>${esc(d.title)}</b></div>
                <div class="ticket-row"><span>Subject</span><b>${esc(d.subject)}</b></div>
                <div class="ticket-row"><span>Link</span><b class="brk">${esc(d.url)}</b></div>
                <div class="ticket-row"><span>Shared by</span><b>${esc(d.uploader)}</b></div>
                <div class="ticket-row"><span>Date</span><b>${esc(d.date)}</b></div>
                <div class="ticket-pin"><span>Password</span><b>${esc(d.pin)}</b></div>
            </div>
            <p class="fine" style="margin-top:12px">Copy these details or take a screenshot. This password is shown only once and cannot be recovered. Without it, nobody (including you) can edit or delete this link.</p>
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
        sheetGuard = () => copied || confirm('Have you saved your password (' + d.pin + ')? It cannot be recovered. Close anyway?');
        // the "I have saved it" button counts as confirmation
        $('#sheetBody [data-act="close-sheet"]').addEventListener('click', () => { copied = true; }, true);
    }

    function libDelSheet(id) {
        const it = ui.lib.items.find(i => i.id === id); if (!it) return;
        openSheet('Delete this link', `<form data-form="unshare"><input type="hidden" name="id" value="${esc(id)}" />
            <p><b>${esc(it.title)}</b></p>
            <label>Enter the password you set when you shared it <span class="opt">(older notes: the 6-digit PIN)</span><input type="password" name="pin" maxlength="64" required placeholder="Password" autocomplete="off" /></label>
            <button class="btn danger block" type="submit">Delete</button></form>`);
    }

    function libEditSheet(id) {
        const it = ui.lib.items.find(i => i.id === id); if (!it) return;
        openSheet('Edit details', `<form data-form="edit-note"><input type="hidden" name="id" value="${esc(id)}" />
            <label>Subject name<input name="subject" maxlength="20" required value="${esc(it.subject)}" autocapitalize="words" /></label>
            <label>Title<input name="title" maxlength="80" required value="${esc(it.title)}" /></label>
            <label>Google Drive link <span class="opt">(set to Anyone with the link)</span><input type="url" name="url" required value="${esc(it.url)}" /></label>
            <label>Your password <span class="opt">(older notes: the 6-digit PIN)</span><input type="password" name="pin" maxlength="64" required placeholder="Password" autocomplete="off" /></label>
            <button class="btn primary block" type="submit">Save changes</button></form>`);
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

    // ---------- side menu ----------
    const MENU_ICONS = {
        home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
        book: '<path d="M3 5h7a3 3 0 0 1 2 1v14a3 3 0 0 0-2-1H3z"/><path d="M21 5h-7a3 3 0 0 0-2 1v14a3 3 0 0 1 2-1h7z"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
        check: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12l3 3 5-6"/>',
        calc: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',
        pct: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
        hourglass: '<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4"/>',
        timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
        chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
        install: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
        code: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>'
    };
    function menuItems() {
        const t = ui.studyTab;
        return [
            ['Main', [['home', 'Home', 'home', current === 'home']]],
            ['Study', [['study:subjects', 'Subjects', 'book', current === 'study' && t === 'subjects'], ['study:timetable', 'Timetable', 'clock', current === 'study' && t === 'timetable'], ['study:library', 'Notes library', 'note', current === 'study' && t === 'library']]],
            ['Plan', [['plan', 'Tasks and planner', 'check', current === 'plan']]],
            ['Tools', [['tool:sgpa', 'SGPA calculator', 'calc', false], ['tool:att', 'Attendance tracker', 'pct', false], ['tool:count', 'Exam countdown', 'hourglass', false], ['tool:focus', 'Focus timer', 'timer', false]]],
            ['Me', [['me', 'Profile', 'user', current === 'me'], ['settings', 'Settings', 'gear', false]]],
            ['Help', [['feedback', 'Send feedback', 'chat', false]].concat(isStandalone() ? [] : [['install', 'Install app', 'install', false]]).concat([['about', 'About the developer', 'code', false]])]
        ];
    }
    const QUOTES = [
        ["Imagination is more important than knowledge.", "Albert Einstein"],
        ["Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.", "A. P. J. Abdul Kalam"],
        ["Arise, awake, and stop not till the goal is reached.", "Swami Vivekananda"],
        ["Education is the most powerful weapon which you can use to change the world.", "Nelson Mandela"],
        ["The expert in anything was once a beginner.", "Helen Hayes"],
        ["Success is the sum of small efforts, repeated day in and day out.", "Robert Collier"],
        ["The only way to do great work is to love what you do.", "Steve Jobs"],
        ["It does not matter how slowly you go as long as you do not stop.", "Confucius"],
        ["The journey of a thousand miles begins with a single step.", "Lao Tzu"],
        ["An investment in knowledge pays the best interest.", "Benjamin Franklin"],
        ["Genius is one percent inspiration and ninety-nine percent perspiration.", "Thomas Edison"],
        ["Failure is simply the opportunity to begin again, this time more intelligently.", "Henry Ford"],
        ["You have to dream before your dreams can come true.", "A. P. J. Abdul Kalam"],
        ["We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant"],
        ["Live as if you were to die tomorrow. Learn as if you were to live forever.", "Mahatma Gandhi"],
        ["In the middle of difficulty lies opportunity.", "Albert Einstein"],
        ["Do what you can, with what you have, where you are.", "Theodore Roosevelt"],
        ["Patience and perseverance have a magical effect before which difficulties disappear.", "John Quincy Adams"],
        ["Don't watch the clock; do what it does. Keep going.", "Sam Levenson"],
        ["Learn from yesterday, live for today, hope for tomorrow.", "Albert Einstein"],
        ["Well done is better than well said.", "Benjamin Franklin"],
        ["Small deeds done are better than great deeds planned.", "Peter Marshall"],
        ["Courage is not the absence of fear, but the triumph over it.", "Nelson Mandela"],
        ["Whether you think you can or you think you can't, you're right.", "Henry Ford"],
        ["Believe you can and you're halfway there.", "Theodore Roosevelt"],
        ["You miss 100% of the shots you don't take.", "Wayne Gretzky"],
        ["The more that you read, the more things you will know.", "Dr. Seuss"],
        ["Your time is limited, so don't waste it living someone else's life.", "Steve Jobs"],
        ["Learning never exhausts the mind.", "Leonardo da Vinci"],
        ["Strength does not come from physical capacity. It comes from an indomitable will.", "Mahatma Gandhi"],
        ["Stay hungry, stay foolish.", "Steve Jobs"],
        ["Push yourself, because no one else is going to do it for you.", ""],
        ["Dream big. Start small. Act now.", ""],
        ["Study now, shine later.", ""],
        ["Don't stop when you're tired. Stop when you're done.", ""],
        ["Little by little, a little becomes a lot.", ""],
        ["Discipline is doing it even when you don't feel like it.", ""],
        ["Today's hard work is tomorrow's confidence.", ""],
        ["Great things never come from comfort zones.", ""],
        ["Be stronger than your excuses.", ""],
        ["Fall seven times, stand up eight.", ""],
        ["The harder you work, the luckier you get.", ""],
        ["Slow progress is still progress.", ""],
        ["Your only limit is you.", ""],
        ["Make today count.", ""],
        ["Doubt kills more dreams than failure ever will.", ""],
        ["Work hard in silence. Let success make the noise.", ""],
        ["If it was easy, everyone would do it.", ""],
        ["Start where you are. Use what you have. Do what you can.", ""],
        ["Every day is a new chance to get better.", ""],
        ["Don't wish for it. Work for it.", ""],
        ["Be so good that they can't ignore you.", ""],
        ["Where there is a will, there is a way.", ""],
        ["Practice makes progress.", ""],
        ["Winners keep trying after everyone else has quit.", ""],
        ["One more page, one more problem, one more step.", ""],
        ["Hard work beats talent when talent doesn't work hard.", ""],
        ["Believe in yourself and keep going.", ""],
        ["A clear mind starts with a clean plan.", ""],
        ["Stay patient. Good things take time.", ""],
        ["You are one revision away from clarity.", ""]
    ];
    const quoteOfDay = () => QUOTES[Math.floor((Date.now() + 198e5) / 864e5) % QUOTES.length];
    const DRAWER_LINES = ['Small steps every day add up.', 'Consistency beats cramming.', 'Plan the day. Own the day.', "Today's effort is tomorrow's result.", 'Learn a little. Revise a little. Repeat.', 'Focus now, relax later.', 'Progress, not perfection.', 'Attend. Learn. Repeat.', 'Your future self is watching. Make them proud.', 'One class at a time.'];
    const drawerLine = () => DRAWER_LINES[Math.floor(Date.now() / 864e5) % DRAWER_LINES.length];
    function renderDrawer() {
        const p = S.profile;
        $('#drawer').innerHTML = `<div class="drawer-head"><span class="drawer-title"><img src="images/logo.svg" alt="" width="30" height="30" />ElevenNotes</span><button class="icon-btn" data-act="menu-close" id="menuClose" aria-label="Close menu"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
            <button class="drawer-me" data-do="me" data-act="menu-go"><img src="${esc(p.avatar)}" alt="" /><span class="grow"><b>${esc(p.name)}</b><span>${esc(clsLabel())}</span></span></button>
            <nav class="drawer-nav" aria-label="Menu">${menuItems().map(([title, items]) => `<div class="drawer-sec">${title}</div>${items.map(([k, label, ic, on]) => `<button class="drawer-item ${on ? 'on' : ''}" data-act="menu-go" data-do="${k}" ${on ? 'aria-current="page"' : ''}><svg class="i" viewBox="0 0 24 24">${MENU_ICONS[ic]}</svg><span>${label}</span></button>`).join('')}`).join('')}</nav>
            <p class="drawer-foot">${esc(drawerLine())}</p>`;
    }
    function openMenu() {
        renderDrawer();
        const w = $('#drawerWrap'); w.classList.add('open'); w.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
        setTimeout(() => { const c = $('#menuClose'); if (c) c.focus(); }, 60);
    }
    function closeMenu(restoreFocus) {
        const w = $('#drawerWrap'); if (!w.classList.contains('open')) return;
        w.classList.remove('open'); w.setAttribute('aria-hidden', 'true');
        if (!$('#devWrap').classList.contains('open')) document.body.classList.remove('lock');
        if (restoreFocus) { const b = $('#menuBtn'); if (b) b.focus(); }
    }
    function menuGo(k) {
        // let the menu finish sliding out before the page changes, so neither animation stutters
        const w = $('#drawerWrap'); w.classList.remove('open'); w.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            if (!$('#devWrap').classList.contains('open')) document.body.classList.remove('lock');
            if (k.indexOf('study:') === 0) { ui.studyTab = k.slice(6); go('study'); }
            else if (k.indexOf('tool:') === 0) { go('tools'); showTool(k.slice(5)); }
            else if (k === 'settings') settingsSheet();
            else if (k === 'feedback') feedbackSheet();
            else if (k === 'install') installApp();
            else if (k === 'about') openDev();
            else go(k);
            const pg = $('.page.on'), tl = $('.page.on .tool.on');
            [pg, tl].forEach(el => { if (el) { el.classList.add('slide'); el.addEventListener('animationend', () => el.classList.remove('slide'), { once: true }); } });
        }, 200);
    }

    // ---------- ME ----------
    // ---------- install as app ----------
    let installEvt = null;
    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
    window.addEventListener('appinstalled', () => { installEvt = null; toast('ElevenNotes is installed on your home screen.', 'win', 'Installed'); closeSheet(); });
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
    function installApp() {
        if (installEvt) { const e = installEvt; installEvt = null; e.prompt(); return; }
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        openSheet('Add to home screen', `<ol class="steps">${ios
            ? '<li>Tap the <b>Share</b> button (a square with an arrow). In Safari it is at the bottom, in Chrome it is next to the address bar.</li><li>Scroll down and choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. ElevenNotes opens like an app.</li>'
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
        $$('.slide').forEach(el => el.classList.remove('slide'));
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
        if (tab === 'att') { renderAtt(); calcWhatIf(false); }
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

    // ----- attendance tracker -----
    // Marks are kept on this device only: S.att[date][startMinute] = { s: 'p' | 'a' | 'x', k: subject key, n: periods }.
    const attTarget = () => { const t = +get('attTarget', 85); return t >= 50 && t <= 100 ? t : 85; };
    const attDate = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ui.attDay); return d; };
    function attStats() {
        const m = {};
        Object.keys(S.att).forEach(day => Object.keys(S.att[day]).forEach(t => {
            const r = S.att[day][t]; if (!r || (r.s !== 'p' && r.s !== 'a')) return;
            const x = m[r.k] || (m[r.k] = { k: r.k, held: 0, att: 0 });
            x.held += r.n || 1; if (r.s === 'p') x.att += r.n || 1;
        }));
        return Object.keys(m).map(k => m[k]).sort((a, b) => a.k.localeCompare(b.k));
    }
    function attHint(x, tgt) {
        const pct = x.held ? x.att / x.held * 100 : 0;
        if (pct >= tgt) { const skip = Math.floor(x.att * 100 / tgt - x.held + 1e-9); return skip > 0 ? `You can miss ${skip} more` : 'No spare classes yet, keep attending'; }
        const need = Math.ceil((tgt * x.held - 100 * x.att) / (100 - tgt) - 1e-9);
        return tgt >= 100 ? 'Cannot reach this target' : `Attend the next ${need} class${need === 1 ? '' : 'es'} to reach ${tgt}%`;
    }
    function renderAtt() {
        const planOn = ui.attMode === 'plan';
        $$('#attModes button').forEach(b => b.classList.toggle('on', b.dataset.m === ui.attMode));
        $('#attTrack').hidden = planOn; $('#attPlan').hidden = !planOn;
        if (planOn) { calcWhatIf(false); return; }
        const d = attDate(), key = dkey(d), dow = d.getDay();
        const label = ui.attDay === 0 ? 'Today' : ui.attDay === -1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { weekday: 'long' });
        const list = (TIMETABLE[dow] || []).filter(e => entryInfo(e).kind !== 'free');
        const marks = S.att[key] || {};
        const rows = !Object.keys(TIMETABLE).length ? `<div class="row"><span class="grow"><b>Timetable not added yet</b><span>The tracker needs your class timetable.</span></span></div>`
            : !list.length ? `<div class="row"><span class="grow"><b>No classes this day</b><span>Use the arrows to pick another day.</span></span></div>`
            : list.map(e => {
                const info = entryInfo(e), st = (marks[e.t] || {}).s || '';
                const b = (v, txt) => `<button class="${st === v ? 'on' : ''}" data-act="att-mark" data-t="${e.t}" data-v="${v}" aria-pressed="${st === v}">${txt}</button>`;
                return `<div class="att-class"><div class="att-top"><span class="code-chip ${info.kind}">${esc(e.sub || 'Lab')}</span><span class="grow"><b>${esc(info.title)}</b><span>${fmtTime(e.t)}${e.n > 1 ? ' · ' + e.n + ' periods' : ''}</span></span></div>
                    <div class="seg small att-seg">${b('p', 'Present')}${b('a', 'Absent')}${b('x', 'No class')}</div></div>`;
            }).join('');
        const tgt = attTarget(), stats = attStats();
        const tot = stats.reduce((o, x) => ({ held: o.held + x.held, att: o.att + x.att }), { held: 0, att: 0 });
        const opct = tot.held ? Math.round(tot.att / tot.held * 100) : null;
        $('#attTrack').innerHTML = `<div class="sheet-paper">
            <div class="att-nav"><button class="icon-btn" data-act="att-day" data-d="-1" aria-label="Previous day">‹</button><div><b>${label}</b><span>${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div><button class="icon-btn" data-act="att-day" data-d="1" aria-label="Next day" ${ui.attDay >= 0 ? 'disabled' : ''}>›</button></div>
            <div class="flat att-list">${rows}</div></div>
            <div class="sheet-paper" style="margin-top:14px">
                <div class="att-head"><div><h2>Your attendance</h2><p class="muted">${opct === null ? 'Mark your classes above and the numbers appear here.' : `${tot.att} of ${tot.held} classes attended`}</p></div>
                    <div class="att-big ${opct !== null && opct < tgt ? 'low' : ''}">${opct === null ? '--' : opct + '%'}</div></div>
                <label class="att-tgt">Target <select id="attTarget">${[75, 80, 85, 90].map(n => `<option value="${n}" ${n === tgt ? 'selected' : ''}>${n}%</option>`).join('')}</select></label>
                ${stats.length ? `<div class="flat att-list">${stats.map(x => { const p = x.held ? Math.round(x.att / x.held * 100) : 0, s = SUB[x.k]; return `<div class="row"><span class="code-chip ${s ? s.kind : 'lab'}">${esc(x.k.length > 8 ? 'Lab' : x.k)}</span><span class="grow"><b>${esc(s ? s.name : x.k)}</b><span>${x.att}/${x.held} classes · ${esc(attHint(x, tgt))}</span></span><b class="att-pct ${p < tgt ? 'low' : ''}">${p}%</b></div>`; }).join('')}</div>` : ''}
                ${stats.length ? `<button class="btn ghost block" data-act="att-clear" style="margin-top:12px">Clear attendance</button>` : ''}
                <p class="fine">Saved only on this phone. It is your own record, so check it against your college's official attendance.</p></div>`;
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
            if (pin.length < 6 || pin.length > 30) { formError(f, 'The password must be 6 to 30 characters.'); return; }
            const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Uploading…';
            const d = { title, url, pin, subject: f.subject.value.trim(), uploader: f.uploader.value.trim() || 'Student', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
            try {
                const args = { p_class: f.branch.value + '-' + f.sem.value, p_title: d.title, p_subject: d.subject, p_url: d.url, p_uploader: d.uploader, p_pin: pin };
                let id;
                try { id = await rpc('add_resource', Object.assign({ p_kind: f.kind.value }, args)); }
                catch (e0) { id = await rpc('add_resource', args); }   // types SQL not run yet
                const mine = get('mineLib', []); mine.push(id); set('mineLib', mine.slice(-100));
                ui.lib.loaded = false; ui.lib.items = [];
                ui.fBranch = f.branch.value; ui.fSem = f.sem.value; ui.fKind = f.kind.value;
                bump('notesAdded', 1, 'added');
                closeSheet(); receiptSheet(d); loadLibrary();
            } catch (e) { btn.disabled = false; btn.textContent = 'Upload'; formError(f, 'Could not upload. Check your internet connection and try again.'); }
        },
        async 'edit-note'(f) {
            const id = f.id.value, pin = f.pin.value.trim(), title = f.title.value.trim(), url = f.url.value.trim(), subject = f.subject.value.trim();
            if (title.length < 2) { formError(f, 'Please add a title.'); return; }
            if (!subject) { formError(f, 'Please type the subject name.'); return; }
            if (!DRIVE_RE.test(url)) { formError(f, 'Please paste a Google Drive or Google Docs link.'); return; }
            if (pin.length < 6) { formError(f, 'Please enter your password.'); return; }
            const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Saving…';
            try {
                const r = await rpc('edit_resource', { p_id: id, p_pin: pin, p_title: title, p_subject: subject, p_url: url });
                btn.disabled = false; btn.textContent = 'Save changes';
                if (r === 'ok') {
                    const it = ui.lib.items.find(i => i.id === id); if (it) { it.title = title; it.subject = subject; it.url = url; }
                    closeSheet(); renderCurrent(); toast('Your note details are updated.', 'win', 'Saved');
                }
                else if (r === 'locked') formError(f, 'Too many wrong attempts. Try again in 15 minutes.');
                else if (r === 'invalid') formError(f, 'Please check the title, subject and link.');
                else if (r === 'missing') { closeSheet(); ui.lib.loaded = false; loadLibrary(); toast('This note no longer exists.', 'err'); }
                else { f.pin.value = ''; f.pin.focus(); formError(f, 'That password is not correct.'); }
            } catch (e) { btn.disabled = false; btn.textContent = 'Save changes'; formError(f, 'Could not save. Check your internet connection and try again.'); }
        },
        async unshare(f) {
            const id = f.id.value, pin = f.pin.value.trim();
            if (pin.length < 6) { formError(f, 'Please enter your password.'); return; }
            const btn = f.querySelector('[type=submit]'); btn.disabled = true;
            try {
                const r = await rpc('delete_resource', { p_id: id, p_pin: pin });
                if (r === 'ok' || r === 'missing') { ui.lib.items = ui.lib.items.filter(i => i.id !== id); closeSheet(); renderCurrent(); }
                else if (r === 'locked') { btn.disabled = false; formError(f, 'Too many wrong attempts. Try again in 15 minutes.'); }
                else { btn.disabled = false; f.pin.value = ''; f.pin.focus(); formError(f, 'That password is not correct.'); }
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
        menu: openMenu,
        'menu-close'() { closeMenu(true); },
        'menu-go'(t) { menuGo(t.dataset.do); },
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
        'lib-edit'(t) { libEditSheet(t.dataset.id); },
        'lib-kind'(t) { ui.fKind = t.dataset.k; renderCurrent(); },
        'att-mode'(t) { ui.attMode = t.dataset.m; renderAtt(); },
        'att-day'(t) { ui.attDay = Math.min(0, ui.attDay + (+t.dataset.d)); renderAtt(); },
        'att-mark'(t) {
            const d = attDate(), key = dkey(d), tm = +t.dataset.t, v = t.dataset.v;
            const e = (TIMETABLE[d.getDay()] || []).find(x => x.t === tm); if (!e) return;
            const day = S.att[key] || (S.att[key] = {});
            if (day[tm] && day[tm].s === v) delete day[tm]; else day[tm] = { s: v, k: e.sub || e.title, n: e.n || 1 };
            if (!Object.keys(day).length) delete S.att[key];
            save('att'); renderAtt();
        },
        'att-clear'() { if (confirm('Clear all attendance marks saved on this phone?')) { S.att = {}; save('att'); renderAtt(); } },

        'lib-menu'(t) {
            const n = ui.lib.items.find(x => x.id === t.dataset.id); if (!n) return;
            const rep = get('reportedLib', []).includes(n.id);
            openSheet(n.title, `<div class="flat menu-list">
                <button data-act="lib-share" data-id="${esc(n.id)}"><span class="em">🔗</span><span class="grow"><b>Share</b><span>Send this link to a friend</span></span></button>
                <button data-act="lib-edit" data-id="${esc(n.id)}"><span class="em">✏️</span><span class="grow"><b>Edit details</b><span>Needs your password</span></span></button>
                <button data-act="lib-del" data-id="${esc(n.id)}"><span class="em">🗑️</span><span class="grow"><b>Delete</b><span>Needs your password</span></span></button>
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
        'pin-gen'(t) { const f = t.closest('form'), i = f.pin; i.value = randomPassword(); i.type = 'text'; const b = f.querySelector('[data-act="pin-show"]'); if (b) b.textContent = 'Hide'; i.focus(); },
        'pin-show'(t) { const i = t.closest('form').pin; const show = i.type === 'password'; i.type = show ? 'text' : 'password'; t.textContent = show ? 'Hide' : 'Show'; },
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
        if (e.target.id === 'attTarget') { set('attTarget', +e.target.value); renderAtt(); }
        else if (e.target.id === 'libBranch') { ui.fBranch = e.target.value; renderCurrent(); }
        else if (e.target.id === 'libSem') { ui.fSem = e.target.value; renderCurrent(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); closeDev(); closeMenu(true); } });
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
