// 📗 Seznam predmetov
const SUBJECTS = [
    { id: "naravoslovje", name: "🔬 Naravoslovje" },
];

// 📗 Seznam naborov
const DATASETS = [
  { id: "dejavnikiokolja", subject: "naravoslovje", name: "Dejavniki okolja", url: "dejavnikiokolja.json" },
];
const SELECT_KEY  = "anki_dataset_id";
const SUBJECT_KEY = "anki_subject_id";
const SCORE_KEY   = "anki_quiz_score";
let currentSubject = localStorage.getItem(SUBJECT_KEY) || "naravoslovje";
let MASTER_DATA  = [];
let ALL_UNITS_POOL = [];   // pool of ALL items from every unit, for quiz distractors
let currentMode  = "flashcard";

// ── Ranks ─────────────────────────────────────────────────────────────────────
const RANKS = [
  { name: "Lesena medalja",   minScore: 0,   color: "#a07850", glow: "#d4a96a" },
  { name: "Železna medalja",  minScore: 30,  color: "#909090", glow: "#c8c8c8" },
  { name: "Bronasta medalja", minScore: 80,  color: "#c8a000", glow: "#ffe033" },
  { name: "Srebrna medalja",  minScore: 175, color: "#2a7fcf", glow: "#5eb8ff" },
  { name: "Zlata medalja",    minScore: 350, color: "#c0392b", glow: "#ff6b6b" },
];

// ── Timed Mode Levels ─────────────────────────────────────────────────────────
const TIMED_LEVELS = [
  { medal: "Lesena medalja",   timeLimit: 90,  target: 30,  color: "#a07850", glow: "#d4a96a",
    hint: "Pridobi 30 točk v 1:30" },
  { medal: "Železna medalja",  timeLimit: 80,  target: 55,  color: "#909090", glow: "#c8c8c8",
    hint: "Pridobi 55 točk v 1:20" },
  { medal: "Bronasta medalja", timeLimit: 90,  target: 100, color: "#c8a000", glow: "#ffe033",
    hint: "Pridobi 100 točk v 1:30" },
  { medal: "Srebrna medalja",  timeLimit: 120, target: 180, color: "#2a7fcf", glow: "#5eb8ff",
    hint: "Pridobi 180 točk v 2:00" },
  { medal: "Zlata medalja",    timeLimit: 150, target: 290, color: "#c0392b", glow: "#ff6b6b",
    hint: "Pridobi 290 točk v 2:30" },
];

function getRank(score) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (score >= r.minScore) rank = r; }
  return rank;
}
function getNextRank(score) {
  for (const r of RANKS) { if (score < r.minScore) return r; }
  return null;
}
function getMultiplier(streak) {
  if (streak >= 10) return 3;
  if (streak >= 5)  return 2;
  return 1;
}

