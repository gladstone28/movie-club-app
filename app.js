// Movie Club Selector – accessible, responsive, no-build JavaScript
(function(){
  const listEl = document.getElementById('list');
  const template = document.getElementById('movieItemTemplate');
  const genreSelect = document.getElementById('genre');
  const searchForm = document.getElementById('searchForm');
  const queryInput = document.getElementById('query');
  const resetFiltersBtn = document.getElementById('resetFilters');
  const selectAllBtn = document.getElementById('selectAll');
  const clearSelectedBtn = document.getElementById('clearSelected');
  const exportBtn = document.getElementById('exportBtn');
  const selectedListEl = document.getElementById('selectedList');
  const countEl = document.getElementById('count');
  const statusMsg = document.getElementById('statusMsg');
  const themeBtn = document.getElementById('themeBtn');
  const reduceMotionBtn = document.getElementById('reduceMotionBtn');

  const addForm = document.getElementById('addForm');
  const addTitle = document.getElementById('title');
  const addYear = document.getElementById('year');
  const addGenre = document.getElementById('genreInput');
  const addRuntime = document.getElementById('runtime');

  const STORAGE_KEY = 'movie-club-selections-v1';
  const STORAGE_MOVIES = 'movie-club-movies-v1';
  const STORAGE_PREFS = 'movie-club-prefs-v1';

  // Seed movies – diverse genres
  const seedMovies = [
    { id: 'tt0111161', title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', runtime: 142 },
    { id: 'tt0068646', title: 'The Godfather', year: 1972, genre: 'Crime', runtime: 175 },
    { id: 'tt0133093', title: 'The Matrix', year: 1999, genre: 'Sci-Fi', runtime: 136 },
    { id: 'tt4154796', title: 'Avengers: Endgame', year: 2019, genre: 'Action', runtime: 181 },
    { id: 'tt0097576', title: 'Indiana Jones and the Last Crusade', year: 1989, genre: 'Adventure', runtime: 127 },
    { id: 'tt0245429', title: 'Spirited Away', year: 2001, genre: 'Animation', runtime: 125 },
    { id: 'tt1049413', title: 'Up', year: 2009, genre: 'Animation', runtime: 96 },
    { id: 'tt0114709', title: 'Toy Story', year: 1995, genre: 'Animation', runtime: 81 },
    { id: 'tt0118799', title: 'Life is Beautiful', year: 1997, genre: 'Comedy', runtime: 116 },
    { id: 'tt4154756', title: 'Avengers: Infinity War', year: 2018, genre: 'Action', runtime: 149 },
    { id: 'tt0120737', title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, genre: 'Fantasy', runtime: 178 },
    { id: 'tt0167260', title: 'The Lord of the Rings: The Return of the King', year: 2003, genre: 'Fantasy', runtime: 201 },
    { id: 'tt1375666', title: 'Inception', year: 2010, genre: 'Sci-Fi', runtime: 148 },
    { id: 'tt2582802', title: 'Whiplash', year: 2014, genre: 'Drama', runtime: 106 },
    { id: 'tt6751668', title: 'Parasite', year: 2019, genre: 'Thriller', runtime: 132 }
  ];

  /** Utilities **/
  const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
  const load = (k, fallback)=>{
    try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; } catch { return fallback; }
  };
  const unique = (arr, key) => Array.from(new Map(arr.map(x=>[x[key], x])).values());

  /** State **/
  let movies = load(STORAGE_MOVIES, seedMovies);
  let selected = new Set(load(STORAGE_KEY, []));
  let prefs = load(STORAGE_PREFS, { theme: 'dark', reduceMotion: false });

  /** Preferences **/
  const applyPrefs = () => {
    document.documentElement.dataset.theme = (prefs.theme === 'light' ? 'light' : 'dark');
    document.documentElement.style.setProperty('scroll-behavior', prefs.reduceMotion ? 'auto' : 'smooth');
    themeBtn.setAttribute('aria-pressed', prefs.theme === 'light');
    reduceMotionBtn.setAttribute('aria-pressed', prefs.reduceMotion);
  };
  themeBtn.addEventListener('click', ()=>{
    prefs.theme = (prefs.theme === 'light' ? 'dark' : 'light');
    save(STORAGE_PREFS, prefs); applyPrefs();
  });
  reduceMotionBtn.addEventListener('click', ()=>{
    prefs.reduceMotion = !prefs.reduceMotion; save(STORAGE_PREFS, prefs); applyPrefs();
  });
  applyPrefs();

  /** Genres **/
  function populateGenres(){
    const genres = Array.from(new Set(movies.map(m=>m.genre))).sort();
    genreSelect.innerHTML = '<option value="">All genres</option>' + genres.map(g=>`<option value="${g}">${g}</option>`).join('');
  }

  /** Render list **/
  function renderList(filter={}){
    const q = (filter.query ?? '').trim().toLowerCase();
    const g = (filter.genre ?? '').trim();
    const filtered = movies.filter(m=>{
      const matchesQ = !q || (m.title.toLowerCase().includes(q) || String(m.year).includes(q) || m.genre.toLowerCase().includes(q));
      const matchesG = !g || m.genre === g;
      return matchesQ && matchesG;
    });

    listEl.innerHTML = '';
    for(const m of filtered){
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = m.id;
      node.querySelector('.title').textContent = m.title;
      node.querySelector('.year').textContent = m.year;
      node.querySelector('.genre').textContent = m.genre;
      node.querySelector('.runtime').textContent = `${m.runtime} min`;
      const cb = node.querySelector('.select');
      cb.checked = selected.has(m.id);
      cb.setAttribute('aria-label', `Select ${m.title}`);
      listEl.appendChild(node);
    }
    statusMsg.textContent = `${filtered.length} result${filtered.length!==1?'s':''}`;
  }

  function renderSelected(){
    selectedListEl.innerHTML = '';
    const rows = movies.filter(m=>selected.has(m.id)).sort((a,b)=>a.title.localeCompare(b.title));
    for(const m of rows){
      const li = document.createElement('li');
      li.textContent = `${m.title} (${m.year})`;
      selectedListEl.appendChild(li);
    }
    countEl.textContent = `${rows.length} selected`;
  }

  /** Event delegation for selection **/
  listEl.addEventListener('change', (e)=>{
    if(e.target.classList.contains('select')){
      const li = e.target.closest('.item');
      const id = li.dataset.id;
      if(e.target.checked) selected.add(id); else selected.delete(id);
      save(STORAGE_KEY, Array.from(selected));
      renderSelected();
    }
  });

  /** Search and filters **/
  let currentFilter = { query: '', genre: '' };
  searchForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    currentFilter.query = queryInput.value;
    currentFilter.genre = genreSelect.value;
    renderList(currentFilter);
  });
  resetFiltersBtn.addEventListener('click', ()=>{
    queryInput.value = '';
    genreSelect.value = '';
    currentFilter = { query: '', genre: '' };
    renderList(currentFilter);
  });

  /** Bulk actions **/
  selectAllBtn.addEventListener('click', ()=>{
    const items = listEl.querySelectorAll('.item');
    for(const li of items){
      const id = li.dataset.id;
      const cb = li.querySelector('.select');
      if(!cb.checked){
        cb.checked = true;
        selected.add(id);
      }
    }
    save(STORAGE_KEY, Array.from(selected));
    renderSelected();
  });

  clearSelectedBtn.addEventListener('click', ()=>{
    selected.clear();
    save(STORAGE_KEY, Array.from(selected));
    // Uncheck visible checkboxes
    listEl.querySelectorAll('.select').forEach(cb => cb.checked = false);
    renderSelected();
  });

  /** Export to CSV **/
  exportBtn.addEventListener('click', ()=>{
    const rows = movies.filter(m=>selected.has(m.id));
    const header = ['Title','Year','Genre','Runtime(min)'];
    const csvRows = [header.join(',')].concat(rows.map(m => [m.title, m.year, m.genre, m.runtime].join(',')));
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movie-club-selections.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /** Add Movie **/
  addForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = addTitle.value.trim();
    const year = Number(addYear.value);
    const genre = addGenre.value.trim() || 'Other';
    const runtime = Number(addRuntime.value) || 90;
    if(!title || !year) return;

    const id = 'id_' + Math.random().toString(36).slice(2,10);
    movies.push({ id, title, year, genre, runtime });
    movies = unique(movies, 'id'); // just in case
    save(STORAGE_MOVIES, movies);
    populateGenres();
    renderList(currentFilter);
    statusMsg.textContent = `Added “${title}”`;
    addForm.reset();
  });

  // Initialize
  populateGenres();
  renderList(currentFilter);
  renderSelected();

  // Improve keyboard flow: focus results after search submit
  searchForm.addEventListener('submit', ()=>{
    setTimeout(()=>{ listEl.querySelector('.item input')?.focus(); }, 0);
  });
})();