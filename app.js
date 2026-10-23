/**
 * زاد المؤمن - منطق التطبيق التفاعلي (app.js)
 * إدارة الحالة، عداد رمضان، التاريخ الهجري، سبحة الخرز الدائرية، والهدف المخصص
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'zad_theme',
    CURRENT_CAT: 'zad_current_category',
    CURRENT_INDEX: 'zad_current_index',
    PROGRESS: 'zad_adhkar_progress',
    DAILY_TOTAL: 'zad_daily_total',
    SOUND: 'zad_sound_enabled',
    VIBRATE: 'zad_vibrate_enabled',
    MASBAHA_STATE: 'zad_masbaha_state',
    FONT_SIZE: 'zad_font_size',
    CUSTOM_TARGETS: 'zad_custom_targets'
  };

  const state = {
    currentCategory: 'sabah',
    currentIndex: 0,
    progress: {},
    customTargets: {},
    dailyTotal: { count: 0, date: '' },
    soundEnabled: true,
    vibrateEnabled: true,
    isFullScreenTap: false,
    fontSize: 1.45,
    masbaha: {
      text: 'سُبْحَانَ اللَّهِ',
      count: 0,
      target: 100,
      reward: 'يُكتب لقائلها ألف حسنة أو يُحطّ عنه ألف خطيئة.'
    }
  };

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  const elements = {
    body: document.body,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    lightIcon: document.querySelector('.light-icon'),
    darkIcon: document.querySelector('.dark-icon'),
    hijriDateText: document.getElementById('hijriDateText'),
    toggleSoundBtn: document.getElementById('toggleSoundBtn'),
    soundIconOn: document.getElementById('soundIconOn'),
    soundIconOff: document.getElementById('soundIconOff'),
    toggleVibrateBtn: document.getElementById('toggleVibrateBtn'),
    toggleFullScreenTapBtn: document.getElementById('toggleFullScreenTapBtn'),
    categoriesTabs: document.getElementById('categoriesTabs'),
    currentCategoryTitle: document.getElementById('currentCategoryTitle'),
    categoryProgressRatio: document.getElementById('categoryProgressRatio'),
    categoryProgressBar: document.getElementById('categoryProgressBar'),

    ramadanCountdownCard: document.getElementById('ramadanCountdownCard'),
    ramadanDays: document.getElementById('ramadanDays'),
    ramadanHours: document.getElementById('ramadanHours'),
    ramadanMinutes: document.getElementById('ramadanMinutes'),

    dhikrCard: document.getElementById('dhikrCard'),
    dhikrPositionBadge: document.getElementById('dhikrPositionBadge'),
    dhikrTargetBadge: document.getElementById('dhikrTargetBadge'),
    openTargetModalBtn: document.getElementById('openTargetModalBtn'),
    dhikrText: document.getElementById('dhikrText'),
    dhikrRewardBox: document.getElementById('dhikrRewardBox'),
    dhikrRewardText: document.getElementById('dhikrRewardText'),
    mainCounterBtn: document.getElementById('mainCounterBtn'),
    currentCountDisplay: document.getElementById('currentCountDisplay'),
    targetCountDisplay: document.getElementById('targetCountDisplay'),
    counterProgressRing: document.getElementById('counterProgressRing'),
    completedCountBadge: document.getElementById('completedCountBadge'),
    remainingCountBadge: document.getElementById('remainingCountBadge'),
    mainCounterHint: document.getElementById('mainCounterHint'),
    completionBanner: document.getElementById('completionBanner'),

    targetModalBackdrop: document.getElementById('targetModalBackdrop'),
    closeTargetModalBtn: document.getElementById('closeTargetModalBtn'),
    quickTargetChips: document.getElementById('quickTargetChips'),
    customTargetInput: document.getElementById('customTargetInput'),
    applyCustomTargetBtn: document.getElementById('applyCustomTargetBtn'),

    decreaseFontBtn: document.getElementById('decreaseFontBtn'),
    increaseFontBtn: document.getElementById('increaseFontBtn'),
    prevDhikrBtn: document.getElementById('prevDhikrBtn'),
    nextDhikrBtn: document.getElementById('nextDhikrBtn'),
    undoCountBtn: document.getElementById('undoCountBtn'),
    resetCountBtn: document.getElementById('resetCountBtn'),

    masbahaView: document.getElementById('masbahaView'),
    masbahaSelect: document.getElementById('masbahaSelect'),
    masbahaCustomInput: document.getElementById('masbahaCustomInput'),
    targetChips: document.getElementById('targetChips'),
    masbahaCustomTargetNumber: document.getElementById('masbahaCustomTargetNumber'),
    applyMasbahaCustomTargetBtn: document.getElementById('applyMasbahaCustomTargetBtn'),
    masbahaActiveText: document.getElementById('masbahaActiveText'),
    masbahaRewardBox: document.getElementById('masbahaRewardBox'),
    masbahaRewardText: document.getElementById('masbahaRewardText'),
    masbahaCounterBtn: document.getElementById('masbahaCounterBtn'),
    masbahaProgressRing: document.getElementById('masbahaProgressRing'),
    masbahaCountDisplay: document.getElementById('masbahaCountDisplay'),
    masbahaTargetDisplay: document.getElementById('masbahaTargetDisplay'),
    masbahaCompletedBadge: document.getElementById('masbahaCompletedBadge'),
    masbahaRemainingBadge: document.getElementById('masbahaRemainingBadge'),
    masbahaCounterHint: document.getElementById('masbahaCounterHint'),
    masbahaCompletionBanner: document.getElementById('masbahaCompletionBanner'),
    masbahaUndoBtn: document.getElementById('masbahaUndoBtn'),
    masbahaResetBtn: document.getElementById('masbahaResetBtn'),
    dailyTotalCount: document.getElementById('dailyTotalCount'),

    toastNotification: document.getElementById('toastNotification'),
    toastTitle: document.getElementById('toastTitle'),
    toastMessage: document.getElementById('toastMessage'),

    screenTapOverlay: document.getElementById('screenTapOverlay'),
    exitFullScreenTapBtn: document.getElementById('exitFullScreenTapBtn'),
    overlayDhikrText: document.getElementById('overlayDhikrText'),
    overlayCurrentCount: document.getElementById('overlayCurrentCount'),
    overlayTargetCount: document.getElementById('overlayTargetCount')
  };

  const RING_CIRCUMFERENCE = 339.292;
  let currentBeadRotation = 0;
  const TOTAL_BEADS = 33;

  function loadPersistedState() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    setTheme(savedTheme, false);

    const savedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (savedFontSize) applyFontSize(savedFontSize);

    try {
      const savedTargets = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_TARGETS));
      if (savedTargets && typeof savedTargets === 'object') state.customTargets = savedTargets;
    } catch (e) {
      state.customTargets = {};
    }

    state.soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND) !== 'false';
    state.vibrateEnabled = localStorage.getItem(STORAGE_KEYS.VIBRATE) !== 'false';
    updateSoundVibrateUI();

    const savedCat = localStorage.getItem(STORAGE_KEYS.CURRENT_CAT);
    if (savedCat && ADHKAR_CATEGORIES.some(c => c.id === savedCat)) {
      state.currentCategory = savedCat;
    }

    const savedIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX), 10);
    if (!isNaN(savedIndex) && savedIndex >= 0) state.currentIndex = savedIndex;

    try {
      const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS));
      if (savedProgress && typeof savedProgress === 'object') state.progress = savedProgress;
    } catch (e) {
      state.progress = {};
    }

    try {
      const savedMasbaha = JSON.parse(localStorage.getItem(STORAGE_KEYS.MASBAHA_STATE));
      if (savedMasbaha && typeof savedMasbaha === 'object') {
        state.masbaha = Object.assign(state.masbaha, savedMasbaha);
      }
    } catch (e) {}

    updateDailyTotals();
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(state.progress));
  }

  function saveCurrentPosition() {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CAT, state.currentCategory);
    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, state.currentIndex.toString());
  }

  function saveMasbahaState() {
    localStorage.setItem(STORAGE_KEYS.MASBAHA_STATE, JSON.stringify(state.masbaha));
  }

  function renderHijriDate() {
    try {
      const today = new Date();
      const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (elements.hijriDateText) {
        elements.hijriDateText.textContent = hijriFormatter.format(today);
      }
    } catch (err) {
      if (elements.hijriDateText) elements.hijriDateText.textContent = 'اليوم الهجري المبارك';
    }
  }

  function getNextRamadanDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const ramadanDates = [
      new Date(currentYear, 1, 18),
      new Date(currentYear + 1, 1, 8),
      new Date(currentYear + 2, 0, 28)
    ];

    for (let d of ramadanDates) {
      if (d.getTime() > now.getTime()) return d;
    }
    return new Date(currentYear + 1, 1, 8);
  }

  function updateRamadanCountdown() {
    const targetDate = getNextRamadanDate();
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      if (elements.ramadanDays) elements.ramadanDays.textContent = '00';
      if (elements.ramadanHours) elements.ramadanHours.textContent = '00';
      if (elements.ramadanMinutes) elements.ramadanMinutes.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (elements.ramadanDays) elements.ramadanDays.textContent = String(days).padStart(2, '0');
    if (elements.ramadanHours) elements.ramadanHours.textContent = String(hours).padStart(2, '0');
    if (elements.ramadanMinutes) elements.ramadanMinutes.textContent = String(minutes).padStart(2, '0');
  }

  function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  function updateDailyTotals() {
    const today = getTodayString();
    let dailyData = { date: today, count: 0 };
    try {
      const savedDaily = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_TOTAL));
      if (savedDaily && savedDaily.date === today) dailyData = savedDaily;
    } catch (e) {}
    state.dailyTotal = dailyData;
    if (elements.dailyTotalCount) elements.dailyTotalCount.textContent = dailyData.count;
  }

  function incrementDailyTotal() {
    const today = getTodayString();
    if (state.dailyTotal.date !== today) {
      state.dailyTotal.date = today;
      state.dailyTotal.count = 0;
    }
    state.dailyTotal.count += 1;
    if (elements.dailyTotalCount) elements.dailyTotalCount.textContent = state.dailyTotal.count;
    localStorage.setItem(STORAGE_KEYS.DAILY_TOTAL, JSON.stringify(state.dailyTotal));
  }

  function playCompletionChime() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {}
  }

  function triggerHaptic(type = 'tap') {
    if (!state.vibrateEnabled || !navigator.vibrate) return;
    if (type === 'tap') navigator.vibrate(15);
    else if (type === 'target_reached' || type === 'complete') navigator.vibrate([30, 50, 30]);
  }

  function setTheme(theme, save = true) {
    if (theme === 'dark') {
      elements.body.classList.remove('light-mode');
      elements.body.classList.add('dark-mode');
      elements.lightIcon.classList.add('hidden');
      elements.darkIcon.classList.remove('hidden');
    } else {
      elements.body.classList.remove('dark-mode');
      elements.body.classList.add('light-mode');
      elements.lightIcon.classList.remove('hidden');
      elements.darkIcon.classList.add('hidden');
    }
    if (save) localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  function toggleTheme() {
    const isDark = elements.body.classList.contains('dark-mode');
    setTheme(isDark ? 'light' : 'dark');
  }

  function updateSoundVibrateUI() {
    if (state.soundEnabled) {
      elements.soundIconOn.classList.remove('hidden');
      elements.soundIconOff.classList.add('hidden');
      elements.toggleSoundBtn.style.color = '';
    } else {
      elements.soundIconOn.classList.add('hidden');
      elements.soundIconOff.classList.remove('hidden');
      elements.toggleSoundBtn.style.color = 'var(--text-muted)';
    }
    elements.toggleVibrateBtn.style.color = state.vibrateEnabled ? '' : 'var(--text-muted)';
  }

  function applyFontSize(size) {
    const parsed = parseFloat(size) || 1.45;
    const clamped = Math.max(1.1, Math.min(2.4, parsed));
    state.fontSize = Number(clamped.toFixed(2));
    document.documentElement.style.setProperty('--dhikr-font-size', `${state.fontSize}rem`);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, state.fontSize.toString());
  }

  function renderCategoriesTabs() {
    elements.categoriesTabs.innerHTML = '';
    ADHKAR_CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tab-btn ${cat.id === state.currentCategory ? 'active' : ''}`;
      btn.dataset.id = cat.id;
      btn.innerHTML = `
        <span class="tab-title">${cat.name}</span>
        <span class="tab-badge">${cat.badge}</span>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchCategory(cat.id);
      });
      elements.categoriesTabs.appendChild(btn);
    });
  }

  function switchCategory(categoryId) {
    revertResetButton();
    revertMasbahaResetButton();
    state.currentCategory = categoryId;
    state.currentIndex = 0;
    saveCurrentPosition();

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === categoryId);
    });

    renderCurrentView();
    triggerHaptic('tap');
  }

  function renderCurrentView() {
    if (state.currentCategory === 'masbaha') {
      elements.dhikrCard.classList.add('hidden');
      elements.masbahaView.classList.remove('hidden');
      if (elements.ramadanCountdownCard) elements.ramadanCountdownCard.classList.add('hidden');
      renderMasbahaView();
    } else {
      elements.dhikrCard.classList.remove('hidden');
      elements.masbahaView.classList.add('hidden');
      if (elements.ramadanCountdownCard) elements.ramadanCountdownCard.classList.remove('hidden');
      renderActiveDhikr();
    }
    updateCategoryProgress();
  }

  function formatArabicRepetition(count) {
    if (count === 1) return 'مرة واحدة';
    if (count === 2) return 'مرتان';
    if (count >= 3 && count <= 10) return `${count} مرات`;
    return `${count} مرة`;
  }

  function getDhikrTarget(item) {
    if (!item) return 1;
    if (state.customTargets && state.customTargets[item.id] && state.customTargets[item.id] > 0) {
      return state.customTargets[item.id];
    }
    return item.count || 1;
  }

  function getCurrentCategoryData() {
    return ADHKAR_CATEGORIES.find(c => c.id === state.currentCategory) || ADHKAR_CATEGORIES[0];
  }

  function getCurrentDhikrItem() {
    const cat = getCurrentCategoryData();
    if (!cat.items || cat.items.length === 0) return null;
    if (state.currentIndex >= cat.items.length) state.currentIndex = 0;
    if (state.currentIndex < 0) state.currentIndex = cat.items.length - 1;
    return cat.items[state.currentIndex];
  }

  function renderActiveDhikr() {
    const cat = getCurrentCategoryData();
    const item = getCurrentDhikrItem();
    if (!item) return;

    const target = getDhikrTarget(item);
    const isCustom = Boolean(state.customTargets && state.customTargets[item.id]);

    elements.currentCategoryTitle.textContent = cat.name;
    elements.dhikrPositionBadge.textContent = `ذكر ${state.currentIndex + 1} من ${cat.items.length}`;
    elements.dhikrTargetBadge.textContent = `التكرار المطلوب: ${formatArabicRepetition(target)}${isCustom ? ' (مخصص ✎)' : ''}`;
    elements.dhikrText.textContent = item.text;

    if (item.reward && item.reward.trim().length > 0) {
      elements.dhikrRewardText.textContent = item.reward;
      elements.dhikrRewardBox.classList.remove('hidden');
    } else {
      elements.dhikrRewardBox.classList.add('hidden');
    }

    const current = state.progress[item.id] || 0;
    const remaining = Math.max(0, target - current);
    elements.currentCountDisplay.textContent = current;
    elements.targetCountDisplay.textContent = target;

    if (elements.completedCountBadge) elements.completedCountBadge.textContent = current;
    if (elements.remainingCountBadge) elements.remainingCountBadge.textContent = remaining;

    const progressRatio = Math.min(current / target, 1);
    const offset = RING_CIRCUMFERENCE - (progressRatio * RING_CIRCUMFERENCE);
    elements.counterProgressRing.style.strokeDashoffset = offset;

    if (current >= target) {
      elements.mainCounterBtn.classList.add('completed');
      if (elements.completionBanner) elements.completionBanner.classList.remove('hidden');
      if (elements.mainCounterHint) elements.mainCounterHint.textContent = 'مكتمل بحمد الله — انقر للذكر التالي';
    } else {
      elements.mainCounterBtn.classList.remove('completed');
      if (elements.completionBanner) elements.completionBanner.classList.add('hidden');
      if (elements.mainCounterHint) elements.mainCounterHint.textContent = 'اضغط للتسبيح';
    }

    if (state.isFullScreenTap) {
      elements.overlayDhikrText.textContent = item.text;
      elements.overlayCurrentCount.textContent = current;
      elements.overlayTargetCount.textContent = target;
    }
  }

  function updateCategoryProgress() {
    const cat = getCurrentCategoryData();
    if (state.currentCategory === 'masbaha') {
      elements.categoryProgressRatio.textContent = 'مسبحة إلكترونية';
      elements.categoryProgressBar.style.width = '100%';
      return;
    }

    const totalItems = cat.items.length;
    let completedItems = 0;

    cat.items.forEach(item => {
      const c = state.progress[item.id] || 0;
      const target = getDhikrTarget(item);
      if (c >= target) completedItems++;
    });

    const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    elements.categoryProgressRatio.textContent = `${completedItems} / ${totalItems} مكتمل (${percent}%)`;
    elements.categoryProgressBar.style.width = `${percent}%`;
  }

  function handleMainCounterTap() {
    const item = getCurrentDhikrItem();
    if (!item) return;

    const target = getDhikrTarget(item);
    let current = state.progress[item.id] || 0;

    if (current >= target) {
      goToNextDhikr();
      return;
    }

    current += 1;
    state.progress[item.id] = current;
    saveProgress();
    incrementDailyTotal();
    triggerHaptic('tap');

    if (current === target) {
      playCompletionChime();
      triggerHaptic('target_reached');
      checkCategoryCompletion();
    }

    renderActiveDhikr();
    updateCategoryProgress();
  }

  function undoCurrentDhikr() {
    revertResetButton();
    const item = getCurrentDhikrItem();
    if (!item) return;

    let current = state.progress[item.id] || 0;
    if (current > 0) {
      current -= 1;
      state.progress[item.id] = current;
      saveProgress();
      renderActiveDhikr();
      updateCategoryProgress();
      triggerHaptic('tap');
    }
  }

  let resetConfirmTimeout = null;
  function resetCurrentDhikr() {
    const item = getCurrentDhikrItem();
    if (!item) return;

    const current = state.progress[item.id] || 0;
    if (current === 0) {
      showToast('العداد مصفّر', 'عداد هذا الذكر مصفّر بالفعل.');
      return;
    }

    if (!elements.resetCountBtn.classList.contains('confirm-danger')) {
      elements.resetCountBtn.classList.add('confirm-danger');
      const span = elements.resetCountBtn.querySelector('span');
      if (span) span.textContent = 'تأكيد التصفير؟';
      triggerHaptic('tap');

      if (resetConfirmTimeout) clearTimeout(resetConfirmTimeout);
      resetConfirmTimeout = setTimeout(() => {
        revertResetButton();
      }, 3000);
      return;
    }

    revertResetButton();
    state.progress[item.id] = 0;
    saveProgress();
    renderActiveDhikr();
    updateCategoryProgress();
    triggerHaptic('tap');
    showToast('تم التصفير', 'تمت إعادة تعيين عداد هذا الذكر بنجاح.');
  }

  function revertResetButton() {
    if (resetConfirmTimeout) {
      clearTimeout(resetConfirmTimeout);
      resetConfirmTimeout = null;
    }
    if (elements.resetCountBtn) {
      elements.resetCountBtn.classList.remove('confirm-danger');
      const span = elements.resetCountBtn.querySelector('span');
      if (span) span.textContent = 'تصفير';
    }
  }

  function goToNextDhikr() {
    revertResetButton();
    const cat = getCurrentCategoryData();
    state.currentIndex = (state.currentIndex < cat.items.length - 1) ? state.currentIndex + 1 : 0;
    saveCurrentPosition();
    renderActiveDhikr();
    triggerHaptic('tap');
  }

  function goToPrevDhikr() {
    revertResetButton();
    const cat = getCurrentCategoryData();
    state.currentIndex = (state.currentIndex > 0) ? state.currentIndex - 1 : cat.items.length - 1;
    saveCurrentPosition();
    renderActiveDhikr();
    triggerHaptic('tap');
  }

  function checkCategoryCompletion() {
    const cat = getCurrentCategoryData();
    let allDone = true;
    cat.items.forEach(item => {
      const c = state.progress[item.id] || 0;
      const target = getDhikrTarget(item);
      if (c < target) allDone = false;
    });

    if (allDone) {
      showToast('مبارك! تقبل الله طاعتك ✨', `لقد أتممت جميع أذكار ${cat.name} بنجاح.`);
    }
  }

  function openTargetModal() {
    const item = getCurrentDhikrItem();
    if (!item) return;

    const target = getDhikrTarget(item);
    if (elements.customTargetInput) {
      elements.customTargetInput.value = target;
      elements.customTargetInput.focus();
    }

    if (elements.quickTargetChips) {
      const chips = elements.quickTargetChips.querySelectorAll('.target-choice-chip');
      chips.forEach(chip => {
        const val = chip.dataset.target;
        if (val === 'original') {
          chip.classList.toggle('active', !state.customTargets[item.id]);
        } else {
          chip.classList.toggle('active', parseInt(val, 10) === target && Boolean(state.customTargets[item.id]));
        }
      });
    }

    if (elements.targetModalBackdrop) elements.targetModalBackdrop.classList.remove('hidden');
  }

  function closeTargetModal() {
    if (elements.targetModalBackdrop) elements.targetModalBackdrop.classList.add('hidden');
  }

  function setDhikrTarget(targetValue) {
    const item = getCurrentDhikrItem();
    if (!item) return;

    if (targetValue === 'original') {
      if (state.customTargets && state.customTargets[item.id]) {
        delete state.customTargets[item.id];
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TARGETS, JSON.stringify(state.customTargets));
      }
      closeTargetModal();
      renderActiveDhikr();
      updateCategoryProgress();
      triggerHaptic('tap');
      return;
    }

    const parsed = parseInt(targetValue, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    const clamped = Math.min(Math.max(parsed, 1), 99999);
    state.customTargets[item.id] = clamped;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TARGETS, JSON.stringify(state.customTargets));

    closeTargetModal();
    renderActiveDhikr();
    updateCategoryProgress();
    triggerHaptic('tap');
  }

  // ==========================================================
  // منطق سبحة الخرز الدائرية وتحديد الهدف المخصص
  // ==========================================================
  function createBeadsRing() {
    const ring = document.getElementById('beadsRing');
    if (!ring) return;
    ring.innerHTML = '';
    
    const isMobile = window.innerWidth <= 640;
    const radius = isMobile ? 100 : 118; // المسافة المحيطية الدائرية

    for (let i = 0; i < TOTAL_BEADS; i++) {
      const bead = document.createElement('div');
      bead.className = 'masbaha-bead';
      const angle = (i * (360 / TOTAL_BEADS)) * (Math.PI / 180);
      const x = Math.round(radius * Math.cos(angle));
      const y = Math.round(radius * Math.sin(angle));
      
      bead.style.transform = `translate(${x}px, ${y}px)`;
      bead.dataset.index = i;
      ring.appendChild(bead);
    }
  }

  function rotateBeadsStep(direction = 1) {
    const ring = document.getElementById('beadsRing');
    if (!ring) return;

    const stepDeg = (360 / TOTAL_BEADS) * direction;
    currentBeadRotation += stepDeg;
    ring.style.setProperty('--bead-rotation', `${currentBeadRotation}deg`);

    const beads = ring.querySelectorAll('.masbaha-bead');
    const activeIndex = (state.masbaha.count) % TOTAL_BEADS;
    beads.forEach((b, idx) => {
      if (idx === activeIndex) {
        b.classList.add('active-spark');
        setTimeout(() => b.classList.remove('active-spark'), 200);
      }
    });
  }

  function initMasbahaPresets() {
    const masbahaCat = ADHKAR_CATEGORIES.find(c => c.id === 'masbaha');
    if (!masbahaCat) return;

    elements.masbahaSelect.innerHTML = '';
    masbahaCat.items.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${idx + 1}. ${item.text.replace(/\n/g, ' ')}`;
      elements.masbahaSelect.appendChild(opt);
    });

    elements.masbahaSelect.addEventListener('change', (e) => {
      const selectedItem = masbahaCat.items[e.target.value];
      if (selectedItem) {
        state.masbaha.text = selectedItem.text;
        state.masbaha.reward = selectedItem.reward || '';
        elements.masbahaCustomInput.value = '';
        updateMasbahaDisplay();
        saveMasbahaState();
      }
    });

    elements.masbahaCustomInput.addEventListener('input', (e) => {
      const customVal = e.target.value.trim();
      if (customVal.length > 0) {
        state.masbaha.text = customVal;
        state.masbaha.reward = '';
        updateMasbahaDisplay();
        saveMasbahaState();
      }
    });

    elements.targetChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.targetChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.masbaha.target = parseInt(btn.dataset.target, 10);
        state.masbaha.count = 0; // تصفير العداد للبدء في الهدف الجديد
        if (elements.masbahaCustomTargetNumber) elements.masbahaCustomTargetNumber.value = '';
        updateMasbahaDisplay();
        saveMasbahaState();
        triggerHaptic('tap');
      });
    });

    if (elements.applyMasbahaCustomTargetBtn) {
      elements.applyMasbahaCustomTargetBtn.addEventListener('click', applyCustomMasbahaTarget);
    }
    if (elements.masbahaCustomTargetNumber) {
      elements.masbahaCustomTargetNumber.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCustomMasbahaTarget();
        }
      });
    }
  }

  function applyCustomMasbahaTarget() {
    const inputVal = elements.masbahaCustomTargetNumber ? elements.masbahaCustomTargetNumber.value.trim() : '';
    const val = parseInt(inputVal, 10);

    if (!isNaN(val) && val > 0) {
      if (elements.targetChips) {
        elements.targetChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      }
      state.masbaha.target = val;
      state.masbaha.count = 0;
      saveMasbahaState();
      updateMasbahaDisplay();
      showToast('تم تطبيق الهدف', `تم ضبط عداد المسبحة على ${val} تسبيحة.`);
      triggerHaptic('tap');
    } else {
      showToast('تنبيه', 'يرجى كتابة رقم صحيح أكبر من الصفر.');
    }
  }

  function renderMasbahaView() {
    updateMasbahaDisplay();
    createBeadsRing();
  }

  function updateMasbahaDisplay() {
    elements.masbahaActiveText.textContent = state.masbaha.text;

    if (state.masbaha.reward && state.masbaha.reward.length > 0) {
      elements.masbahaRewardText.textContent = state.masbaha.reward;
      elements.masbahaRewardBox.classList.remove('hidden');
    } else {
      elements.masbahaRewardBox.classList.add('hidden');
    }

    const count = state.masbaha.count;
    const target = state.masbaha.target;
    elements.masbahaCountDisplay.textContent = count;
    elements.masbahaTargetDisplay.textContent = target === 0 ? '∞' : target;

    if (elements.masbahaCompletedBadge) elements.masbahaCompletedBadge.textContent = count;
    if (elements.masbahaRemainingBadge) {
      elements.masbahaRemainingBadge.textContent = target === 0 ? '∞' : Math.max(0, target - count);
    }

    if (target > 0) {
      const ratio = Math.min(count / target, 1);
      elements.masbahaProgressRing.style.strokeDashoffset = RING_CIRCUMFERENCE - (ratio * RING_CIRCUMFERENCE);
      if (count >= target) {
        elements.masbahaCounterBtn.classList.add('completed');
        if (elements.masbahaCompletionBanner) elements.masbahaCompletionBanner.classList.remove('hidden');
        if (elements.masbahaCounterHint) elements.masbahaCounterHint.textContent = 'تم إكمال الورد — انقر للمتابعة';
      } else {
        elements.masbahaCounterBtn.classList.remove('completed');
        if (elements.masbahaCompletionBanner) elements.masbahaCompletionBanner.classList.add('hidden');
        if (elements.masbahaCounterHint) elements.masbahaCounterHint.textContent = 'انقر للتسبيح';
      }
    } else {
      elements.masbahaProgressRing.style.strokeDashoffset = 0;
      elements.masbahaCounterBtn.classList.remove('completed');
      if (elements.masbahaCompletionBanner) elements.masbahaCompletionBanner.classList.add('hidden');
      if (elements.masbahaCounterHint) elements.masbahaCounterHint.textContent = 'تسبيح مفتوح دون حد';
    }
  }

  function handleMasbahaCounterTap() {
    if (elements.masbahaCounterBtn) {
      elements.masbahaCounterBtn.classList.remove('pulse-tap');
      void elements.masbahaCounterBtn.offsetWidth;
      elements.masbahaCounterBtn.classList.add('pulse-tap');
    }

    state.masbaha.count += 1;
    saveMasbahaState();
    incrementDailyTotal();
    triggerHaptic('tap');

    rotateBeadsStep(1);

    if (state.masbaha.target > 0 && state.masbaha.count === state.masbaha.target) {
      playCompletionChime();
      triggerHaptic('complete');
      showToast('ما شاء الله!', `لقد أكملت الورد المستهدف (${state.masbaha.target} تسبيحة) بنجاح.`);
    }

    updateMasbahaDisplay();
  }

  function undoMasbaha() {
    revertMasbahaResetButton();
    if (state.masbaha.count > 0) {
      state.masbaha.count -= 1;
      rotateBeadsStep(-1);
      saveMasbahaState();
      updateMasbahaDisplay();
      triggerHaptic('tap');
    }
  }

  let masbahaResetTimeout = null;
  function resetMasbaha() {
    if (state.masbaha.count === 0) return;

    if (!elements.masbahaResetBtn.classList.contains('confirm-danger')) {
      elements.masbahaResetBtn.classList.add('confirm-danger');
      const span = elements.masbahaResetBtn.querySelector('span');
      if (span) span.textContent = 'تأكيد التصفير؟';
      triggerHaptic('tap');

      if (masbahaResetTimeout) clearTimeout(masbahaResetTimeout);
      masbahaResetTimeout = setTimeout(() => {
        revertMasbahaResetButton();
      }, 3000);
      return;
    }

    revertMasbahaResetButton();
    state.masbaha.count = 0;
    currentBeadRotation = 0;
    const ring = document.getElementById('beadsRing');
    if (ring) ring.style.setProperty('--bead-rotation', '0deg');

    saveMasbahaState();
    updateMasbahaDisplay();
    triggerHaptic('tap');
  }

  function revertMasbahaResetButton() {
    if (masbahaResetTimeout) {
      clearTimeout(masbahaResetTimeout);
      masbahaResetTimeout = null;
    }
    if (elements.masbahaResetBtn) {
      elements.masbahaResetBtn.classList.remove('confirm-danger');
      const span = elements.masbahaResetBtn.querySelector('span');
      if (span) span.textContent = 'تصفير العداد';
    }
  }

  function enterFullScreenTap() {
    state.isFullScreenTap = true;
    renderActiveDhikr();
    elements.screenTapOverlay.classList.remove('hidden');
  }

  function exitFullScreenTap() {
    state.isFullScreenTap = false;
    elements.screenTapOverlay.classList.add('hidden');
  }

  function handleScreenTap(e) {
    if (e.target.closest('#exitFullScreenTapBtn')) return;
    e.preventDefault();

    if (state.currentCategory === 'masbaha') {
      handleMasbahaCounterTap();
      elements.overlayCurrentCount.textContent = state.masbaha.count;
    } else {
      handleMainCounterTap();
      const item = getCurrentDhikrItem();
      if (item) {
        elements.overlayCurrentCount.textContent = state.progress[item.id] || 0;
      }
    }
  }

  let toastTimeout = null;
  function showToast(title, message) {
    elements.toastTitle.textContent = title;
    elements.toastMessage.textContent = message;
    elements.toastNotification.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      elements.toastNotification.classList.add('hidden');
    }, 3500);
  }

  function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (state.currentCategory === 'masbaha') handleMasbahaCounterTap();
      else handleMainCounterTap();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (state.currentCategory !== 'masbaha') goToNextDhikr();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (state.currentCategory !== 'masbaha') goToPrevDhikr();
    } else if (e.code === 'KeyZ' || e.code === 'Backspace') {
      e.preventDefault();
      if (state.currentCategory === 'masbaha') undoMasbaha();
      else undoCurrentDhikr();
    } else if (e.code === 'Escape') {
      closeTargetModal();
      if (state.isFullScreenTap) exitFullScreenTap();
    }
  }

  function bindEvents() {
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    
    elements.toggleSoundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(STORAGE_KEYS.SOUND, state.soundEnabled);
      updateSoundVibrateUI();
      triggerHaptic('tap');
    });

    elements.toggleVibrateBtn.addEventListener('click', () => {
      state.vibrateEnabled = !state.vibrateEnabled;
      localStorage.setItem(STORAGE_KEYS.VIBRATE, state.vibrateEnabled);
      updateSoundVibrateUI();
      triggerHaptic('tap');
    });

    elements.toggleFullScreenTapBtn.addEventListener('click', enterFullScreenTap);
    elements.exitFullScreenTapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exitFullScreenTap();
    });

    elements.screenTapOverlay.addEventListener('pointerdown', handleScreenTap);

    if (elements.decreaseFontBtn) elements.decreaseFontBtn.addEventListener('click', () => applyFontSize(state.fontSize - 0.15));
    if (elements.increaseFontBtn) elements.increaseFontBtn.addEventListener('click', () => applyFontSize(state.fontSize + 0.15));

    if (elements.openTargetModalBtn) elements.openTargetModalBtn.addEventListener('click', openTargetModal);
    if (elements.closeTargetModalBtn) elements.closeTargetModalBtn.addEventListener('click', closeTargetModal);
    if (elements.targetModalBackdrop) {
      elements.targetModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.targetModalBackdrop) closeTargetModal();
      });
    }

    if (elements.quickTargetChips) {
      elements.quickTargetChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.target-choice-chip');
        if (chip && chip.dataset.target) setDhikrTarget(chip.dataset.target);
      });
    }

    if (elements.applyCustomTargetBtn) {
      elements.applyCustomTargetBtn.addEventListener('click', () => {
        if (elements.customTargetInput) setDhikrTarget(elements.customTargetInput.value.trim());
      });
    }

    elements.mainCounterBtn.addEventListener('click', handleMainCounterTap);
    elements.nextDhikrBtn.addEventListener('click', goToNextDhikr);
    elements.prevDhikrBtn.addEventListener('click', goToPrevDhikr);
    elements.undoCountBtn.addEventListener('click', undoCurrentDhikr);
    elements.resetCountBtn.addEventListener('click', resetCurrentDhikr);

    elements.masbahaCounterBtn.addEventListener('click', handleMasbahaCounterTap);
    elements.masbahaUndoBtn.addEventListener('click', undoMasbaha);
    elements.masbahaResetBtn.addEventListener('click', resetMasbaha);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', createBeadsRing);
  }

  function init() {
    loadPersistedState();
    renderHijriDate();
    updateRamadanCountdown();
    setInterval(updateRamadanCountdown, 60000);
    renderCategoriesTabs();
    initMasbahaPresets();
    createBeadsRing();
    renderCurrentView();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