function getMedalSVG(rankName, size) {
  size = size || 60;
  const s = size;
  switch (rankName) {
    case "Lesena medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="29" fill="#6b4c2a" stroke="#4a3018" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="#8B6340"/>
        <circle cx="32" cy="32" r="22" fill="#a07850" stroke="#c4943a" stroke-width="1"/>
        <text x="32" y="40" text-anchor="middle" fill="#f5deb3" font-size="22" font-family="Georgia,serif" font-weight="bold">P</text>
        <circle cx="32" cy="32" r="28" fill="none" stroke="#c4943a" stroke-width="1" stroke-dasharray="3 4" opacity="0.7"/>
      </svg>`;
    case "Železna medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="29" fill="#555" stroke="#333" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="#777"/>
        <circle cx="32" cy="32" r="22" fill="#999" stroke="#bbb" stroke-width="1"/>
        <polygon points="32,14 35,23 45,23 37,29 40,39 32,33 24,39 27,29 19,23 29,23" fill="white" opacity="0.9"/>
        <polygon points="32,14 35,23 45,23 37,29 40,39 32,33 24,39 27,29 19,23 29,23" fill="none" stroke="#ccc" stroke-width="0.5"/>
      </svg>`;
    case "Bronasta medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gG${size}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#fff176"/>
            <stop offset="60%" stop-color="#ffd600"/>
            <stop offset="100%" stop-color="#e65100"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#7a5900" stroke="#5a3e00" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="url(#gG${size})" stroke="#fff176" stroke-width="0.5"/>
        <polygon points="32,11 35.5,22 47,22 38,29 41.5,40 32,33 22.5,40 26,29 17,22 28.5,22" fill="white" opacity="0.95"/>
        <circle cx="32" cy="32" r="4.5" fill="#ffd600"/>
        <circle cx="32" cy="32" r="28" fill="none" stroke="#fff9c4" stroke-width="0.8" opacity="0.5"/>
      </svg>`;
    case "Srebrna medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bG${size}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#80d8ff"/>
            <stop offset="60%" stop-color="#0288d1"/>
            <stop offset="100%" stop-color="#01579b"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#01386b" stroke="#012a50" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="url(#bG${size})" stroke="#80d8ff" stroke-width="0.5"/>
        <polygon points="32,10 35.5,21 47,21 38,28 41.5,39 32,32 22.5,39 26,28 17,21 28.5,21" fill="white" opacity="0.95"/>
        <polygon points="32,17 34.5,25 42,25 36,30 38.5,38 32,33 25.5,38 28,30 22,25 29.5,25" fill="#80d8ff" opacity="0.6"/>
        <circle cx="32" cy="32" r="3.5" fill="white"/>
      </svg>`;
    case "Zlata medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rG${size}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#ff8a80"/>
            <stop offset="60%" stop-color="#e53935"/>
            <stop offset="100%" stop-color="#880e0e"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#5a0000" stroke="#3a0000" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="url(#rG${size})" stroke="#ff8a80" stroke-width="0.5"/>
        <circle cx="32" cy="32" r="23" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <polygon points="32,9 35.5,20 47,20 38,27 41.5,38 32,31 22.5,38 26,27 17,20 28.5,20" fill="white" opacity="0.95"/>
        <polygon points="32,15 34.5,23 42,23 36,28 38.5,36 32,31 25.5,36 28,28 22,23 29.5,23" fill="#ff8a80" opacity="0.65"/>
        <circle cx="32" cy="32" r="4" fill="white"/>
        <circle cx="32" cy="9"  r="2" fill="#ffcdd2"/>
        <circle cx="32" cy="55" r="2" fill="#ffcdd2"/>
        <circle cx="9"  cy="32" r="2" fill="#ffcdd2"/>
        <circle cx="55" cy="32" r="2" fill="#ffcdd2"/>
      </svg>`;
    default: return "";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildSubjectSelect() {
  const sel = document.getElementById("subject");
  if (!sel) return;
  sel.innerHTML = "";
  SUBJECTS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id; opt.textContent = s.name;
    sel.appendChild(opt);
  });
  sel.value = currentSubject;
}

function buildDatasetSelect() {
  const sel = document.getElementById("dataset");
  sel.innerHTML = "";
  const filtered = DATASETS.filter(d => d.subject === currentSubject);
  if (filtered.length === 0) {
    const opt = document.createElement("option");
    opt.value = "__none__"; opt.textContent = "— ni naborov —";
    sel.appendChild(opt);
    return;
  }
  filtered.forEach(ds => {
    const opt = document.createElement("option");
    opt.value = ds.id; opt.textContent = ds.name;
    sel.appendChild(opt);
  });
  const saved = localStorage.getItem(SELECT_KEY);
  if (saved && filtered.find(d => d.id === saved)) sel.value = saved;
}

function currentDataset() {
  const id = document.getElementById("dataset").value;
  const filtered = DATASETS.filter(d => d.subject === currentSubject);
  return filtered.find(d => d.id === id) || filtered[0] || null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Wikipedia image fetch ──────────────────────────────────────────────────
const imageCache = {};

async function fetchWikiImage(searchTerm) {
  if (imageCache[searchTerm] !== undefined) return imageCache[searchTerm];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search`
              + `&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=3`
              + `&prop=pageimages&piprop=thumbnail&pithumbsize=400`
              + `&format=json&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) { imageCache[searchTerm] = null; return null; }
    // Pick first page that actually has a thumbnail
    const img = Object.values(pages)
      .sort((a, b) => a.index - b.index)
      .map(p => p?.thumbnail?.source)
      .find(src => !!src) || null;
    imageCache[searchTerm] = img;
    return img;
  } catch {
    imageCache[searchTerm] = null;
    return null;
  }
}

async function maybeShowCardImage(card) {
  const imgEl = document.getElementById('cardImage');
  const faceEl = document.getElementById('cardFront');
  if (!imgEl) return;
  
  // Hide image if not in naravoslovje or no image term exists
  if (currentSubject !== 'naravoslovje' || !card.image) {
    imgEl.style.display = 'none';
    autoFitCardText(faceEl); // Make sure text fits without image
    return;
  }
  
  imgEl.style.display = 'none'; // hide while loading
  const src = await fetchWikiImage(card.image);
  
  if (src) {
    // Wait for the image to actually load its dimensions, THEN resize the text
    imgEl.onload = () => {
      autoFitCardText(faceEl);
    };
    imgEl.src = src;
    imgEl.style.display = 'block';
  } else {
    autoFitCardText(faceEl);
  }
}

function autoFitCardText(faceEl) {
  if (!faceEl) return;
  const span = faceEl.querySelector('.card-text');
  if (!span) return;
  if (faceEl.clientHeight === 0) return;

  const imgEl   = faceEl.querySelector('.card-image');
  const hasImage = imgEl && imgEl.style.display !== 'none' && imgEl.src;
  const padTop   = parseInt(getComputedStyle(faceEl).paddingTop)  || 26;
  const padBot   = parseInt(getComputedStyle(faceEl).paddingBottom) || 26;
  const flipHint = 30; // space reserved for "klikni za obrat"
  const available = faceEl.clientHeight - padTop - padBot - flipHint;

  if (hasImage) {
    // Give image up to 45% of available space, text gets the rest
    const imgMax  = Math.floor(available * 0.45);
    const textMax = available - imgMax - 10; // 10px gap between image and text

    // Scale image: grow or shrink to fill its allocation
    imgEl.style.maxHeight = imgMax + 'px';
    imgEl.style.maxWidth  = '75%';

    // Scale text to fill its allocation — try growing first, then shrink if needed
    let size = 2.2;
    span.style.fontSize = size + 'rem';
    // Shrink if overflowing text area
    while (span.scrollHeight > textMax && size > 0.78) {
      size -= 0.04;
      span.style.fontSize = size + 'rem';
    }
    // Grow if there's room to spare
    while (span.scrollHeight < textMax * 0.75 && size < 2.2) {
      size += 0.04;
      span.style.fontSize = size + 'rem';
      if (span.scrollHeight > textMax) { size -= 0.04; span.style.fontSize = size + 'rem'; break; }
    }
  } else {
    // No image — text fills everything, scale up or down freely
    let size = 2.5;
    span.style.fontSize = size + 'rem';
    // Shrink if overflowing
    while (span.scrollHeight > available && size > 0.78) {
      size -= 0.04;
      span.style.fontSize = size + 'rem';
    }
    // Grow if there's lots of room (short words should be big)
    while (span.scrollHeight < available * 0.65 && size < 2.8) {
      size += 0.04;
      span.style.fontSize = size + 'rem';
      if (span.scrollHeight > available) { size -= 0.04; span.style.fontSize = size + 'rem'; break; }
    }
  }
}

function setFaceText(faceEl, text) {
  if (!faceEl) return;
  const span = faceEl.querySelector('.card-text');
  if (span) span.textContent = text;
  else faceEl.textContent = text;
  autoFitCardText(faceEl);
}

async function fetchRawData(dataset) {
  let allData = [];
  const t = Date.now();
  if (dataset.combined) {
    for (const url of dataset.combined) {
      const resp = await fetch(url + '?t=' + t);
      if (!resp.ok) throw new Error("Napaka pri prenosu " + url);
      allData = allData.concat(await resp.json());
    }
  } else {
    const resp = await fetch(dataset.url + '?t=' + t);
    if (!resp.ok) throw new Error("Napaka pri prenosu");
    allData = await resp.json();
  }
  return allData;
}

function getCategory(text) {
  if (!text) return "word";
  const trimmed = text.trim();
  if (/[.!?]$/.test(trimmed)) return "sentence";
  const firstPart = trimmed.split('/')[0].trim();
  const wordCount = firstPart.split(/\s+/).length;
  if (wordCount === 1) return "word";
  if (wordCount >= 5) return "sentence";
  return "phrase";
}

function applyFilters() {
  let finalCards = MASTER_DATA.map((item, index) => {
    const valSlo = item.question ?? item.slovenian ?? "";
    const valEng = item.answer   ?? item.english   ?? "";
    const isSloToEng = Math.random() < 0.5;
    return { 
      id: index, 
      front: isSloToEng ? valSlo : valEng, 
      back: isSloToEng ? valEng : valSlo, 
      english: valEng, 
      isSloToEng,
      image: item.image
    };
  });
  return shuffle(finalCards);
}

function setLoadingUI(loading) {
  const buttons = ["prevBtn","nextBtn"].map(id => document.getElementById(id)).filter(Boolean);
  buttons.forEach(b => b.disabled = loading);
  if (loading) {
    setFaceText(document.getElementById("cardFront"), "Nalagam kartice…");
    setFaceText(document.getElementById("cardBack"),  "Prosim počakaj 🙂");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Sound Engine (Web Audio API – no external files) ─────────────────────────
const SoundFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone(opts) {
    try {
      const ac  = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.freq, ac.currentTime);
      if (opts.freqEnd !== undefined)
        osc.frequency.linearRampToValueAtTime(opts.freqEnd, ac.currentTime + opts.dur);
      gain.gain.setValueAtTime(opts.vol || 0.35, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + opts.dur);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + opts.dur);
    } catch(e) {}
  }

  function correct() {
    // Duolingo-style: bright cheerful three-note chime C5-E5-C6
    playTone({ freq: 523, freqEnd: 523, type: 'sine', dur: 0.14, vol: 0.38 });
    setTimeout(() => playTone({ freq: 659, freqEnd: 659, type: 'sine', dur: 0.22, vol: 0.32 }), 110);
    setTimeout(() => playTone({ freq: 1047, freqEnd: 1047, type: 'sine', dur: 0.28, vol: 0.18 }), 220);
  }

  function wrong() {
    // Duolingo-style: dull low bwonk - descending minor second
    playTone({ freq: 380, freqEnd: 300, type: 'triangle', dur: 0.18, vol: 0.35 });
    setTimeout(() => playTone({ freq: 280, freqEnd: 220, type: 'triangle', dur: 0.28, vol: 0.28 }), 150);
  }

  function rankUp() {
    // Fanfare: quick ascending arpeggio
    const ac = getCtx();
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone({ freq, freqEnd: freq * 1.02, type: 'sine', dur: 0.28, vol: 0.3 }), i * 90);
    });
  }

  return { correct, wrong, rankUp };
})();

// ── Score HUD ─────────────────────────────────────────────────────────────────
function updateScoreHUD(score, streak) {
  const hud = document.getElementById('scoreHUD');
  if (!hud) return;
  const rank     = getRank(score);
  const nextRank = getNextRank(score);
  const mult     = getMultiplier(streak);
  let progress   = 100, progressLabel = "MAX RANG 🏆";
  if (nextRank) {
    const range = nextRank.minScore - rank.minScore;
    progress = Math.min(100, Math.round(((score - rank.minScore) / range) * 100));
    progressLabel = `${nextRank.minScore - score} točk do ${nextRank.name}`;
  }

  // Build ranks popup items
  const popupItems = RANKS.map(r => {
    const isCurrent = r.name === rank.name;
    return `<div class="rank-popup-item${isCurrent ? ' current-rank' : ''}">
      ${getMedalSVG(r.name, isCurrent ? 44 : 34)}
      <span>${r.name}<br><small>${r.minScore}+</small></span>
    </div>`;
  }).join('');

  hud.innerHTML = `
    <div class="hud-medal" id="hudMedalBtn" title="Prikaži vse range">
      ${getMedalSVG(rank.name, 54)}
    </div>
    <div class="hud-info">
      <div class="hud-rank-name" style="color:${rank.glow}">${rank.name}</div>
      <div class="hud-score-row">
        <span class="hud-score">${score}<span class="hud-pts-label"> točk</span></span>
        ${streak >= 2 ? `<span class="hud-streak">🔥 ${streak}× ${mult > 1 ? `<span class="hud-mult-badge">×${mult}</span>` : ''}</span>` : ''}
      </div>
      <div class="hud-bar-wrap"><div class="hud-bar-fill" style="width:${progress}%;background:linear-gradient(90deg,${rank.color},${rank.glow})"></div></div>
      <div class="hud-bar-label">${progressLabel}</div>
    </div>
    <button id="resetScoreBtn" class="reset-score-btn" title="Ponastavi rezultat">↺</button>
    <div class="hud-ranks-popup" id="ranksPopup">
      <div class="ranks-popup-title">🏅 Lestvica rangov</div>
      <div class="ranks-popup-items">${popupItems}</div>
      <div class="mult-info">
        <span>🔥 5× niz = <strong>×2</strong></span>
        <span>🔥🔥 10× niz = <strong>×3</strong></span>
      </div>
    </div>
  `;

  // Medal click toggles popup
  document.getElementById('hudMedalBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('ranksPopup').classList.toggle('open');
  });
  document.addEventListener('click', function closePopup() {
    const p = document.getElementById('ranksPopup');
    if (p) p.classList.remove('open');
  }, { once: false });
  document.getElementById('ranksPopup').addEventListener('click', e => e.stopPropagation());

  document.getElementById('resetScoreBtn').addEventListener('click', () => {
    if (confirm('Res želiš ponastaviti rezultat na nič?')) {
      localStorage.setItem(SCORE_KEY, '0');
      if (window.quizApp) { window.quizApp.score = 0; window.quizApp.streak = 0; window.quizApp.render(); }
      updateScoreHUD(0, 0);
    }
  });
}

// ── Quiz App ──────────────────────────────────────────────────────────────────
class QuizApp {
  constructor(cards) {
    this.cards    = shuffle([...cards]);
    this.index    = 0;
    this.score    = parseInt(localStorage.getItem(SCORE_KEY) || '0');
    this.streak   = 0;
    this.answered = false;
    this.handleKey = this.handleKey.bind(this);
    document.addEventListener('keydown', this.handleKey);
    this.render();
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKey);
    if (this._autoTimer) clearTimeout(this._autoTimer);
  }

  handleKey(e) {
    if (this.answered && (e.code === 'Space' || e.code === 'ArrowRight')) {
      e.preventDefault(); this.nextQuestion();
    }
  }

  getWrongAnswers(correct, isSloToEng) {
    // Determine category of the correct answer to match distractors to same type
    const cat = getCategory(correct);

    // Build distractor pool from ALL units (not just current dataset)
    // Pick the same language side as the correct answer
    const pool = ALL_UNITS_POOL.length > 0 ? ALL_UNITS_POOL : MASTER_DATA;
    const candidates = [...new Set(
      pool
        .map(item => isSloToEng
          ? (item.answer   ?? item.english   ?? "")
          : (item.question ?? item.slovenian ?? ""))
        .filter(a => a && a !== correct && getCategory(a) === cat)
    )];

    return shuffle(candidates).slice(0, 3);
  }

  render() {
    updateScoreHUD(this.score, this.streak);
    const area = document.getElementById('quizArea');
    if (!area) return;

    if (!this.cards || this.cards.length === 0) {
      area.innerHTML = `<div class="quiz-empty">Ni kartic za izbrane filtre 😕<br><small>Označite vsaj eno kategorijo.</small></div>`;
      return;
    }

    const card    = this.cards[this.index];
    const correct = card.back;
    const wrongs  = this.getWrongAnswers(correct, card.isSloToEng);
    const options = shuffle([correct, ...wrongs]);
    const mult    = getMultiplier(this.streak);

    area.innerHTML = `
      <div class="quiz-meta">
        <div class="quiz-counter">Vprašanje ${this.index + 1} / ${this.cards.length}</div>
      </div>
      <div class="quiz-progress-wrap">
        <div class="quiz-progress-fill" style="width:${((this.index+1)/this.cards.length*100)}%"></div>
      </div>
      <div class="quiz-question-card ${card.isSloToEng ? 'mode-question' : 'mode-answer'}">
        <span class="card-mode-icon">${card.isSloToEng ? '🔍' : '💡'}</span>
        <div class="quiz-question-text">${escapeHtml(card.front)}</div>
      </div>
      ${mult > 1 ? `<div class="quiz-mult-notify">🔥 Množilnik <strong>×${mult}</strong> aktiven!</div>` : ''}
      <div class="quiz-options" id="quizOptions">
        ${options.map((opt, i) => `
          <button class="quiz-option" data-answer="${escapeHtml(opt)}" data-correct="${escapeHtml(correct)}">
            <span class="opt-letter">${['A','B','C','D'][i]}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quizFeedback"></div>
      <button class="quiz-next-btn" id="quizNextBtn" style="display:none">
        ${this.index + 1 < this.cards.length ? 'Naslednje vprašanje ➡️' : '🏁 Končaj krog'}
      </button>
    `;

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn));
    });
    document.getElementById('quizNextBtn').addEventListener('click', () => this.nextQuestion());
  }

  checkAnswer(btn) {
    if (this.answered) return;
    this.answered = true;

    const selected = btn.dataset.answer;
    const correct  = btn.dataset.correct;
    const isCorrect = selected === correct;
    const mult = getMultiplier(this.streak);

    document.querySelectorAll('.quiz-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correct) b.classList.add('correct');
      else if (b === btn && !isCorrect) b.classList.add('wrong');
    });

    const prevRank = getRank(this.score);
    const feedback = document.getElementById('quizFeedback');

    if (isCorrect) {
      SoundFX.correct();
      this.streak++;
      const pts = getMultiplier(this.streak);
      this.score += pts;
      localStorage.setItem(SCORE_KEY, this.score);
      const newMult = getMultiplier(this.streak);
      feedback.className = 'quiz-feedback feedback-correct';
      feedback.innerHTML = `✅ Pravilno! <strong>+${pts} točk${pts > 1 ? ` (×${pts})` : ''}</strong>${newMult > mult ? `<br>🔥 Množilnik ×${newMult} aktiviran!` : this.streak >= 2 ? `<br>🔥 Niz: ${this.streak} zapored!` : ''}`;
    } else {
      SoundFX.wrong();
      this.streak = 0;
      this.score = Math.max(0, this.score - 1);
      localStorage.setItem(SCORE_KEY, this.score);
      feedback.className = 'quiz-feedback feedback-wrong';
      feedback.innerHTML = `❌ Narobe! <strong>-1 točka</strong> · Pravilen odgovor: <strong>${escapeHtml(correct)}</strong>`;
    }

    updateScoreHUD(this.score, this.streak);

    // Rank-up check
    const newRank = getRank(this.score);
    if (isCorrect && newRank.name !== prevRank.name) this.showRankUp(newRank);

    const nextBtn = document.getElementById('quizNextBtn');
    if (nextBtn) nextBtn.style.display = 'inline-flex';

    // Correct = instant advance; wrong = brief pause to see correct answer
    const delay = isCorrect ? 600 : 1800;
    this._autoTimer = setTimeout(() => this.nextQuestion(), delay);
  }

  showRankUp(rank) {
    SoundFX.rankUp();
    const banner = document.createElement('div');
    banner.className = 'rank-up-banner';
    banner.innerHTML = `
      <div class="rank-up-inner">
        ${getMedalSVG(rank.name, 80)}
        <div class="rank-up-text">
          <div class="rank-up-title">🎖️ Napredovanje!</div>
          <div class="rank-up-name" style="color:${rank.glow}">${rank.name}</div>
          <div class="rank-up-sub">Čestitke!</div>
        </div>
      </div>`;
    document.body.appendChild(banner);
    setTimeout(() => { banner.classList.add('rank-up-hide'); setTimeout(() => banner.remove(), 600); }, 3500);
  }

  nextQuestion() {
    if (this._autoTimer) clearTimeout(this._autoTimer);
    this.answered = false;
    const next = this.index + 1;
    if (next >= this.cards.length) {
      this.cards = shuffle([...this.cards]);
      this.index = 0;
    } else {
      this.index = next;
    }
    this.render();
  }
}

