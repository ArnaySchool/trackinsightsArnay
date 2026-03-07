document.addEventListener('DOMContentLoaded', function () {
  const setupSearch = (form, searchInput, resultsDiv) => {
    if (!form || !searchInput || !resultsDiv) {
      return;
    }

    let abortController = null;
    let searchTimeout = null;
    let currentResults = []; // Track current search results

    const navigateToResult = (item) => {
      if (item.type === 'school') {
        window.location.href = `/school-dashboard/${item.id}`;
      } else if (item.type === 'athlete') {
        window.location.href = `/athlete-dashboard/${item.id}`;
      }
    };

    const performSearch = async (query) => {
      if (abortController) {
        abortController.abort();
      }

      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }

      if (!query) {
        resultsDiv.innerHTML = '';
        resultsDiv.classList.remove('open');
        currentResults = [];
        return;
      }

      // Enhanced loading state with animation
      resultsDiv.innerHTML = `
        <div class="loading flex items-center gap-3 py-2">
          <div class="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span class="text-gray-600">Searching...</span>
        </div>
      `;
      resultsDiv.classList.add('open');

      abortController = new AbortController();

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error('Search request failed');
        const data = await res.json();
        currentResults = data; // Store results for Enter key handling
        if (data.length === 0) {
          resultsDiv.innerHTML = `
            <div class="no-results flex items-center gap-2 text-gray-500 py-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              No results found for "${escapeHtml(query)}"
            </div>
          `;
          resultsDiv.classList.add('open');
        } else {
          resultsDiv.innerHTML = '';
          const ul = document.createElement('ul');
          ul.className = 'list-none p-0 m-0';

          data.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'mb-2';
            li.style.opacity = '0';
            li.style.transform = 'translateY(10px)';
            li.style.animation = `fadeInUp 0.3s ease forwards ${index * 0.05}s`;
            
            const btn = document.createElement('button');
            btn.className = 'btn btn-ghost p-2 px-4 bg-gray-100 hover:bg-primary/10 rounded-full w-full text-left justify-between flex transition-all duration-200 hover:translate-x-1';

            if (item.type === 'school') {
              btn.innerHTML = `
                <span class="result-text flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  ${escapeHtml(item.name)}
                </span>
                <span class="result-badge font-bold border-2 border-green-500 text-green-600 rounded-full px-3 py-0.5 text-sm whitespace-nowrap" style="margin-right:4px;">School</span>
              `.trim();
              btn.addEventListener('click', () => {
                window.location.href = `/school-dashboard/${item.id}`;
              });
            } else if (item.type === 'athlete') {
              let gender = (item.gender || '').toLowerCase();
              let genderBadgeClass = '';
              let genderLabel = '';

              if (gender === 'b' || gender === 'boys') {
                genderBadgeClass = 'border-blue-500 text-blue-600';
                genderLabel = 'Boys';
              } else if (gender === 'g' || gender === 'girls') {
                genderBadgeClass = 'border-pink-500 text-pink-600';
                genderLabel = 'Girls';
              } else {
                genderBadgeClass = 'border-gray-400 text-gray-600';
                genderLabel = escapeHtml(item.gender || 'A');
              }

              const classYear = item.graduation_year ? escapeHtml(item.graduation_year) : '00';
              btn.innerHTML = `
                <span class="result-text flex items-center gap-2">
                  <svg class="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  ${escapeHtml(item.name)}, Class of ${classYear} - ${escapeHtml(item.school || '')}
                </span>
                <span class="result-badge font-bold border-2 rounded-full px-1 ${genderBadgeClass}" style="margin-right:4px;">${genderLabel}</span>
              `.trim();
              btn.addEventListener('click', () => {
                window.location.href = `/athlete-dashboard/${item.id}`;
              });
            }

            li.appendChild(btn);
            ul.appendChild(li);
          });

          resultsDiv.appendChild(ul);
          resultsDiv.classList.add('open');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        resultsDiv.innerHTML = `
          <div class="no-results flex items-center gap-2 text-red-500 py-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Error performing search. Please try again.
          </div>
        `;
        resultsDiv.classList.add('open');
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // If there are any results, navigate to the first one on Enter
      if (currentResults.length > 0) {
        navigateToResult(currentResults[0]);
        return;
      }
    });

    searchInput.addEventListener('input', function () {
      const query = this.value.trim();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (!query) {
        resultsDiv.innerHTML = '';
        resultsDiv.classList.remove('open');
        currentResults = [];
        return;
      }

      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 500);
    });
  };

  setupSearch(
    document.getElementById('navSearchForm'),
    document.getElementById('navSearchInput'),
    document.getElementById('nav-search-results'),
  );

  setupSearch(
    document.getElementById('searchForm'),
    document.getElementById('searchInput') || document.getElementById('search-box'),
    document.getElementById('results'),
  );

  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
