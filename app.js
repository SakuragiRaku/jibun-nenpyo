// ============================================================
// 自分年表 - app.js
// ============================================================

const EVENTS_KEY = 'jibun-nenpyo-events';
const PROFILE_KEY = 'jibun-nenpyo-profile';
const THEME_KEY = 'jibun-nenpyo-theme';

const CATEGORIES = {
  education:     { label: '学業',       icon: '🎓', color: '#3b82f6' },
  work:          { label: '仕事',       icon: '💼', color: '#22c55e' },
  skill:         { label: 'スキル',     icon: '💡', color: '#06b6d4' },
  portfolio:     { label: '作品',       icon: '🎨', color: '#a855f7' },
  certification: { label: '資格',       icon: '📜', color: '#f59e0b' },
  private:       { label: 'プライベート', icon: '🌸', color: '#ec4899' },
  other:         { label: 'その他',     icon: '📌', color: '#6b7280' },
};

// ============================================================
// State
// ============================================================

let events = [];
let profile = { name: '', tags: [], bio: '', twitter: '', github: '', website: '', birthYear: null, birthMonth: null };
let currentFilter = { category: 'all', search: '' };
let editingId = null;

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initTheme();
  initNav();
  initFilters();
  initModal();
  initProfile();
  initExport();
  initSetup();
  render();
});

// ============================================================
// Data
// ============================================================

function loadData() {
  try { events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]'); } catch { events = []; }
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    // tagline (旧) → tags (新) に移行
    if (saved.tagline && !saved.tags) {
      saved.tags = saved.tagline.split(/[,\/、]/).map(s => s.trim()).filter(Boolean);
      delete saved.tagline;
    }
    profile = { ...profile, ...saved };
    if (!Array.isArray(profile.tags)) profile.tags = [];
  } catch {}
}