// ── Flashcard App ─────────────────────────────────────────────────────────────
class FlashcardApp {
  constructor(cards) {
    this.cards        = cards;
    this.currentIndex = 0;
    this.isFlipped    = false;
    this.touchStartX  = 0;
    this.touchEndX    = 0;
    this.handleKey    = this.handleKey.bind(this);
    this.initializeElements();
    this.setupEventListeners();
    this.setupAudio();
    this.updateDisplay();
  }

  initializeElements() {
    this.cardElement    = document.getElementById('flashcard');
    this.cardFront      = document.getElementById('cardFront');
    this.cardBack       = document.getElementById('cardBack');
    this.cardCounter    = document.getElementById('cardCounter');
    this.progressBar    = document.getElementById('progressBar');
    this.directionBadge = document.getElementById('directionBadge');
    this.prevBtn        = document.getElementById('prevBtn');
    this.nextBtn        = document.getElementById('nextBtn');
  }

  setupAudio() {}

  setupEventListeners() {
    this.cardElement.onclick      = () => this.flipCard();
    this.prevBtn.onclick          = () => this.previousCard();
    this.nextBtn.onclick          = () => this.nextCard();
    document.addEventListener('keydown', this.handleKey);
    this.cardElement.ontouchstart = e => { this.touchStartX = e.changedTouches[0].screenX; };
    this.cardElement.ontouchend   = e => { this.touchEndX = e.changedTouches[0].screenX; this.handleSwipe(); };
  }

