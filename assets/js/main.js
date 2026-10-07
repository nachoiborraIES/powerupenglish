/**
 * PowerUpEnglish - Main JavaScript
 * Handles language swapping (EN/ES) and sidebar/level navigation.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'powerup_lang';
  const DEFAULT_LANG = 'en';

  /**
   * Get current language from localStorage or default
   */
  function getCurrentLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'es' || saved === 'en' ? saved : DEFAULT_LANG;
  }

  /**
   * Apply language to DOM
   */
  function applyLanguage(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    if (document.body) {
      document.body.classList.remove('lang-en', 'lang-es');
      document.body.classList.add('lang-' + lang);
    }
    localStorage.setItem(STORAGE_KEY, lang);

    // Update any swap button states or labels
    document.querySelectorAll('.lang-swap-btn, .floating-swap-pill').forEach(btn => {
      btn.setAttribute('aria-pressed', lang === 'es' ? 'true' : 'false');
      const tooltipEn = lang === 'en' ? 'Cambiar a Español' : 'Switch to English';
      btn.setAttribute('title', tooltipEn);
    });

    // Update document title if bilingual elements exist in title
    updateDocumentTitle(lang);
  }

  /**
   * Toggle between English and Spanish
   */
  function toggleLanguage() {
    const current = getCurrentLanguage();
    const next = current === 'en' ? 'es' : 'en';
    applyLanguage(next);
  }

  /**
   * Update HTML title based on language
   */
  function updateDocumentTitle(lang) {
    const titleEn = document.querySelector('meta[name="title-en"]');
    const titleEs = document.querySelector('meta[name="title-es"]');
    if (titleEn && titleEs) {
      const activeTitle = lang === 'es' ? titleEs.content : titleEn.content;
      document.title = activeTitle + ' | PowerUpEnglish';
    }
  }

  /**
   * Setup sidebar level switcher
   */
  function setupSidebar() {
    // Sidebar level select dropdown
    const levelSelect = document.getElementById('sidebar-level-select');
    if (levelSelect) {
      levelSelect.addEventListener('change', function (e) {
        const targetLevel = e.target.value;
        showSidebarLevel(targetLevel);
      });
    }

    // Top nav level buttons
    document.querySelectorAll('.level-nav-link').forEach(link => {
      link.addEventListener('click', function (e) {
        const level = this.getAttribute('data-level');
        if (level) {
          const currentPath = window.location.pathname;
          // If already on a page for this level or homepage, switch sidebar panel
          const sidebar = document.querySelector('.site-sidebar');
          if (sidebar) {
            showSidebarLevel(level);
            // On mobile, ensure sidebar opens
            if (window.innerWidth <= 768) {
              openSidebar();
            }
          }
        }
      });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('site-sidebar');

    function openSidebar() {
      if (sidebar) sidebar.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
    }

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        if (sidebar && sidebar.classList.contains('is-open')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeSidebar);
    }
  }

  /**
   * Show specific level menu in sidebar
   */
  function showSidebarLevel(levelCode) {
    const groups = document.querySelectorAll('.sidebar-level-group');
    if (groups.length === 0) return;

    groups.forEach(group => {
      if (group.getAttribute('data-level') === levelCode) {
        group.style.display = 'block';
      } else {
        group.style.display = 'none';
      }
    });

    // Update select element if present
    const levelSelect = document.getElementById('sidebar-level-select');
    if (levelSelect && levelSelect.value !== levelCode) {
      levelSelect.value = levelCode;
    }

    // Highlight corresponding top nav link
    document.querySelectorAll('.level-nav-link').forEach(nav => {
      if (nav.getAttribute('data-level') === levelCode) {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });
  }

  /**
   * Bind language toggle buttons
   */
  function setupLanguageButtons() {
    document.querySelectorAll('.lang-swap-btn, .floating-swap-pill').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleLanguage();
      });
    });
  }

  let currentlyPlayingBtn = null;

  /**
   * Speak English text using Web Speech API
   */
  function speakEnglish(text, buttonElement) {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser / Tu navegador no soporta síntesis de voz.');
      return;
    }

    // Toggle stop if already playing the exact button
    if (currentlyPlayingBtn === buttonElement && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (currentlyPlayingBtn) currentlyPlayingBtn.classList.remove('is-playing');
      currentlyPlayingBtn = null;
      return;
    }

    window.speechSynthesis.cancel();
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.classList.remove('is-playing');
      currentlyPlayingBtn = null;
    }

    // Clean text for natural speech
    let cleanText = text
      .replace(/<[^>]*>/g, '') // strip HTML
      .replace(/\[.*?\]/g, '') // strip [bracketed notes]
      .replace(/\(.*?\)/g, '') // strip (parenthetical notes)
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.92; // slightly measured pace for learners
    utterance.pitch = 1.0;

    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('David') || v.name.includes('Zira'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (enVoice) {
      utterance.voice = enVoice;
    }

    if (buttonElement) {
      buttonElement.classList.add('is-playing');
      currentlyPlayingBtn = buttonElement;

      utterance.onend = function () {
        buttonElement.classList.remove('is-playing');
        if (currentlyPlayingBtn === buttonElement) currentlyPlayingBtn = null;
      };

      utterance.onerror = function () {
        buttonElement.classList.remove('is-playing');
        if (currentlyPlayingBtn === buttonElement) currentlyPlayingBtn = null;
      };
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Create an audio button element
   */
  function createAudioButton(text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'audio-btn';
    btn.setAttribute('data-speak', text);
    btn.setAttribute('aria-label', `Listen pronunciation of "${text}"`);
    btn.setAttribute('title', 'Listen pronunciation / Escuchar pronunciación');
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>`;
    return btn;
  }

  /**
   * Auto-enhance tables and speakable elements with pronunciation buttons
   */
  function setupAudioButtons() {
    // 1. Delegate click events for all .audio-btn
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.audio-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      let text = btn.getAttribute('data-speak');
      if (!text) {
        const parent = btn.parentElement;
        if (parent) {
          const clone = parent.cloneNode(true);
          clone.querySelectorAll('.audio-btn').forEach(b => b.remove());
          text = clone.textContent;
        }
      }
      if (text) {
        speakEnglish(text, btn);
      }
    });

    // 2. Enhance tables with class .dual-lang-table
    const tables = document.querySelectorAll('.dual-lang-table');
    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.toLowerCase());
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        cells.forEach((cell, idx) => {
          if (cell.querySelector('.audio-btn')) return;

          const headerText = headers[idx] || '';
          const isSpanishCol = headerText.includes('español') || 
                               headerText.includes('spanish') || 
                               headerText.includes('significado') || 
                               (headerText.includes('traducción') && !headerText.includes('inglés'));

          if (isSpanishCol) return;

          const isEnglishCol = headerText.includes('english') || 
                               headerText.includes('expression') || 
                               headerText.includes('adjective') || 
                               headerText.includes('term') || 
                               headerText.includes('word') || 
                               headerText.includes('verb') || 
                               headerText.includes('affirmative') || 
                               headerText.includes('negative') || 
                               headerText.includes('example') || 
                               headerText.includes('pattern') || 
                               headerText.includes('structure') || 
                               headerText.includes('inverted') || 
                               headerText.includes('clause') || 
                               headerText.includes('pair') || 
                               headerText.includes('british') || 
                               headerText.includes('american') || 
                               headerText.includes('australian') ||
                               idx === 0;

          if (isEnglishCol) {
            const strong = cell.querySelector('strong');
            const targetEl = strong || cell;
            const textToSpeak = targetEl.textContent.trim();

            if (textToSpeak && textToSpeak.length > 0 && !textToSpeak.includes('---')) {
              const audioBtn = createAudioButton(textToSpeak);
              if (strong) {
                strong.after(audioBtn);
              } else {
                cell.appendChild(audioBtn);
              }
            }
          }
        });
      });
    });

    // 3. Enhance any element with class .speakable
    document.querySelectorAll('.speakable').forEach(el => {
      if (!el.querySelector('.audio-btn')) {
        const text = el.getAttribute('data-speak') || el.textContent.trim();
        if (text) {
          el.appendChild(createAudioButton(text));
        }
      }
    });

    // Ensure speech synthesis voices are preloaded
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  // DOM ready initialization
  document.addEventListener('DOMContentLoaded', function () {
    const initialLang = getCurrentLanguage();
    applyLanguage(initialLang);
    setupLanguageButtons();
    setupSidebar();
    setupAudioButtons();

    // Determine initial active level from body data attribute
    const activeLevel = document.body.getAttribute('data-active-level') || 'a1';
    showSidebarLevel(activeLevel);
  });

  // Expose global helper if needed
  window.PowerUpEnglish = {
    toggleLanguage: toggleLanguage,
    setLanguage: applyLanguage,
    getCurrentLanguage: getCurrentLanguage,
    showSidebarLevel: showSidebarLevel,
    speakEnglish: speakEnglish
  };
})();