function saveEvents() {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============================================================
// Theme
// ============================================================

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  setTheme(saved);
  document.getElementById('theme-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'dark' : 'light');
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.getElementById('theme-btn').textContent = theme === 'light' ? '🌙' : '☀️';
}

// ============================================================
// Navigation
// ============================================================

function initNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${btn.dataset.page}`).classList.add('active');

      if (btn.dataset.page === 'portfolio') renderPortfolio();
      if (btn.dataset.page === 'profile') loadProfileForm();
    });
  });
}

// ============================================================
// Filters
// ============================================================

function initFilters() {
  document.getElementById('category-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter.category = tab.dataset.cat;
    render();
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    currentFilter.search = e.target.value.trim().toLowerCase();
    render();
  });
}

// ============================================================
// Modal
// ============================================================

function initModal() {
  document.getElementById('add-btn').addEventListener('click', () => openModal());
  document.getElementById('edit-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('edit-save-btn').addEventListener('click', saveEvent);
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeModal();
  });
}

function openModal(id = null) {
  editingId = id;
  const modal = document.getElementById('edit-modal');
  const title = document.getElementById('edit-modal-title');

  if (id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    title.textContent = '✏️ イベント編集';
    document.getElementById('form-year').value = ev.year;
    document.getElementById('form-month').value = ev.month || 0;
    document.getElementById('form-title').value = ev.title;
    document.getElementById('form-category').value = ev.category;
    document.getElementById('form-desc').value = ev.description || '';
    document.getElementById('form-link').value = ev.link || '';
    document.getElementById('form-image').value = ev.imageUrl || '';
  } else {
    title.textContent = '📜 イベント追加';
    document.getElementById('form-year').value = new Date().getFullYear();
    document.getElementById('form-month').value = '0';
    document.getElementById('form-title').value = '';
    document.getElementById('form-category').value = 'education';
    document.getElementById('form-desc').value = '';
    document.getElementById('form-link').value = '';
    document.getElementById('form-image').value = '';
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingId = null;
}

function saveEvent() {
  const year = parseInt(document.getElementById('form-year').value);
  const month = parseInt(document.getElementById('form-month').value);
  const title = document.getElementById('form-title').value.trim();
  const category = document.getElementById('form-category').value;
  const description = document.getElementById('form-desc').value.trim();
  const link = document.getElementById('form-link').value.trim();
  const imageUrl = document.getElementById('form-image').value.trim();

  if (!title) { alert('タイトルを入力してください'); return; }
  if (!year || year < 1900) { alert('年を正しく入力してください'); return; }

  if (editingId) {
    const idx = events.findIndex(e => e.id === editingId);
    if (idx !== -1) {
      events[idx] = { ...events[idx], year, month, title, category, description, link, imageUrl };
    }
  } else {
    events.push({
      id: generateId(),
      year, month, title, category, description, link, imageUrl,
      createdAt: new Date().toISOString(),
    });
  }

  saveEvents();
  closeModal();
  render();
}

function deleteEvent(id) {
  if (!confirm('このイベントを削除しますか？')) return;
  events = events.filter(e => e.id !== id);
  saveEvents();
  render();
}

// ============================================================
// Render Timeline
// ============================================================

function render() {
  const timeline = document.getElementById('timeline');
  const empty = document.getElementById('empty-state');

  let filtered = events.filter(e => {
    if (currentFilter.category !== 'all' && e.category !== currentFilter.category) return false;
    if (currentFilter.search && !e.title.toLowerCase().includes(currentFilter.search)) return false;
    return true;
  });

  // Sort by year desc, month desc
  filtered.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });

  if (filtered.length === 0) {
    timeline.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  // Group by year
  const grouped = {};
  filtered.forEach(e => {
    if (!grouped[e.year]) grouped[e.year] = [];
    grouped[e.year].push(e);
  });

  const years = Object.keys(grouped).sort((a, b) => b - a);

  timeline.innerHTML = years.map(year => {
    const items = grouped[year].map(e => renderTimelineCard(e)).join('');
    return `
      <div class="timeline-year">
        <div class="timeline-year-label">${year}年</div>
        ${items}
      </div>
    `;
  }).join('');
}

function renderTimelineCard(e) {
  const cat = CATEGORIES[e.category] || CATEGORIES.other;
  const dateStr = e.month ? `${e.year}年${e.month}月` : `${e.year}年`;
  const linkHtml = e.link ? `<a class="tl-card-link" href="${escHtml(e.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 リンク</a>` : '';
  const imgHtml = e.imageUrl ? `<img class="tl-card-image" src="${escHtml(e.imageUrl)}" alt="${escHtml(e.title)}" onerror="this.style.display='none'">` : '';
  const hasDetails = e.description || e.link || e.imageUrl;

  return `
    <div class="tl-card" style="--cat-color: ${cat.color}" data-id="${e.id}">
      <div class="tl-card-header" onclick="toggleCard(this)">
        <div class="tl-card-header-left">
          <span class="tl-card-title">${cat.icon} ${escHtml(e.title)}</span>
          <span class="tl-card-date">${dateStr}</span>
        </div>
        <div class="tl-card-header-right">
          <span class="tl-card-cat" style="--cat-color: ${cat.color}">${cat.label}</span>
          <span class="tl-card-chevron">${hasDetails ? '▼' : ''}</span>
        </div>
      </div>
      <div class="tl-card-body">
        ${e.description ? `<div class="tl-card-desc">${escHtml(e.description)}</div>` : ''}
        ${linkHtml}
        ${imgHtml}
        <div class="tl-card-actions">
          <button onclick="event.stopPropagation(); openModal('${e.id}')">✏️ 編集</button>
          <button class="delete-btn" onclick="event.stopPropagation(); deleteEvent('${e.id}')">🗑 削除</button>
        </div>
      </div>
    </div>
  `;
}

function toggleCard(headerEl) {
  const card = headerEl.closest('.tl-card');
  card.classList.toggle('open');
}

// ============================================================
// Portfolio
// ============================================================