  destroy() { document.removeEventListener('keydown', this.handleKey); }

  handleKey(e) {
    if (!this.cards || this.cards.length === 0) return;
    switch (e.code) {
      case 'ArrowLeft':  e.preventDefault(); this.previousCard(); break;
      case 'ArrowRight': e.preventDefault(); this.nextCard();     break;
      case 'Space':      e.preventDefault(); this.flipCard();     break;
    }
  }

  handleSwipe() {
    if (!this.cards || this.cards.length === 0) return;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 50) { diff > 0 ? this.nextCard() : this.previousCard(); }
  }

  flipCard() {
    if (!this.cards || this.cards.length === 0) return;
    this.isFlipped = !this.isFlipped;
    this.cardElement.classList.toggle('flipped', this.isFlipped);
    // Re-fit the now-visible face (hidden faces have no layout dimensions)
    const visibleFace = this.isFlipped ? this.cardBack : this.cardFront;
    setTimeout(() => autoFitCardText(visibleFace), 50);
  }

  previousCard() {
    if (!this.cards || this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    this.updateDisplay();
  }

  nextCard() {
    if (!this.cards || this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.cards || this.cards.length === 0) {
      setFaceText(this.cardFront, "Ni kartic za izbrane filtre 😕");
      setFaceText(this.cardBack,  "Označite vsaj eno kategorijo.");
      const imgEl = document.getElementById('cardImage');
      if (imgEl) imgEl.style.display = 'none';
      this.cardCounter.textContent = 'Kartica 0 od 0';
      if (this.progressBar) this.progressBar.style.width = '0%';
      if (this.directionBadge) this.directionBadge.style.display = 'none';
      this.prevBtn.disabled = this.nextBtn.disabled = true;
      this.isFlipped = false;
      this.cardElement.classList.remove('flipped');
      return;
    }
    const card = this.cards[this.currentIndex];
    setFaceText(this.cardFront, card.front);
    setFaceText(this.cardBack,  card.back);
    maybeShowCardImage(card);
    this.isFlipped = false;
    this.cardElement.classList.remove('flipped');

    // ── Visual mode indicator ──────────────────────────────────────────────
    this.cardElement.classList.remove('mode-question', 'mode-answer');

    // Ensure one icon on each face
    let iconFront = this.cardFront.querySelector('.card-mode-icon');
    if (!iconFront) {
      iconFront = document.createElement('span');
      iconFront.className = 'card-mode-icon';
      this.cardFront.appendChild(iconFront);
    }
    let iconBack = this.cardBack.querySelector('.card-mode-icon');
    if (!iconBack) {
      iconBack = document.createElement('span');
      iconBack.className = 'card-mode-icon';
      this.cardBack.appendChild(iconBack);
    }

    if (card.isSloToEng) {
      // Front = question, Back = answer
      this.cardElement.classList.add('mode-question');
      iconFront.textContent = '🔍';  iconFront.title = 'Vprašanje';
      iconBack.textContent  = '💡';  iconBack.title  = 'Odgovor';
    } else {
      // Front = answer, Back = question
      this.cardElement.classList.add('mode-answer');
      iconFront.textContent = '💡';  iconFront.title = 'Odgovor';
      iconBack.textContent  = '🔍';  iconBack.title  = 'Vprašanje';
    }
    // ──────────────────────────────────────────────────────────────────────

    this.cardCounter.textContent = `Kartica ${this.currentIndex + 1} od ${this.cards.length}`;
    if (this.progressBar) this.progressBar.style.width = ((this.currentIndex+1)/this.cards.length*100)+'%';
    if (this.directionBadge) this.directionBadge.style.display = 'none';
    this.prevBtn.disabled = this.nextBtn.disabled = false;
  }
}

// ── Timed App ─────────────────────────────────────────────────────────────────
class TimedApp {
  constructor(cards) {
    this.allCards   = shuffle([...cards]);
    this.levelIndex = 0;
    this.answered   = false;
    this.timer      = null;
    this._autoTimer = null;
    this.overlay    = null;
    this.handleKey  = this.handleKey.bind(this);
    document.addEventListener('keydown', this.handleKey);
    this.startLevel();
  }

