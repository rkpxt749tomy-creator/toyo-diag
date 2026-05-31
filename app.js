// ---------- localStorage helpers ----------
const LS = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};
function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// ---------- state ----------
const state = LS.get('diag', {view:'intro', answers:{}, currentQ:0, result:null});
function save() { LS.set('diag', state); }

function render() {
  const root = document.getElementById('view');
  if (state.view === 'intro') return renderIntro(root);
  if (state.view === 'questions') return renderQuestions(root);
  if (state.view === 'result') return renderResult(root);
}

function renderIntro(root) {
  root.innerHTML = `
    <div class="hero">
      <p class="hero-eyebrow">25,000人を診てきた柔道整復師・鍼灸師　冨高誠治</p>
      <h1>あなたの不調、どのタイプ？</h1>
      <p class="hero-sub">「異常なし」と言われ続けた体が整いだす<br>たった<b>20問の体質診断</b></p>
      <button id="startBtn" class="btn-primary">3分で診断を始める</button>
      <p class="hero-meta">所要時間 約3分／20問・4択／無料</p>
    </div>

    <section class="block">
      <p>「血液検査は正常です」「MRIも異常ありません」「ストレスでしょうね」――</p>
      <p>病院でそう言われて帰ってきた経験、ありませんか。</p>
      <p>でも体はつらい。朝起きるのがしんどい。頭痛薬が手放せない。めまいがする。眠れない。生理前に別人みたいになる。</p>
      <p>「異常なし」と言われるたびに、<b>「じゃあ、このつらさは気のせいなの？」</b> って思ってきたかもしれません。</p>
      <p>ちがいます。</p>
      <p>東洋医学では、西洋医学の検査では見えない <b>「気・血・水」の乱れ</b> を見ます。そして、その乱れ方には <b>「4つのタイプ」</b> があるんです。</p>
      <p>タイプを間違えて養生しても、整いません。むしろ、合わない養生を続けて <b>余計にしんどくなっている人</b> が、本当に多い。</p>
      <p>この診断は、私が25,000人の患者さんを診てきた中で見えた <b>「あなたが今、どのタイプか」を20問で見極める体質チェック</b> です。</p>
    </section>

    <h3 class="section-title">体験者の声</h3>
    ${DIAG_VOICES.map(v => `
      <div class="voice">
        <div class="voice-head"><b>${escapeHtml(v.name)}</b><span class="tag">${escapeHtml(v.type)}</span></div>
        <p>${escapeHtml(v.body)}</p>
      </div>`).join('')}
    <p class="note">※ すべて個人の感想・体験談です。効果には個人差があります。</p>

    <div class="cta-bottom">
      <button id="startBtn2" class="btn-primary">3分で診断を始める</button>
    </div>

    <section class="disclaimer-block">
      <p>※ 本診断および提供する内容は、<b>医療行為ではありません</b>。</p>
      <p>※ 効果効能を保証するものではなく、<b>あくまでも生活養生（セルフケア）の参考情報</b>です。</p>
      <p>※ 体調・症状に不安のある方、持病・服薬中の方は、<b>必ずかかりつけの医師にご相談</b>のうえお試しください。</p>
      <p>※ 現在医師から処方を受けている方は、自己判断で薬を中止せず主治医にご相談ください。</p>
    </section>
  `;
  ['startBtn','startBtn2'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', start);
  });
}

function start() {
  state.view = 'questions';
  state.currentQ = 0;
  state.answers = {};
  state.result = null;
  save();
  render();
  window.scrollTo({top:0});
}

function renderQuestions(root) {
  const total = DIAG_QUESTIONS.length;
  const idx = state.currentQ;
  const q = DIAG_QUESTIONS[idx];
  const progress = Math.round(((idx) / total) * 100);
  root.innerHTML = `
    <div class="progress"><div class="progress-bar" style="width:${progress}%"></div></div>
    <p class="q-meta">Q${idx + 1} / ${total}</p>
    <div class="card-q">
      <p class="q-text">${escapeHtml(q.text)}</p>
      <div class="choices">
        ${DIAG_CHOICES.map(c => `<button class="choice-btn" data-score="${c.score}">${c.label}</button>`).join('')}
      </div>
    </div>
    <div class="bottom-bar">
      ${idx > 0 ? `<button id="prevBtn" class="btn-sub">← 前へ</button>` : '<span></span>'}
      <button id="resetBtn" class="btn-sub">最初から</button>
    </div>
  `;
  root.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.answers[idx] = parseInt(btn.dataset.score, 10);
      if (idx + 1 >= total) {
        state.result = calcResult();
        state.view = 'result';
      } else {
        state.currentQ = idx + 1;
      }
      save();
      render();
      window.scrollTo({top:0});
    });
  });
  document.getElementById('prevBtn')?.addEventListener('click', () => {
    state.currentQ = Math.max(0, idx - 1);
    save(); render(); window.scrollTo({top:0});
  });
  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (!confirm('診断を最初からやり直しますか?')) return;
    state.view = 'intro'; state.answers = {}; state.currentQ = 0; state.result = null;
    save(); render(); window.scrollTo({top:0});
  });
}

function calcResult() {
  const scores = {A:0,B:0,C:0,D:0};
  const maxCount = {A:0,B:0,C:0,D:0};
  DIAG_QUESTIONS.forEach((q,i) => {
    const s = state.answers[i] ?? 0;
    scores[q.type] += s;
    if (s === 3) maxCount[q.type]++;
  });
  const order = ['A','B','C','D'];
  const sorted = order.slice().sort((a,b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    if (maxCount[b] !== maxCount[a]) return maxCount[b] - maxCount[a];
    return order.indexOf(a) - order.indexOf(b);
  });
  return {scores, maxCount, top: sorted[0], ranked: sorted};
}