function renderPortfolio() {
  const preview = document.getElementById('portfolio-preview');

  const portfolioEvents = events.filter(e =>
    ['portfolio', 'skill', 'certification', 'work'].includes(e.category)
  ).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });

  if (!profile.name && portfolioEvents.length === 0) {
    preview.innerHTML = '<div class="pf-empty">プロフィールを設定してイベントを追加するとポートフォリオが表示されます</div>';
    return;
  }

  // Profile header
  let html = '<div class="pf-header">';
  html += `<div class="pf-name">${escHtml(profile.name || '名前未設定')}</div>`;
  const taglineStr = (profile.tags || []).join(' / ');
  if (taglineStr) html += `<div class="pf-tagline">${escHtml(taglineStr)}</div>`;
  if (profile.bio) html += `<div class="pf-bio">${escHtml(profile.bio)}</div>`;

  const links = [];
  if (profile.twitter) links.push(`<a href="https://twitter.com/${profile.twitter}" target="_blank">𝕏 ${escHtml(profile.twitter)}</a>`);
  if (profile.github) links.push(`<a href="https://github.com/${profile.github}" target="_blank">GitHub</a>`);
  if (profile.website) links.push(`<a href="${escHtml(profile.website)}" target="_blank">Web</a>`);
  if (links.length) html += `<div class="pf-links">${links.join('')}</div>`;
  html += '</div>';

  // Sections
  const sections = [
    { key: 'portfolio', title: '🎨 作品' },
    { key: 'skill', title: '💡 スキル' },
    { key: 'certification', title: '📜 資格' },
    { key: 'work', title: '💼 経歴' },
  ];

  sections.forEach(sec => {
    const items = portfolioEvents.filter(e => e.category === sec.key);
    if (items.length === 0) return;

    html += `<div class="pf-section"><div class="pf-section-title">${sec.title}</div>`;
    items.forEach(e => {
      const dateStr = e.month ? `${e.year}年${e.month}月` : `${e.year}年`;
      html += `<div class="pf-item">`;
      html += `<div class="pf-item-title">${escHtml(e.title)}</div>`;
      html += `<div class="pf-item-date">${dateStr}</div>`;
      if (e.description) html += `<div class="pf-item-desc">${escHtml(e.description)}</div>`;
      if (e.link) html += `<a class="pf-item-link" href="${escHtml(e.link)}" target="_blank">🔗 リンク</a>`;
      if (e.imageUrl) html += `<img class="pf-item-img" src="${escHtml(e.imageUrl)}" alt="${escHtml(e.title)}" onerror="this.style.display='none'">`;
      html += `</div>`;
    });
    html += '</div>';
  });

  preview.innerHTML = html;
}

// ============================================================
// Profile
// ============================================================

function initProfile() {
  // タグチップ初期化
  initTagInput('profile-tag-preset', 'profile-tag-input', 'profile-tag-selected', 'profile');

  document.getElementById('save-profile-btn').addEventListener('click', () => {
    profile.name = document.getElementById('profile-name').value.trim();
    profile.tags = getSelectedTags('profile');
    profile.bio = document.getElementById('profile-bio').value.trim();
    profile.twitter = document.getElementById('profile-twitter').value.trim().replace('@', '');
    profile.github = document.getElementById('profile-github').value.trim();
    profile.website = document.getElementById('profile-website').value.trim();
    saveProfile();
    alert('プロフィールを保存しました');
  });
}

function loadProfileForm() {
  document.getElementById('profile-name').value = profile.name;
  setSelectedTags('profile-tag-preset', 'profile-tag-selected', profile.tags || [], 'profile');
  document.getElementById('profile-bio').value = profile.bio;
  document.getElementById('profile-twitter').value = profile.twitter;
  document.getElementById('profile-github').value = profile.github;
  document.getElementById('profile-website').value = profile.website;
}

// ============================================================
// HTML Export
// ============================================================

function initExport() {
  document.getElementById('export-btn').addEventListener('click', exportPortfolio);
}