  destroy() {
    if (this.timer)      clearInterval(this.timer);
    if (this._autoTimer) clearTimeout(this._autoTimer);
    document.removeEventListener('keydown', this.handleKey);
    this.removeOverlay();
  }

  handleKey(e) {
    if (this.answered && (e.code === 'Space' || e.code === 'ArrowRight')) {
      e.preventDefault(); this.nextQuestion();
    }
  }

  get level() { return TIMED_LEVELS[this.levelIndex]; }

  startLevel() {
    if (this.timer) clearInterval(this.timer);
    if (this._autoTimer) clearTimeout(this._autoTimer);
    this.removeOverlay();
    this.timeLeft     = this.level.timeLimit;
    this.score        = 0;
    this.streak       = 0;
    this.index        = 0;
    this.timerStarted = false;
    this.cards        = shuffle([...this.allCards]);
    this.answered     = false;
    this.timer        = null;
    this.render();
  }

  tick() {
    this.timeLeft--;
    this.updateTimerDisplay();
    if (this.timeLeft <= 0) {
      clearInterval(this.timer); this.timer = null;
      if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
      if (this.score >= this.level.target) {
        this.advanceLevel();
      } else {
        this.showGameOver();
      }
    }
  }

  updateTimerDisplay() {
    const el = document.getElementById('timedClock');
    const tm = document.getElementById('timedClockTime');
    if (!el || !tm) return;
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    tm.textContent = `${m}:${String(s).padStart(2,'0')}`;
    el.className = 'timed-clock';
    if (this.timeLeft <= 10) el.classList.add('danger');
    else if (this.timeLeft <= 25) el.classList.add('warn');
    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    const sd = document.getElementById('timedScoreDisplay');
    const pf = document.getElementById('timedProgressFill');
    const pl = document.getElementById('timedProgressLabel');
    const st = document.getElementById('timedStreakDisplay');
    if (sd) sd.innerHTML = `<strong>${this.score}</strong> <span>/ ${this.level.target} točk</span>`;
    if (pf) {
      const pct = Math.min(100, Math.round((this.score / this.level.target) * 100));
      pf.style.width = pct + '%';
      pf.style.background = pct >= 100
        ? 'linear-gradient(90deg, #28a745, #ffe066)'
        : `linear-gradient(90deg, ${this.level.color}, ${this.level.glow})`;
    }
    if (pl) {
      const remaining = Math.max(0, this.level.target - this.score);
      pl.textContent = remaining > 0 ? `Manjka še ${remaining} točk` : '🎯 Cilj dosežen!';
    }
    if (st) {
      if (this.streak >= 2) {
        const mult = getMultiplier(this.streak);
        st.innerHTML = `🔥 ${this.streak}× ${mult > 1 ? `<strong>×${mult}</strong>` : ''}`;
        st.style.display = 'inline-flex';
      } else {
        st.style.display = 'none';
      }
    }
  }

  getWrongAnswers(correct, isSloToEng) {
    const cat = getCategory(correct);
    const pool = ALL_UNITS_POOL.length > 0 ? ALL_UNITS_POOL : MASTER_DATA;
    const candidates = [...new Set(
      pool.map(item => isSloToEng
        ? (item.answer   ?? item.english   ?? "")
        : (item.question ?? item.slovenian ?? ""))
        .filter(a => a && a !== correct && getCategory(a) === cat)
    )];
    return shuffle(candidates).slice(0, 3);
  }

