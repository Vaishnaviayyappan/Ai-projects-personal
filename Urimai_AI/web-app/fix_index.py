import os

path = r"c:\Users\Admin\Desktop\Urimai AI\urimai-ai\web-app\index.html"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "this.input.addEventListener('keypress'" in line:
        start_idx = i + 1
    if "grid.appendChild(card);" in line and start_idx != -1 and end_idx == -1:
        end_idx = i

if start_idx != -1 and end_idx != -1:
    print(f"Replacing from {start_idx} to {end_idx}")
    js_code = r"""    this.addMsg("வணக்கம்! நான் உரிமை AI. அரசு திட்டங்கள் பற்றி என்னிடம் கேளுங்கள். (குறிப்பு: API Key அமைப்புகளில் சேர்க்கவும்)", 'bot');
  },
  focus() {
    document.querySelector('.nav-tab[data-tab="chat"]').click();
    this.input.focus();
  },
  async send() {
    const text = this.input.value.trim();
    if(!text) return;
    this.input.value = '';
    this.addMsg(text, 'user');
    
    const loaderId = 'load-' + Date.now();
    this.addMsg("பரிசீலிக்கிறது...", 'system', loaderId);
    
    try {
      const resp = await AIClient.answerQuery(text, this.history);
      document.getElementById(loaderId).remove();
      this.addMsg(resp, 'bot');
      this.history.push({role:"user", content:text}, {role:"assistant", content:resp});
    } catch(e) {
      document.getElementById(loaderId).remove();
      if(e.message === 'NO_KEY') {
        this.addMsg("மன்னிக்கவும், AI செயல்பட Settings ⚙️ சென்று API Key உள்ளிடவும்.", 'system');
      } else {
        this.addMsg("பிழை ஏற்பட்டது: " + e.message, 'system');
        // Fallback simple matching
        const words = text.split(' ');
        const matches = SCHEMES.filter(s => words.some(w => s.name_ta.includes(w) || s.tags.includes(w)));
        if(matches.length>0) {
          this.addMsg("இதோ சில திட்டங்கள்:\n" + matches.map(m=>"• " + m.name_ta + " (" + m.benefit.amount_display + ")").join('\n'), 'bot');
        }
      }
    }
  },
  addMsg(text, type, id='') {
    const d = document.createElement('div');
    d.className = 'msg msg-' + type + ' ta';
    if(id) d.id = id;
    d.innerText = text; // handles newlines
    this.msgs.appendChild(d);
    this.msgs.scrollTop = this.msgs.scrollHeight;
  }
};

const Directory = {
  init() {
    // Categories
    const cats = new Set();
    SCHEMES.forEach(s => s.category.forEach(c => cats.add(c)));
    const catContainer = document.getElementById('filter-categories');
    cats.forEach(c => {
      const b = document.createElement('button');
      b.className = 'badge badge-neutral ta cursor-pointer border-none';
      b.style.cursor = 'pointer';
      b.textContent = c;
      b.onclick = () => {
        const isActive = b.classList.contains('badge-brand');
        document.querySelectorAll('#filter-categories .badge').forEach(x => { x.classList.remove('badge-brand'); x.classList.add('badge-neutral'); });
        if(!isActive) { b.classList.remove('badge-neutral'); b.classList.add('badge-brand'); }
        Store.dispatch('FILTER_DIR', { category: isActive ? 'all' : c });
      };
      catContainer.appendChild(b);
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      Store.dispatch('FILTER_DIR', { query: e.target.value });
    }, 300));
    
    this.render();
  },
  filterGovt(val) { Store.dispatch('FILTER_DIR', { filterGovt: val }); },
  filterSaved(val) { Store.dispatch('FILTER_DIR', { filterSaved: val }); },
  clearFilters() {
    document.getElementById('search-input').value = '';
    document.querySelector('input[name="govt"][value="all"]').checked = true;
    document.getElementById('filter-saved').checked = false;
    document.querySelectorAll('#filter-categories .badge').forEach(x => { x.classList.remove('badge-brand'); x.classList.add('badge-neutral'); });
    Store.dispatch('FILTER_DIR', { query: '', filterGovt: 'all', filterSaved: false, category: 'all' });
  },
  toggleExpand(id) {
    const el = document.getElementById('expand-' + id);
    const chev = document.getElementById('chev-' + id);
    if(el.classList.contains('open')) {
      el.classList.remove('open');
      chev.classList.remove('open');
    } else {
      el.classList.add('open');
      chev.classList.add('open');
    }
  },
  render() {
    const state = Store.getState();
    const grid = document.getElementById('scheme-grid');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = '';
    
    let filtered = SCHEMES.filter(s => {
      if(state.directory.filterGovt !== 'all' && s.govt !== state.directory.filterGovt) return false;
      if(state.directory.category !== 'all' && !s.category.includes(state.directory.category)) return false;
      if(state.directory.filterSaved && !state.savedSchemes.has(s.id)) return false;
      if(state.directory.query) {
        const q = state.directory.query.toLowerCase();
        if(!s.name_ta.includes(q) && !s.tags.some(t=>t.includes(q))) return false;
      }
      return true;
    });
    
    document.getElementById('scheme-count').textContent = filtered.length;
    
    const clearBtn = document.getElementById('clear-filters');
    if(state.directory.query || state.directory.filterGovt!=='all' || state.directory.filterSaved || state.directory.category!=='all') {
      clearBtn.classList.remove('hidden');
    } else { clearBtn.classList.add('hidden'); }
    
    if(filtered.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }
    
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    
    filtered.forEach(s => {
      const isSaved = state.savedSchemes.has(s.id);
      const card = document.createElement('div');
      card.className = 'card scheme-card p-6 card-hover';
      card.innerHTML = 
        '<div class="flex justify-between items-start">' +
          '<div style="font-size:3rem; line-height:1;">' + s.emoji + '</div>' +
          '<button class="btn-ghost" onclick="Store.dispatch(\\'TOGGLE_SAVE\\', \\'' + s.id + '\\')" style="color:' + (isSaved?'var(--text-danger)':'var(--text-tertiary)') + '; font-size:1.5rem; padding:0;">' +
            (isSaved ? '❤️' : '🤍') +
          '</button>' +
        '</div>' +
        '<div class="mt-4 flex gap-2 mb-2">' +
          '<span class="badge badge-neutral ta">' + (s.category[0] || 'பொது') + '</span>' +
          '<span class="badge badge-brand ta">' + (s.govt==='State'?'TN அரசு':'மத்திய அரசு') + '</span>' +
        '</div>' +
        '<h3 class="ta font-bold" style="font-size:1.25rem; color:var(--text-brand); line-height:1.4;">' + s.name_ta + '</h3>' +
        '<div class="benefit-box">' +
          '<div class="mono font-bold text-brand" style="font-size:1.5rem;">' + s.benefit.amount_display + '</div>' +
          '<div class="ta mt-2 text-secondary" style="font-size:0.875rem;">' + s.benefit.desc_ta + '</div>' +
        '</div>' +
        '<button class="btn-ghost ta w-full justify-between p-0 mt-2" onclick="Directory.toggleExpand(\\'' + s.id + '\\')" style="color:var(--text-brand)">' +
          'முழு விவரம் <span id="chev-' + s.id + '" class="chevron">▼</span>' +
        '</button>' +
        '<div id="expand-' + s.id + '" class="scheme-expanded mt-4 border-t" style="border-top:1px solid var(--border-subtle); padding-top:1rem;">' +
          '<p class="ta text-sm mb-2"><strong class="text-secondary">துறை:</strong> ' + s.dept_ta + '</p>' +
          '<p class="ta text-sm mb-2"><strong class="text-secondary">கடைசி தேதி:</strong> ' + (s.timing.deadline_type==='ongoing'?'தொடர்ந்து':s.timing.deadline) + '</p>' +
          '<p class="ta text-sm mb-4"><strong class="text-secondary">வருமான வரம்பு:</strong> ' + s.eligibility.income_max_display + '</p>' +
          '<button class="btn btn-secondary w-full ta" onclick="document.querySelector(\\'.nav-tab[data-tab=\\\\\\'checker\\\\\\']\\').click()">தகுதி சோதிக்கவும் →</button>' +
        '</div>';
"""
    new_lines = [line + "\n" for line in js_code.split("\n")[:-1]]
    
    lines = lines[:start_idx] + new_lines + lines[end_idx:]
    
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Fixed.")
else:
    print("Could not find boundaries.")