function exportPortfolio() {
  const portfolioEvents = events.filter(e =>
    ['portfolio', 'skill', 'certification', 'work'].includes(e.category)
  ).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });

  const sections = [
    { key: 'portfolio', title: '🎨 作品' },
    { key: 'skill', title: '💡 スキル' },
    { key: 'certification', title: '📜 資格' },
    { key: 'work', title: '💼 経歴' },
  ];

  let sectionsHtml = '';
  sections.forEach(sec => {
    const items = portfolioEvents.filter(e => e.category === sec.key);
    if (items.length === 0) return;
    sectionsHtml += `<section class="section"><h2>${sec.title}</h2>`;
    items.forEach(e => {
      const dateStr = e.month ? `${e.year}年${e.month}月` : `${e.year}年`;
      sectionsHtml += `<div class="item">`;
      sectionsHtml += `<h3>${escHtml(e.title)}</h3>`;
      sectionsHtml += `<div class="date">${dateStr}</div>`;
      if (e.description) sectionsHtml += `<p>${escHtml(e.description)}</p>`;
      if (e.link) sectionsHtml += `<a href="${escHtml(e.link)}" target="_blank">🔗 リンク</a>`;
      if (e.imageUrl) sectionsHtml += `<img src="${escHtml(e.imageUrl)}" alt="${escHtml(e.title)}">`;
      sectionsHtml += `</div>`;
    });
    sectionsHtml += `</section>`;
  });

  const links = [];
  if (profile.twitter) links.push(`<a href="https://twitter.com/${profile.twitter}" target="_blank">𝕏 ${escHtml(profile.twitter)}</a>`);
  if (profile.github) links.push(`<a href="https://github.com/${profile.github}" target="_blank">GitHub</a>`);
  if (profile.website) links.push(`<a href="${escHtml(profile.website)}" target="_blank">Web</a>`);

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(profile.name || 'ポートフォリオ')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans JP',-apple-system,sans-serif;background:#0d0d1a;color:#e8e8f2;min-height:100vh;line-height:1.6}
.container{max-width:800px;margin:0 auto;padding:40px 24px}
header{text-align:center;margin-bottom:48px;padding-bottom:32px;border-bottom:1px solid #282848}
h1{font-size:32px;font-weight:800;background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
.tagline{font-size:16px;color:#a855f7;font-weight:600;margin-bottom:12px}
.bio{font-size:14px;color:#8888aa;max-width:500px;margin:0 auto 16px}
.links{display:flex;gap:16px;justify-content:center}
.links a{color:#a855f7;text-decoration:none;font-size:14px}
.links a:hover{text-decoration:underline}
.section{margin-bottom:36px}
h2{font-size:20px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #a855f7;display:inline-block}
.item{background:#161630;border:1px solid #282848;border-radius:12px;padding:20px;margin-bottom:12px}
h3{font-size:16px;font-weight:700;margin-bottom:4px}
.date{font-size:12px;color:#8888aa;margin-bottom:8px}
p{font-size:14px;color:#8888aa}
a{color:#a855f7;font-size:13px;text-decoration:none;display:inline-block;margin-top:8px}
img{max-width:100%;height:auto;border-radius:8px;margin-top:8px}
footer{text-align:center;margin-top:48px;padding-top:24px;border-top:1px solid #282848;font-size:12px;color:#555570}
@media(max-width:640px){.container{padding:24px 16px}h1{font-size:24px}}
</style>
</head>
<body>
<div class="container">
<header>
<h1>${escHtml(profile.name || 'ポートフォリオ')}</h1>
${(profile.tags || []).length ? `<div class="tagline">${escHtml((profile.tags || []).join(' / '))}</div>` : ''}
${profile.bio ? `<div class="bio">${escHtml(profile.bio)}</div>` : ''}
${links.length ? `<div class="links">${links.join('')}</div>` : ''}
</header>
${sectionsHtml}
<footer>Created with 自分年表</footer>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.name || 'portfolio'}_portfolio.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Initial Setup (初回セットアップ)
// ============================================================

const SETUP_DONE_KEY = 'jibun-nenpyo-setup-done';

function initSetup() {
  const setupDone = localStorage.getItem(SETUP_DONE_KEY);
  if (setupDone) return;

  document.getElementById('setup-overlay').classList.remove('hidden');

  // セットアップ画面のタグ初期化
  initTagInput('setup-tag-preset', 'setup-tag-input', 'setup-tag-selected', 'setup');

  // チップ式選択のトグル (就学前 + 進学先: 単一選択)
  ['setup-preschool', 'setup-higher-ed'].forEach(containerId => {
    const container = document.getElementById(containerId);
    container.addEventListener('click', (e) => {
      const chip = e.target.closest('.school-chip');
      if (!chip) return;
      container.querySelectorAll('.school-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // 学校チップ (複数選択トグル)
  const schoolsContainer = document.getElementById('setup-schools');
  schoolsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.school-chip');
    if (!chip) return;
    chip.classList.toggle('selected');
  });

  document.getElementById('setup-start-btn').addEventListener('click', completeSetup);
}

function completeSetup() {
  const name = document.getElementById('setup-name').value.trim();
  const birthYear = parseInt(document.getElementById('setup-birth-year').value);
  const birthMonth = parseInt(document.getElementById('setup-birth-month').value);
  const tags = getSelectedTags('setup');
  const bio = document.getElementById('setup-bio').value.trim();

  if (!name) { alert('お名前を入力してください'); return; }
  if (!birthYear || birthYear < 1900 || birthYear > 2100) { alert('生まれた年を正しく入力してください'); return; }

  profile.name = name;
  profile.birthYear = birthYear;
  profile.birthMonth = birthMonth;
  profile.tags = tags;
  profile.bio = bio;
  saveProfile();

  // 「誕生」イベントを自動追加
  events.push({
    id: generateId(),
    year: birthYear,
    month: birthMonth,
    title: `${name} 誕生 🎉`,
    category: 'private',
    description: 'ここから年表がはじまります。',
    link: '',
    imageUrl: '',
    createdAt: new Date().toISOString(),
  });

  // 学校イベントを自動生成
  const preschoolType = document.querySelector('#setup-preschool .school-chip.selected')?.dataset.val || 'kindergarten';
  const selectedSchools = [...document.querySelectorAll('#setup-schools .school-chip.selected')].map(c => c.dataset.val);
  const includeElem = selectedSchools.includes('elem');
  const includeJunior = selectedSchools.includes('junior');
  const includeHigh = selectedSchools.includes('high');
  const higherEd = document.querySelector('#setup-higher-ed .school-chip.selected')?.dataset.val || 'none';
  generateSchoolEvents(birthYear, birthMonth, { preschoolType, includeElem, includeJunior, includeHigh, higherEd });

  saveEvents();

  localStorage.setItem(SETUP_DONE_KEY, 'true');
  document.getElementById('setup-overlay').classList.add('hidden');
  render();
}

function generateSchoolEvents(birthYear, birthMonth, options = {}) {
  const { preschoolType = 'kindergarten', includeElem = true, includeJunior = true, includeHigh = true, higherEd = 'none' } = options;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const now = currentYear * 100 + currentMonth;

  const isEarlyBorn = birthMonth >= 1 && birthMonth <= 3;
  const elemStartYear = isEarlyBorn ? birthYear + 6 : birthYear + 7;

  const timeline = [];

  // 就学前施設
  if (preschoolType !== 'none') {
    const preschoolNames = {
      kindergarten: '幼稚園',
      nursery: '保育園',
      kodomoen: 'こども園',
    };
    const pName = preschoolNames[preschoolType] || '幼稚園';
    timeline.push({ offset: -3, month: 4, title: `${pName} 入園 🏠`, desc: `${pName}に入園` });
    timeline.push({ offset: 0,  month: 3, title: `${pName} 卒園 🌸`, desc: `${pName}を卒園` });
  }

  // 小学校
  if (includeElem) {
    timeline.push({ offset: 0,  month: 4, title: '小学校 入学 🏫', desc: '小学1年生' });
    timeline.push({ offset: 6,  month: 3, title: '小学校 卒業 🎓', desc: '小学6年生を修了' });
  }

  // 中学校
  if (includeJunior) {
    timeline.push({ offset: 6,  month: 4, title: '中学校 入学 🏫', desc: '中学1年生' });
    timeline.push({ offset: 9,  month: 3, title: '中学校 卒業 🎓', desc: '中学3年生を修了' });
  }

  // 高校 (任意)
  if (includeHigh) {
    timeline.push({ offset: 9,  month: 4, title: '高校 入学 🏫', desc: '高校1年生' });
    timeline.push({ offset: 12, month: 3, title: '高校 卒業 🎓', desc: '高校3年生を修了' });
  }

  // 高等教育 (任意)
  if (higherEd !== 'none') {
    const baseOffset = includeHigh ? 12 : 9;
    const higherEdConfig = {
      'university':      { name: '大学',     years: 4 },
      'junior-college':  { name: '短期大学', years: 2 },
      'vocational-2':    { name: '専門学校', years: 2 },
      'vocational-3':    { name: '専門学校', years: 3 },
      'vocational-4':    { name: '専門学校', years: 4 },
    };
    const config = higherEdConfig[higherEd];
    if (config) {
      timeline.push({ offset: baseOffset,                month: 4, title: `${config.name} 入学 🏫`, desc: `${config.name}1年生` });
      timeline.push({ offset: baseOffset + config.years, month: 3, title: `${config.name} 卒業 🎓`, desc: `${config.name}${config.years}年生を修了` });
    }
  }

  timeline.forEach(s => {
    const year = elemStartYear + s.offset;
    const ym = year * 100 + s.month;
    if (ym > now) return;

    events.push({
      id: generateId(),
      year: year,
      month: s.month,
      title: s.title,
      category: 'education',
      description: s.desc,
      link: '',
      imageUrl: '',
      createdAt: new Date().toISOString(),
    });
  });
}

// ============================================================
// Tag Input System
// ============================================================

// 各コンテキストのタグ状態を管理
const tagStates = {};

function initTagInput(presetId, inputId, selectedId, context) {
  tagStates[context] = [];

  const preset = document.getElementById(presetId);
  const input = document.getElementById(inputId);

  // プリセットタグのクリック
  preset.addEventListener('click', (e) => {
    const chip = e.target.closest('.tag-chip');
    if (!chip) return;
    const tag = chip.dataset.tag;

    if (tagStates[context].includes(tag)) {
      tagStates[context] = tagStates[context].filter(t => t !== tag);
      chip.classList.remove('selected');
    } else {
      tagStates[context].push(tag);
      chip.classList.add('selected');
    }
    renderSelectedTags(selectedId, context);
  });

  // 自由入力 (Enter)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !tagStates[context].includes(val)) {
        tagStates[context].push(val);
        renderSelectedTags(selectedId, context);
      }
      input.value = '';
    }
  });
}

function getSelectedTags(context) {
  return [...(tagStates[context] || [])];
}

function setSelectedTags(presetId, selectedId, tags, context) {
  tagStates[context] = [...tags];

  // プリセットボタンの状態を更新
  const preset = document.getElementById(presetId);
  preset.querySelectorAll('.tag-chip').forEach(chip => {
    if (tags.includes(chip.dataset.tag)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });

  renderSelectedTags(selectedId, context);
}

function renderSelectedTags(selectedId, context) {
  const container = document.getElementById(selectedId);
  const tags = tagStates[context] || [];

  if (tags.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tags.map((tag, i) => `
    <span class="tag-badge">
      ${escHtml(tag)}
      <button class="tag-badge-remove" data-index="${i}">&times;</button>
    </span>
  `).join('');

  // ×ボタンクリック
  container.querySelectorAll('.tag-badge-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const removed = tagStates[context][idx];
      tagStates[context].splice(idx, 1);

      // プリセットのselectedクラスも解除
      const parentForm = container.closest('.setup-form, .profile-form');
      if (parentForm) {
        parentForm.querySelectorAll(`.tag-chip[data-tag="${removed}"]`).forEach(c => c.classList.remove('selected'));
      }

      renderSelectedTags(selectedId, context);
    });
  });
}

// ============================================================
// Helpers
// ============================================================

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