  render() {
    const area = document.getElementById('timedArea');
    if (!area) return;
    if (!this.cards || this.cards.length === 0) {
      area.innerHTML = `<div class="quiz-empty">Ni kartic za izbrane filtre 😕</div>`;
      return;
    }

    const card    = this.cards[this.index % this.cards.length];
    const correct = card.back;
    const wrongs  = this.getWrongAnswers(correct, card.isSloToEng);
    const options = shuffle([correct, ...wrongs]);
    const mult    = getMultiplier(this.streak);
    const timeM   = Math.floor(this.timeLeft / 60);
    const timeS   = this.timeLeft % 60;
    const clockCls = this.timeLeft <= 10 ? 'timed-clock danger' : this.timeLeft <= 25 ? 'timed-clock warn' : 'timed-clock';
    const clockContent = this.timerStarted
      ? `<div class="timed-clock-label">Čas</div>
         <div class="timed-clock-time" id="timedClockTime">${timeM}:${String(timeS).padStart(2,'0')}</div>`
      : `<div class="timed-clock-label">Čas</div>
         <div class="timed-clock-time timed-clock-ready" id="timedClockTime">${timeM}:${String(timeS).padStart(2,'0')}</div>
         <div class="timed-clock-waiting">odgovori za start</div>`;
    const pct     = Math.min(100, Math.round((this.score / this.level.target) * 100));
    const streakHTML = this.streak >= 2
      ? `<span class="timed-streak" id="timedStreakDisplay">🔥 ${this.streak}× ${mult > 1 ? `<strong>×${mult}</strong>` : ''}</span>`
      : `<span class="timed-streak" id="timedStreakDisplay" style="display:none"></span>`;

    area.innerHTML = `
      <!-- HEADER -->
      <div class="timed-header">
        <div class="timed-level-badge">
          ${getMedalSVG(this.level.medal, 36)}
          <div>
            <div class="timed-level-name" style="color:${this.level.glow}">
              ${this.level.medal}
            </div>
            <div style="font-size:0.67rem;color:rgba(255,255,255,0.38);margin-top:2px">${this.level.hint}</div>
          </div>
        </div>
        <div class="${clockCls}" id="timedClock">
          ${clockContent}
        </div>
      </div>

      <!-- SCORE ROW -->
      <div class="timed-score-row">
        <div class="timed-score-display" id="timedScoreDisplay">
          <strong>${this.score}</strong> <span>/ ${this.level.target} točk</span>
        </div>
        ${streakHTML}
      </div>

      <!-- PROGRESS BAR -->
      <div class="timed-progress-wrap">
        <div class="timed-progress-fill" id="timedProgressFill"
          style="width:${pct}%;background:linear-gradient(90deg,${this.level.color},${this.level.glow})"></div>
      </div>
      <div class="timed-progress-label" id="timedProgressLabel">
        ${Math.max(0, this.level.target - this.score) > 0 ? `Manjka še ${this.level.target - this.score} točk` : '🎯 Cilj dosežen!'}
      </div>

      <!-- DIRECTION -->
      <div class="quiz-meta">
        <div class="quiz-counter">Vprašanje ${(this.index % this.cards.length) + 1} / ${this.cards.length}</div>
        <div class="quiz-direction-badge ${card.isSloToEng ? 'slo-to-eng' : 'eng-to-slo'}">
          ${card.isSloToEng ? 'SLO → EN' : 'EN → SLO'}
        </div>
      </div>

      <!-- QUESTION -->
      <div class="quiz-question-card ${card.isSloToEng ? 'mode-question' : 'mode-answer'}">
        <span class="card-mode-icon">${card.isSloToEng ? '🔍' : '💡'}</span>
        <div class="quiz-question-text">${escapeHtml(card.front)}</div>
      </div>

      ${mult > 1 ? `<div class="timed-mult-notify">🔥 Množilnik <strong>×${mult}</strong> aktiven!</div>` : ''}

      <!-- OPTIONS -->
      <div class="quiz-options" id="timedOptions">
        ${options.map((opt, i) => `
          <button class="quiz-option" data-answer="${escapeHtml(opt)}" data-correct="${escapeHtml(correct)}">
            <span class="opt-letter">${['A','B','C','D'][i]}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>

      <div class="quiz-feedback" id="timedFeedback"></div>
      <div class="overlay-penalty-note">❗ Napačen odgovor: −1 točka in ponastavitev niza</div>
    `;

    document.querySelectorAll('#timedOptions .quiz-option').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn));
    });
  }

  checkAnswer(btn) {
    if (this.answered) return;
    this.answered = true;

    const selected  = btn.dataset.answer;
    const correct   = btn.dataset.correct;
    const isCorrect = selected === correct;
    const mult      = getMultiplier(this.streak);

    // Start the countdown on the very first answer
    if (!this.timerStarted) {
      this.timerStarted = true;
      this.timer = setInterval(() => this.tick(), 1000);
    }

    document.querySelectorAll('#timedOptions .quiz-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correct) b.classList.add('correct');
      else if (b === btn && !isCorrect) b.classList.add('wrong');
    });

    const feedback = document.getElementById('timedFeedback');

    if (isCorrect) {
      SoundFX.correct();
      this.streak++;
      const pts = getMultiplier(this.streak);
      this.score += pts;
      const newMult = getMultiplier(this.streak);
      if (feedback) {
        feedback.className = 'quiz-feedback feedback-correct';
        feedback.innerHTML = `✅ Pravilno! <strong>+${pts} točk${pts > 1 ? ` (×${pts})` : ''}</strong>${newMult > mult ? `<br>🔥 Množilnik ×${newMult} aktiviran!` : this.streak >= 2 ? `<br>🔥 Niz: ${this.streak} zapored!` : ''}`;
      }
    } else {
      SoundFX.wrong();
      this.streak = 0;
      this.score  = Math.max(0, this.score - 1);
      if (feedback) {
        feedback.className = 'quiz-feedback feedback-wrong';
        feedback.innerHTML = `❌ Narobe! <strong>-1 točka</strong> · Pravilen odgovor: <strong>${escapeHtml(correct)}</strong>`;
      }
    }
    this.updateScoreDisplay();

    // Check if target hit mid-question
    if (this.score >= this.level.target && this.timer) {
      // Let timer naturally expire OR advance immediately after brief pause
      // We just keep going and let the timer check handle it
    }

    this._autoTimer = setTimeout(() => this.nextQuestion(), isCorrect ? 500 : 1600);
  }

  nextQuestion() {
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
    // Stop if time ran out
    if (!this.timer && this.timeLeft <= 0) return;
    this.answered = false;
    this.index++;
    if (this.index >= this.cards.length) {
      this.cards = shuffle([...this.allCards]);
      this.index = 0;
    }
    this.render();
  }

  advanceLevel() {
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
    this.answered = true;
    if (this.levelIndex >= TIMED_LEVELS.length - 1) {
      this.showVictory();
      return;
    }
    this.showLevelComplete();
  }

  removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  showGameOver() {
    SoundFX.wrong();
    SoundFX.wrong();
    this.removeOverlay();
    const div = document.createElement('div');
    div.className = 'timed-overlay';
    div.innerHTML = `
      <div class="timed-overlay-box">
        <div class="overlay-game-over-title">KONEC IGRE</div>
        <div class="overlay-divider"></div>
        ${getMedalSVG(this.level.medal, 64)}
        <div style="color:rgba(255,255,255,0.55);font-size:0.9rem">
          Raven: <strong style="color:#fff">${this.level.medal}</strong>
        </div>
        <div>
          <div class="overlay-score-label">Zbrane točke</div>
          <div class="overlay-score-big">${this.score}</div>
          <div class="overlay-score-label">cilj: ${this.level.target}</div>
        </div>
        <div class="overlay-subtitle">
          Manjkalo je ${this.level.target - this.score} točk. Poskusi znova! 💪
        </div>
        <button class="overlay-btn overlay-btn-retry" id="retryBtn">↺ Poskusi znova</button>
        <button class="overlay-btn overlay-btn-restart" id="restartBtn">⏮ Začni od začetka</button>
      </div>
    `;
    document.body.appendChild(div);
    this.overlay = div;
    div.querySelector('#retryBtn').addEventListener('click', () => this.startLevel());
    div.querySelector('#restartBtn').addEventListener('click', () => {
      this.levelIndex = 0;
      this.startLevel();
    });
  }

  showLevelComplete() {
    SoundFX.rankUp();
    this.removeOverlay();
    const nextLevel = TIMED_LEVELS[this.levelIndex + 1];
    const div = document.createElement('div');
    div.className = 'timed-overlay';
    div.innerHTML = `
      <div class="timed-overlay-box">
        <div class="overlay-level-complete-title">⭐ Raven opravljena!</div>
        <div class="overlay-divider"></div>
        ${getMedalSVG(this.level.medal, 72)}
        <div class="overlay-score-big" style="color:${this.level.glow}">${this.score}</div>
        <div class="overlay-score-label">točk / cilj ${this.level.target}</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.9rem;text-align:center">
          Naslednja raven:<br>
          <strong style="color:${nextLevel.glow};font-size:1rem">${nextLevel.medal}</strong><br>
          <span style="font-size:0.8rem;color:rgba(255,255,255,0.4)">${nextLevel.hint}</span>
        </div>
        <button class="overlay-btn overlay-btn-next" id="nextLevelBtn">Naprej ➡️</button>
      </div>
    `;
    document.body.appendChild(div);
    this.overlay = div;
    div.querySelector('#nextLevelBtn').addEventListener('click', () => {
      this.levelIndex++;
      this.startLevel();
    });
  }

  showVictory() {
    SoundFX.rankUp();
    setTimeout(() => SoundFX.rankUp(), 600);
    this.removeOverlay();
    const div = document.createElement('div');
    div.className = 'timed-overlay';
    div.innerHTML = `
      <div class="timed-overlay-box">
        <div class="overlay-victory-title" style="color:${this.level.glow}">🏆 PRVAK! 🏆</div>
        <div class="overlay-divider"></div>
        ${getMedalSVG(this.level.medal, 80)}
        <div class="overlay-score-big" style="color:${this.level.glow}">${this.score}</div>
        <div class="overlay-score-label">točk na zlati ravni</div>
        <div class="overlay-subtitle">
          Čestitke! Premagal si vse ravni tekme s časom. 🎖️
        </div>
        <button class="overlay-btn overlay-btn-restart" id="playAgainBtn">🔄 Igraj znova</button>
      </div>
    `;
    document.body.appendChild(div);
    this.overlay = div;
    div.querySelector('#playAgainBtn').addEventListener('click', () => {
      this.levelIndex = 0;
      this.startLevel();
    });
  }
}



// ── Cloze App ─────────────────────────────────────────────────────────────────
class ClozeApp {
  constructor(data) {
    this.data      = shuffle([...data]); // randomise on every new session
    this.index     = 0;
    this.level     = null;    // null=front, 1=vajenec, 2=mojster
    this.revealed  = false;   // full answer shown?
    this.results   = [];      // {question, answer, knew}
    this.done      = false;
    this.handleKey = this.handleKey.bind(this);
    document.addEventListener('keydown', this.handleKey);
    this.render();
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKey);
  }

  handleKey(e) {
    if (this.done) return;
    if (!this.level) {
      if (e.code === 'Digit1' || e.code === 'Numpad1') this.showLevel(1);
      if (e.code === 'Digit2' || e.code === 'Numpad2') this.showLevel(2);
    } else if (!this.revealed) {
      if (e.code === 'Space' || e.code === 'ArrowDown') { e.preventDefault(); this.revealAnswer(); }
    } else {
      if (e.code === 'ArrowRight' || e.code === 'KeyY') { e.preventDefault(); this.gradeCard(true); }
      if (e.code === 'ArrowLeft'  || e.code === 'KeyN') { e.preventDefault(); this.gradeCard(false); }
    }
  }

  render() {
    const area = document.getElementById('clozeArea');
    if (!area) return;
    if (!this.data || this.data.length === 0) {
      area.innerHTML = `<div class="quiz-empty">Najprej naloži nabor kartic 👆</div>`;
      return;
    }
    if (this.done) { this.renderSummary(); return; }

    const item   = this.data[this.index];
    const total  = this.data.length;
    const isBack = this.level !== null;

    const clozeText = isBack
      ? (this.level === 1
          ? (item.cloze_levels?.level_1 || item.answer)
          : (item.cloze_levels?.level_2 || item.answer))
      : null;

    let backContent = '';
    if (isBack) {
      backContent = `
        <div class="cloze-level-label">${this.level === 1 ? '🔰 Vajenec' : '⚔️ Mojster'}</div>
        <div class="cloze-answer-text">${this.renderCloze(clozeText || '')}</div>
        ${this.revealed ? `
          <div class="cloze-reveal-box">
            <div class="cloze-reveal-label">✅ Celoten odgovor:</div>
            <div class="cloze-reveal-text">${escapeHtml(item.answer)}</div>
          </div>
          <div class="cloze-grade-btns">
            <button class="cloze-grade-btn cloze-retry" id="clozeRetry">❌ Še vadim</button>
            <button class="cloze-grade-btn cloze-knew" id="clozeKnew">✅ Znal/a sem</button>
          </div>
          <div class="cloze-grade-hint">← Še vadim &nbsp;·&nbsp; Znal/a sem →</div>
        ` : `
          <button class="cloze-reveal-btn" id="clozeRevealBtn">👁️ Pokaži rešitev</button>
          <div class="cloze-grade-hint">Odgovori ustno, nato preveri</div>
        `}
      `;
    }

    area.innerHTML = `
      <div class="cloze-counter">Kartica ${this.index + 1} od ${total}</div>
      <div class="cloze-progress-wrap">
        <div class="cloze-progress-fill" style="width:${((this.index + 1) / total) * 100}%"></div>
      </div>
      <div class="cloze-card-container">
        <div class="cloze-card ${isBack ? 'cloze-flipped' : ''}" id="clozeCard">
          <div class="cloze-face cloze-front">
            <div class="cloze-level-btns">
              <button class="cloze-level-btn cloze-l1" id="clozeL1" title="Vajenec – prvi znaki vidni">🔰 Vajenec</button>
              <button class="cloze-level-btn cloze-l2" id="clozeL2" title="Mojster – besede skrite">⚔️ Mojster</button>
            </div>
            <div class="cloze-question-text">${escapeHtml(item.question)}</div>
            <div class="cloze-hint">Izberi stopnjo ↑</div>
          </div>
          <div class="cloze-face cloze-back">${backContent}</div>
        </div>
      </div>
      <div class="keyboard-hint">💡 1/2 za stopnjo · Presledek za rešitev · ←/→ za oceno</div>
    `;

    document.getElementById('clozeL1')?.addEventListener('click', () => this.showLevel(1));
    document.getElementById('clozeL2')?.addEventListener('click', () => this.showLevel(2));
    document.getElementById('clozeRevealBtn')?.addEventListener('click', () => this.revealAnswer());
    document.getElementById('clozeKnew')?.addEventListener('click', () => this.gradeCard(true));
    document.getElementById('clozeRetry')?.addEventListener('click', () => this.gradeCard(false));

    // Auto-size card to tallest face so buttons are never hidden
    requestAnimationFrame(() => {
      const card  = document.getElementById('clozeCard');
      const front = card?.querySelector('.cloze-front');
      const back  = card?.querySelector('.cloze-back');
      if (!card || !front || !back) return;
      // Temporarily flatten back face (rotateY 180°) to measure its true height
      back.style.transform   = 'rotateY(0deg)';
      back.style.visibility  = 'hidden';
      const backH  = back.scrollHeight;
      back.style.transform   = '';
      back.style.visibility  = '';
      const frontH = front.scrollHeight;
      card.style.height = Math.max(frontH, backH, 200) + 4 + 'px';
    });
  }

  renderSummary() {
    const area  = document.getElementById('clozeArea');
    const knew  = this.results.filter(r => r.knew);
    const retry = this.results.filter(r => !r.knew);
    const pct   = Math.round((knew.length / this.results.length) * 100);
    const medal = pct === 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 40 ? '📚' : '💪';

    const listHtml = (items, cls) => items.length === 0
      ? `<div class="cloze-sum-empty">—</div>`
      : items.map(r => `
          <div class="cloze-sum-item ${cls}">
            <span class="cloze-sum-q">${escapeHtml(r.question)}</span>
            <span class="cloze-sum-a">${escapeHtml(r.answer)}</span>
          </div>`).join('');

    area.innerHTML = `
      <div class="cloze-summary">
        <div class="cloze-sum-medal">${medal}</div>
        <div class="cloze-sum-score">${knew.length} / ${this.results.length} <span>(${pct}%)</span></div>
        <div class="cloze-sum-subtitle">pravilnih odgovorov</div>
        <div class="cloze-sum-sections">
          <div class="cloze-sum-section">
            <div class="cloze-sum-heading cloze-sum-knew-head">✅ Znal/a sem (${knew.length})</div>
            <div class="cloze-sum-list">${listHtml(knew, 'knew')}</div>
          </div>
          <div class="cloze-sum-section">
            <div class="cloze-sum-heading cloze-sum-retry-head">❌ Še vadim (${retry.length})</div>
            <div class="cloze-sum-list">${listHtml(retry, 'retry')}</div>
          </div>
        </div>
        <button class="cloze-restart-btn" id="clozeRestartBtn">🔄 Ponovi vse kartice</button>
        ${retry.length > 0 ? `<button class="cloze-restart-btn cloze-retry-only-btn" id="clozeRetryOnlyBtn">❌ Ponovi samo neznane (${retry.length})</button>` : ''}
      </div>
    `;

    document.getElementById('clozeRestartBtn')?.addEventListener('click', () => this.restart(false));
    document.getElementById('clozeRetryOnlyBtn')?.addEventListener('click', () => this.restart(true));
  }

  renderCloze(text) {
    // Wrap [first-letter + underscores + any trailing punctuation] in a nowrap span
    // so nothing following a blank word can drift to the next line
    return escapeHtml(text).replace(/([A-Za-zčšžČŠŽ])(_{2,})([.,;:!?]?)/g,
      (_, letter, blanks, punct) =>
        `<span class="cloze-word">${letter}<span class="cloze-blank">${blanks}</span>${punct}</span>`
    );
  }

  showLevel(n) {
    this.level    = n;
    this.revealed = false;
    this.render();
    requestAnimationFrame(() => {
      const card = document.getElementById('clozeCard');
      if (card) card.classList.add('cloze-flipped');
    });
  }

  revealAnswer() {
    this.revealed = true;
    this.render();
    requestAnimationFrame(() => {
      const card = document.getElementById('clozeCard');
      if (card) card.classList.add('cloze-flipped');
    });
  }

  gradeCard(knew) {
    const item = this.data[this.index];
    this.results.push({ question: item.question, answer: item.answer, knew });
    SoundFX[knew ? 'correct' : 'wrong']();
    this.index++;
    this.level    = null;
    this.revealed = false;
    if (this.index >= this.data.length) this.done = true;
    this.render();
  }

  restart(retryOnly) {
    if (retryOnly) {
      const toRetry = this.results.filter(r => !r.knew).map(r => r.question);
      this.data = shuffle(this.data.filter(item => toRetry.includes(item.question)));
    } else {
      this.data = shuffle([...this.data]);
    }
    this.index    = 0;
    this.level    = null;
    this.revealed = false;
    this.results  = [];
    this.done     = false;
    this.render();
  }
}

function reinitClozeApp() {
  if (window.clozeApp) { window.clozeApp.destroy(); window.clozeApp = null; }
  if (MASTER_DATA.length === 0) {
    const area = document.getElementById('clozeArea');
    if (area) area.innerHTML = `<div class="quiz-empty">Najprej naloži nabor kartic 👆</div>`;
    return;
  }
  window.clozeApp = new ClozeApp(MASTER_DATA);
}

function switchMode(mode) {
  currentMode = mode;
  const fcPanel  = document.getElementById('flashcardPanel');
  const qzPanel  = document.getElementById('quizPanel');
  const tmPanel  = document.getElementById('timedPanel');
  const czPanel  = document.getElementById('clozePanel');
  const scoreHUD = document.getElementById('scoreHUD');
  const sel      = document.getElementById('modeSelect');
  if (sel && sel.value !== mode) sel.value = mode;

  if (window.app)       { window.app.destroy();       window.app       = null; }
  if (window.quizApp)   { window.quizApp.destroy();    window.quizApp   = null; }
  if (window.timedApp)  { window.timedApp.destroy();   window.timedApp  = null; }
  if (window.clozeApp)  { window.clozeApp.destroy();   window.clozeApp  = null; }

  fcPanel.style.display  = 'none';
  qzPanel.style.display  = 'none';
  if (tmPanel) tmPanel.style.display = 'none';
  if (czPanel) czPanel.style.display = 'none';
  scoreHUD.style.display = 'none';

  if (mode === 'flashcard') {
    fcPanel.style.display = 'flex';
    clearDomListeners();
    const cards = applyFilters();
    window.app = new FlashcardApp(cards);
  } else if (mode === 'quiz') {
    qzPanel.style.display  = 'flex';
    scoreHUD.style.display = 'flex';
    reinitQuizApp();
  } else if (mode === 'timed') {
    if (tmPanel) tmPanel.style.display = 'flex';
    reinitTimedApp();
  } else if (mode === 'cloze') {
    if (czPanel) czPanel.style.display = 'flex';
    reinitClozeApp();
  }
}

function reinitFlashcardApp() {
  if (window.app) { window.app.destroy(); window.app = null; }
  clearDomListeners();
  const cards = applyFilters();
  window.app = new FlashcardApp(cards);
}

function reinitQuizApp() {
  if (window.quizApp) { window.quizApp.destroy(); window.quizApp = null; }
  if (MASTER_DATA.length === 0) {
    const area = document.getElementById('quizArea');
    if (area) area.innerHTML = `<div class="quiz-empty">Najprej naloži nabor kartic 👆</div>`;
    return;
  }
  const cards = applyFilters();
  window.quizApp = new QuizApp(cards);
}

function reinitTimedApp() {
  if (window.timedApp) { window.timedApp.destroy(); window.timedApp = null; }
  if (MASTER_DATA.length === 0) {
    const area = document.getElementById('timedArea');
    if (area) area.innerHTML = `<div class="quiz-empty">Najprej naloži nabor kartic 👆</div>`;
    return;
  }
  const cards = applyFilters();
  window.timedApp = new TimedApp(cards);
}


// ── Load full distractor pool from ALL unit files for current subject ─────────
async function loadAllUnitsPool() {
  // Build the pool from all datasets belonging to the current subject
  const subjectDatasets = DATASETS.filter(d => d.subject === currentSubject);
  const urlSet = new Set();
  subjectDatasets.forEach(ds => {
    if (ds.combined) ds.combined.forEach(u => urlSet.add(u));
    else if (ds.url) urlSet.add(ds.url);
  });
  const t = Date.now();
  let combined = [];
  for (const url of urlSet) {
    try {
      const resp = await fetch(url + '?t=' + t);
      if (resp.ok) combined = combined.concat(await resp.json());
    } catch(e) {}
  }
  ALL_UNITS_POOL = combined;
}

// ── Init ──────────────────────────────────────────────────────────────────────
buildSubjectSelect();
buildDatasetSelect();
const reloadBtn = document.getElementById("reloadBtn");

// Subject change
document.getElementById("subject").addEventListener("change", function() {
  currentSubject = this.value;
  localStorage.setItem(SUBJECT_KEY, currentSubject);
  buildDatasetSelect();
  // Reset cards
  MASTER_DATA = [];
  ALL_UNITS_POOL = [];
  if (window.app)     { window.app.destroy();    window.app     = null; }
  if (window.quizApp) { window.quizApp.destroy(); window.quizApp = null; }
  clearDomListeners();
  const ds = currentDataset();
  if (!ds) {
    setFaceText(document.getElementById('cardFront'), "Ta predmet še nima naborov 📚");
    setFaceText(document.getElementById('cardBack'),  "Kmalu prihaja!");
    ['prevBtn','nextBtn'].forEach(id => { const b = document.getElementById(id); if(b) b.disabled = true; });
    return;
  }
  loadAllUnitsPool().then(() => reloadBtn.click());
});

function clearDomListeners() {
  ['prevBtn','nextBtn','flashcard'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
  });
}

function reinitApp() {
  if (currentMode === 'flashcard') reinitFlashcardApp();
  else if (currentMode === 'quiz') reinitQuizApp();
  else if (currentMode === 'timed') reinitTimedApp();
  else if (currentMode === 'cloze') reinitClozeApp();
}



reloadBtn.addEventListener("click", async () => {
  const ds = currentDataset();
  if (!ds) return;
  localStorage.setItem(SELECT_KEY, ds.id);
  if (window.app)       { window.app.destroy();       window.app       = null; }
  if (window.quizApp)   { window.quizApp.destroy();    window.quizApp   = null; }
  if (window.timedApp)  { window.timedApp.destroy();   window.timedApp  = null; }
  if (window.clozeApp)  { window.clozeApp.destroy();   window.clozeApp  = null; }
  clearDomListeners();
  setLoadingUI(true);
  try {
    MASTER_DATA = await fetchRawData(ds);
    if (!MASTER_DATA.length) throw new Error("No cards loaded");
    if (currentMode === 'flashcard') {
      const cards = applyFilters();
      window.app = new FlashcardApp(cards);
    } else if (currentMode === 'quiz') {
      reinitQuizApp();
    } else if (currentMode === 'timed') {
      reinitTimedApp();
    } else if (currentMode === 'cloze') {
      reinitClozeApp();
    }
    // Collapse toolbar once the game is running
    if (typeof collapseToolbar === 'function') collapseToolbar();
  } catch (err) {
    console.error(err);
    setFaceText(document.getElementById('cardFront'), "Napaka pri nalaganju kartic 😢");
    setFaceText(document.getElementById('cardBack'),  "(preveri JSON datoteke)");
  } finally {
    setLoadingUI(false);
  }
});

updateScoreHUD(parseInt(localStorage.getItem(SCORE_KEY) || '0'), 0);
loadAllUnitsPool().then(() => reloadBtn.click());