function renderResult(root) {
  const r = state.result;
  const t = DIAG_TYPES[r.top];
  root.innerHTML = `
    <div class="result-hero">
      <p class="result-eyebrow">あなたは…</p>
      <h1>タイプ${r.top}「${escapeHtml(t.name)}」</h1>
      <p class="result-sub"><b>${escapeHtml(t.sub)}</b></p>
      <p class="result-keywords">キーワード：${escapeHtml(t.keywords)}</p>
    </div>

    <div class="scores">
      ${['A','B','C','D'].map(k => {
        const ds = DIAG_TYPES[k]; const sc = r.scores[k]; const pct = (sc/15)*100;
        return `<div class="bar ${k===r.top?'top':''}">
          <span class="bar-label">${k} ${escapeHtml(ds.name)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="bar-score">${sc}/15</span>
        </div>`;
      }).join('')}
    </div>

    <h3 class="section-title">あなたへのメッセージ</h3>
    <div class="msg-card">
      ${t.message.map(m => `<p>${escapeHtml(m)}</p>`).join('')}
    </div>

    <h3 class="section-title">冨高誠治からの手紙</h3>
    <details class="block" open>
      <summary><b>手紙を読む</b></summary>
      <div class="letter">${t.letter.split('\n').map(l => l ? `<p>${escapeHtml(l)}</p>` : '').join('')}</div>
    </details>

    <h3 class="section-title">${escapeHtml(t.name)}とは</h3>
    <details class="block" open>
      <summary><b>タイプの特徴と症状</b></summary>
      <div class="letter">${t.feature.split('\n').map(l => l ? `<p>${escapeHtml(l)}</p>` : '').join('')}</div>
      <h4>このタイプに多い不調</h4>
      <table class="tbl"><thead><tr><th>不調</th><th>東洋医学的な見方</th></tr></thead><tbody>
        ${t.symptoms.map(s => `<tr><td>${escapeHtml(s[0])}</td><td>${escapeHtml(s[1])}</td></tr>`).join('')}
      </tbody></table>
    </details>

    <h3 class="section-title">今すぐできるセルフケア3つ</h3>
    ${t.care.map((c,i) => `
      <details class="block" open>
        <summary><b>${i+1}. ${escapeHtml(c.name)}</b></summary>
        <div class="care-body">
          <p><b>場所・準備：</b>${escapeHtml(c.loc)}</p>
          <p><b>やり方：</b>${escapeHtml(c.how)}</p>
          <p><b>いつやるか：</b>${escapeHtml(c.when)}</p>
          <blockquote class="memo">${escapeHtml(c.why)}</blockquote>
        </div>
      </details>`).join('')}

    <h3 class="section-title">陥りやすい罠（NG養生）</h3>
    ${t.traps.map((tr,i) => `
      <details class="block">
        <summary><b>罠${i+1}：${escapeHtml(tr[0])}</b></summary>
        <p class="care-body">${escapeHtml(tr[1])}</p>
      </details>`).join('')}

    <h3 class="section-title">食材リスト</h3>
    <details class="block" open>
      <summary><b>◯ おすすめ食材</b></summary>
      <table class="tbl"><tbody>
        ${t.food_ok.map(f => `<tr><td><b>${escapeHtml(f[0])}</b></td><td>${escapeHtml(f[1])}</td></tr>`).join('')}
      </tbody></table>
    </details>
    <details class="block">
      <summary><b>✗ 避けたい食材・習慣</b></summary>
      <table class="tbl"><tbody>
        ${t.food_ng.map(f => `<tr><td><b>${escapeHtml(f[0])}</b></td><td>${escapeHtml(f[1])}</td></tr>`).join('')}
      </tbody></table>
    </details>

    <h3 class="section-title">季節ごとの注意点</h3>
    <details class="block">
      <summary><b>春夏秋冬の養生</b></summary>
      <table class="tbl"><thead><tr><th>季節</th><th>注意</th><th>おすすめ</th></tr></thead><tbody>
        ${t.seasons.map(s => `<tr><td><b>${escapeHtml(s[0])}</b></td><td>${escapeHtml(s[1])}</td><td>${escapeHtml(s[2])}</td></tr>`).join('')}
      </tbody></table>
    </details>

    <details class="block" style="background:#fef9e7;margin-top:18px;">
      <summary><b>⚠ ディスクレーマー（必ずお読みください）</b></summary>
      <div class="care-body">
        <p class="note">※ 本プログラムは医療行為ではなく、生活養生（セルフケア）の参考情報です。</p>
        ${t.disclaimer.split('\n').map(l => l ? `<p class="note">${escapeHtml(l)}</p>` : '').join('')}
      </div>
    </details>

    <div class="bottom-bar">
      <button id="restartBtn" class="btn-sub">最初からやり直す</button>
      <button id="shareBtn" class="btn-sub">URLをコピー</button>
    </div>
  `;
  document.getElementById('restartBtn').addEventListener('click', () => {
    if (!confirm('診断を最初からやり直しますか?')) return;
    state.view = 'intro'; state.answers = {}; state.currentQ = 0; state.result = null;
    save(); render(); window.scrollTo({top:0});
  });
  document.getElementById('shareBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); alert('URLをコピーしました'); }
    catch { prompt('このURLをコピーしてください', location.href); }
  });
}

render();
