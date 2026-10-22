/**
 * زاد المؤمن - منطق التطبيق التفاعلي (app.js)
 * إدارة الحالة، التخزين المحلي، الأصوات، العدادات، والاهتزاز
 */

(function () {
  'use strict';

  // ==========================================
  // 1. مفاتيح التخزين المحلي (LocalStorage Keys)
  // ==========================================
  const STORAGE_KEYS = {
    THEME: 'zad_theme',
    CURRENT_CAT: 'zad_current_category',
    CURRENT_INDEX: 'zad_current_index',
    PROGRESS: 'zad_adhkar_progress',
    STREAK: 'zad_streak_tracker',
    DAILY_TOTAL: 'zad_daily_total',
    SOUND: 'zad_sound_enabled',
    VIBRATE: 'zad_vibrate_enabled',
    MASBAHA_STATE: 'zad_masbaha_state',
    FONT_SIZE: 'zad_font_size',
    CUSTOM_TARGETS: 'zad_custom_targets'
  };

  // ==========================================
  // 2. حالة التطبيق (Application State)
  // ==========================================
  const state = {
    currentCategory: 'sabah',
    currentIndex: 0,
    progress: {}, // { [dhikrId]: number }
    customTargets: {}, // { [dhikrId]: number }
    streak: { count: 1, lastDate: '' },
    dailyTotal: { count: 0, date: '' },
    soundEnabled: true,
    vibrateEnabled: true,
    isFullScreenTap: false,
    fontSize: 1.55,
    masbaha: {
      text: 'سُبْحَانَ اللَّهِ',
      count: 0,
      target: 100,
      reward: 'يُكتب لقائلها ألف حسنة أو يُحطّ عنه ألف خطيئة.'
    }
  };

  // محيط الصوت عبر Web Audio API ليعمل دون ملفات خارجية أو إنترنت
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ==========================================
  // 3. عناصر الواجهة (DOM Elements)
  // ==========================================
  const elements = {
    body: document.body,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    lightIcon: document.querySelector('.light-icon'),
    darkIcon: document.querySelector('.dark-icon'),
    streakCount: document.getElementById('streakCount'),
    toggleSoundBtn: document.getElementById('toggleSoundBtn'),
    soundIconOn: document.getElementById('soundIconOn'),
    soundIconOff: document.getElementById('soundIconOff'),
    toggleVibrateBtn: document.getElementById('toggleVibrateBtn'),
    toggleFullScreenTapBtn: document.getElementById('toggleFullScreenTapBtn'),
    categoriesTabs: document.getElementById('categoriesTabs'),
    currentCategoryTitle: document.getElementById('currentCategoryTitle'),
    categoryProgressRatio: document.getElementById('categoryProgressRatio'),
    categoryProgressBar: document.getElementById('categoryProgressBar'),

    // بطاقة الذكر
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

    // نافذة الهدف المخصص
    targetModalBackdrop: document.getElementById('targetModalBackdrop'),
    closeTargetModalBtn: document.getElementById('closeTargetModalBtn'),
    quickTargetChips: document.getElementById('quickTargetChips'),
    customTargetInput: document.getElementById('customTargetInput'),
    applyCustomTargetBtn: document.getElementById('applyCustomTargetBtn'),

    // أزرار التحكم بحجم الخط
    decreaseFontBtn: document.getElementById('decreaseFontBtn'),
    increaseFontBtn: document.getElementById('increaseFontBtn'),

    // أزرار التحكم بالذكر
    prevDhikrBtn: document.getElementById('prevDhikrBtn'),
    nextDhikrBtn: document.getElementById('nextDhikrBtn'),
    undoCountBtn: document.getElementById('undoCountBtn'),
    resetCountBtn: document.getElementById('resetCountBtn'),
    copyDhikrBtn: document.getElementById('copyDhikrBtn'),
    openListModalBtn: document.getElementById('openListModalBtn'),

    // واجهة المسبحة الحرة
    masbahaView: document.getElementById('masbahaView'),
    masbahaSelect: document.getElementById('masbahaSelect'),
    masbahaCustomInput: document.getElementById('masbahaCustomInput'),
    targetChips: document.getElementById('targetChips'),
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

    // النوافذ والإشعارات
    listModalBackdrop: document.getElementById('listModalBackdrop'),
    modalCategoryTitle: document.getElementById('modalCategoryTitle'),
    modalDhikrList: document.getElementById('modalDhikrList'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    toastNotification: document.getElementById('toastNotification'),
    toastTitle: document.getElementById('toastTitle'),
    toastMessage: document.getElementById('toastMessage'),

    // ملء الشاشة
    screenTapOverlay: document.getElementById('screenTapOverlay'),
    exitFullScreenTapBtn: document.getElementById('exitFullScreenTapBtn'),
    overlayDhikrText: document.getElementById('overlayDhikrText'),
    overlayCurrentCount: document.getElementById('overlayCurrentCount'),
    overlayTargetCount: document.getElementById('overlayTargetCount')
  };

  // محيط حلقة التقدم الدائرية (2 * PI * 54)
  const RING_CIRCUMFERENCE = 339.292;

  // ==========================================
  // 4. استرجاع وحفظ الحالة (LocalStorage Helper)
  // ==========================================
  function loadPersistedState() {
    // الوضع اللوني
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    setTheme(savedTheme, false);

    // حجم الخط المحفوظ
    const savedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (savedFontSize) {
      applyFontSize(savedFontSize);
    }

    // الأهداف المخصصة للأذكار
    try {
      const savedTargets = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_TARGETS));
      if (savedTargets && typeof savedTargets === 'object') {
        state.customTargets = savedTargets;
      }
    } catch (e) {
      state.customTargets = {};
    }

    // الصوت والاهتزاز
    state.soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND) !== 'false';
    state.vibrateEnabled = localStorage.getItem(STORAGE_KEYS.VIBRATE) !== 'false';
    updateSoundVibrateUI();

    // القسم وموضع التوقف
    const savedCat = localStorage.getItem(STORAGE_KEYS.CURRENT_CAT);
    if (savedCat && ADHKAR_CATEGORIES.some(c => c.id === savedCat)) {
      state.currentCategory = savedCat;
    }

    const savedIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX), 10);
    if (!isNaN(savedIndex) && savedIndex >= 0) {
      state.currentIndex = savedIndex;
    }

    // تقدم العدادات
    try {
      const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS));
      if (savedProgress && typeof savedProgress === 'object') {
        state.progress = savedProgress;
      }
    } catch (e) {
      state.progress = {};
    }

    // المسبحة الحرة
    try {
      const savedMasbaha = JSON.parse(localStorage.getItem(STORAGE_KEYS.MASBAHA_STATE));
      if (savedMasbaha && typeof savedMasbaha === 'object') {
        state.masbaha = Object.assign(state.masbaha, savedMasbaha);
      }
    } catch (e) {}

    // أيام الالتزام والإجمالي اليومي
    updateStreakAndDailyTotals();
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

  // ==========================================
  // 5. حساب أيام الالتزام (Streak Days Tracker)
  // ==========================================
  function getTodayString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function updateStreakAndDailyTotals() {
    const today = getTodayString();
    
    // 1. حساب الـ Streak
    let streakData = { count: 1, lastDate: today };
    try {
      const savedStreak = JSON.parse(localStorage.getItem(STORAGE_KEYS.STREAK));
      if (savedStreak && savedStreak.lastDate) {
        streakData = savedStreak;
      }
    } catch (e) {}

    if (streakData.lastDate !== today) {
      const last = new Date(streakData.lastDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // يوم متتالي بالضبط
        streakData.count += 1;
        streakData.lastDate = today;
      } else if (diffDays > 1) {
        // انقطع الالتزام لأكثر من يوم
        streakData.count = 1;
        streakData.lastDate = today;
      }
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streakData));
    }
    state.streak = streakData;
    elements.streakCount.textContent = streakData.count;

    // 2. إجمالي التسبيح اليومي
    let dailyData = { date: today, count: 0 };
    try {
      const savedDaily = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_TOTAL));
      if (savedDaily && savedDaily.date === today) {
        dailyData = savedDaily;
      }
    } catch (e) {}
    state.dailyTotal = dailyData;
    elements.dailyTotalCount.textContent = dailyData.count;
  }

  function incrementDailyTotal() {
    const today = getTodayString();
    if (state.dailyTotal.date !== today) {
      state.dailyTotal.date = today;
      state.dailyTotal.count = 0;
    }
    state.dailyTotal.count += 1;
    elements.dailyTotalCount.textContent = state.dailyTotal.count;
    localStorage.setItem(STORAGE_KEYS.DAILY_TOTAL, JSON.stringify(state.dailyTotal));
  }

  // ==========================================
  // 6. المؤثرات الصوتية والاهتزازية (Audio & Haptic)
  // ==========================================
  function playCompletionChime() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // نغمة خافتة وجميلة عند إتمام الذكر
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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
    if (type === 'tap') {
      navigator.vibrate(15); // اهتزاز تفاعلي خفيف للغاية وناعم على الهواتف
    } else if (type === 'complete' || type === 'target_reached') {
      navigator.vibrate([30, 50, 30]); // اهتزاز ناعم عند الوصول للهدف أو الإتمام
    }
  }

  // ==========================================
  // 7. إدارة المظهر والأوضاع (Theme & Settings)
  // ==========================================
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
    if (save) {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
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

  // التحكم في حجم خط الذكر (A+ / A-)
  function applyFontSize(size) {
    const parsed = parseFloat(size) || 1.55;
    const clamped = Math.max(1.15, Math.min(2.4, parsed));
    state.fontSize = Number(clamped.toFixed(2));
    document.documentElement.style.setProperty('--dhikr-font-size', `${state.fontSize}rem`);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, state.fontSize.toString());
  }

  function increaseFontSize() {
    applyFontSize(state.fontSize + 0.15);
  }

  function decreaseFontSize() {
    applyFontSize(state.fontSize - 0.15);
  }

  // ==========================================
  // 8. بناء الواجهة وتبديل الأقسام
  // ==========================================
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

    // تحديث التبويبات النشطة
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
      renderMasbahaView();
    } else {
      elements.dhikrCard.classList.remove('hidden');
      elements.masbahaView.classList.add('hidden');
      renderActiveDhikr();
    }
    updateCategoryProgress();
  }

  // صياغة عربية بليغة للتكرار
  function formatArabicRepetition(count) {
    if (count === 1) return 'مرة واحدة';
    if (count === 2) return 'مرتان';
    if (count >= 3 && count <= 10) return `${count} مرات`;
    return `${count} مرة`;
  }

  // الحصول على هدف الذكر (المخصص أو الأصلي)
  function getDhikrTarget(item) {
    if (!item) return 1;
    if (state.customTargets && state.customTargets[item.id] && state.customTargets[item.id] > 0) {
      return state.customTargets[item.id];
    }
    return item.count || 1;
  }

  // ==========================================
  // 9. عرض الذكر الحالي في البطاقة
  // ==========================================
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

    // الفضل أو المصدر
    if (item.reward && item.reward.trim().length > 0) {
      elements.dhikrRewardText.textContent = item.reward;
      elements.dhikrRewardBox.classList.remove('hidden');
    } else {
      elements.dhikrRewardBox.classList.add('hidden');
    }

    // العداد والإحصائيات السريعة (المكتمل والمتبقي)
    const current = state.progress[item.id] || 0;
    const remaining = Math.max(0, target - current);
    elements.currentCountDisplay.textContent = current;
    elements.targetCountDisplay.textContent = target;

    if (elements.completedCountBadge) elements.completedCountBadge.textContent = current;
    if (elements.remainingCountBadge) elements.remainingCountBadge.textContent = remaining;

    // تحديث حلقة التقدم الدائرية
    const progressRatio = Math.min(current / target, 1);
    const offset = RING_CIRCUMFERENCE - (progressRatio * RING_CIRCUMFERENCE);
    elements.counterProgressRing.style.strokeDashoffset = offset;

    // حالة الإتمام للزر والبانر
    if (current >= target) {
      elements.mainCounterBtn.classList.add('completed');
      if (elements.completionBanner) elements.completionBanner.classList.remove('hidden');
      if (elements.mainCounterHint) elements.mainCounterHint.textContent = 'مكتمل بحمد الله — انقر للذكر التالي';
    } else {
      elements.mainCounterBtn.classList.remove('completed');
      if (elements.completionBanner) elements.completionBanner.classList.add('hidden');
      if (elements.mainCounterHint) elements.mainCounterHint.textContent = 'اضغط للتسبيح';
    }

    // تحديث شاشة النقر الكامل إن كانت نشطة
    if (state.isFullScreenTap) {
      elements.overlayDhikrText.textContent = item.text;
      elements.overlayCurrentCount.textContent = current;
      elements.overlayTargetCount.textContent = target;
    }
  }

  function updateCategoryProgress() {
    const cat = getCurrentCategoryData();
    if (state.currentCategory === 'masbaha') {
      elements.categoryProgressRatio.textContent = 'مسبحة حرة';
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

    // إذا أتم كل أذكار القسم
    if (completedItems === totalItems && totalItems > 0) {
      // إشعار تهنئة خفيف
    }
  }

  // ==========================================
  // 10. منطق التسبيح والعد (Counter Handlers)
  // ==========================================
  function handleMainCounterTap() {
    const item = getCurrentDhikrItem();
    if (!item) return;

    const target = getDhikrTarget(item);
    let current = state.progress[item.id] || 0;

    // وميض لمس بصري
    elements.mainCounterBtn.classList.remove('pulse-tap');
    void elements.mainCounterBtn.offsetWidth; // Trigger reflow
    elements.mainCounterBtn.classList.add('pulse-tap');

    // إذا كان الذكر مكتملاً بالفعل وضغط المستخدم مجدداً، ينتقل تلقائياً للذكر التالي لتسهيل الجلسة
    if (current >= target) {
      goToNextDhikr();
      return;
    }

    // زيادة العداد
    current += 1;
    state.progress[item.id] = current;
    saveProgress();
    incrementDailyTotal();

    // اهتزاز تفاعلي خفيف للغاية وناعم
    triggerHaptic('tap');

    // هل وصل للهدف الآن؟
    if (current === target) {
      playCompletionChime();
      triggerHaptic('target_reached');
      showCelebrationSpark();

      // فحص إذا انتهى القسم كاملاً
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

    // خطوة تأكيد ثنائية لحماية المستخدم من التصفير غير المقصود
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

    // تم النقر للمرة الثانية - تنفيذ التصفير
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
    if (state.currentIndex < cat.items.length - 1) {
      state.currentIndex += 1;
    } else {
      state.currentIndex = 0; // حلقة مستمرة
    }
    saveCurrentPosition();
    renderActiveDhikr();
    triggerHaptic('tap');
  }

  function goToPrevDhikr() {
    revertResetButton();
    const cat = getCurrentCategoryData();
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
    } else {
      state.currentIndex = cat.items.length - 1;
    }
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
      showToast('مبارك! تقبل الله طاعتك ', `لقد أتممت جميع ${cat.name} كاملة بنجاح.`);
    }
  }

  // ==========================================
  // إدارة نافذة تحديد الهدف المخصص (Custom Target Modal)
  // ==========================================
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

    if (elements.targetModalBackdrop) {
      elements.targetModalBackdrop.classList.remove('hidden');
    }
  }

  function closeTargetModal() {
    if (elements.targetModalBackdrop) {
      elements.targetModalBackdrop.classList.add('hidden');
    }
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
      showToast('هدف الذكر', `تمت استعادة التكرار الأصلي (${item.count} مرة).`);
      return;
    }

    const parsed = parseInt(targetValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('تنبيه', 'يرجى إدخال عدد صحيح أكبر من الصفر.');
      return;
    }

    const clamped = Math.min(Math.max(parsed, 1), 9999);
    state.customTargets[item.id] = clamped;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TARGETS, JSON.stringify(state.customTargets));

    closeTargetModal();
    renderActiveDhikr();
    updateCategoryProgress();
    triggerHaptic('tap');
    showToast('تم تحديث الهدف', `تم تحديد هدف التكرار لهذا الذكر إلى ${clamped} مرة.`);
  }

  // ==========================================
  // 11. واجهة المسبحة الحرة (Masbaha Logic)
  // ==========================================
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

    // عند تغيير الاختيار
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

    // عند إدخال ذكر مخصص
    elements.masbahaCustomInput.addEventListener('input', (e) => {
      const customVal = e.target.value.trim();
      if (customVal.length > 0) {
        state.masbaha.text = customVal;
        state.masbaha.reward = '';
        updateMasbahaDisplay();
        saveMasbahaState();
      }
    });

    // اختيار أهداف المسبحة (Target Chips)
    elements.targetChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.targetChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.masbaha.target = parseInt(btn.dataset.target, 10);
        updateMasbahaDisplay();
        saveMasbahaState();
      });
    });
  }

  function renderMasbahaView() {
    updateMasbahaDisplay();
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

    // حلقة التقدم
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
    elements.masbahaCounterBtn.classList.remove('pulse-tap');
    void elements.masbahaCounterBtn.offsetWidth;
    elements.masbahaCounterBtn.classList.add('pulse-tap');

    state.masbaha.count += 1;
    saveMasbahaState();
    incrementDailyTotal();

    // اهتزاز تفاعلي خفيف للغاية وناعم
    triggerHaptic('tap');

    if (state.masbaha.target > 0 && state.masbaha.count === state.masbaha.target) {
      playCompletionChime();
      triggerHaptic('complete');
      showCelebrationSpark();
      showToast('ما شاء الله!', `لقد أكملت الورد المستهدف (${state.masbaha.target} تسبيحة) بنجاح.`);
    }

    updateMasbahaDisplay();
  }

  function undoMasbaha() {
    revertMasbahaResetButton();
    if (state.masbaha.count > 0) {
      state.masbaha.count -= 1;
      saveMasbahaState();
      updateMasbahaDisplay();
      triggerHaptic('tap');
    }
  }

  let masbahaResetTimeout = null;
  function resetMasbaha() {
    if (state.masbaha.count === 0) {
      showToast('العداد مصفّر', 'عداد المسبحة مصفّر بالفعل.');
      return;
    }

    // تأكيد ثنائي لمنع تصفير المسبحة خطأً
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

    // تم النقر ثانية للتأكيد
    revertMasbahaResetButton();
    state.masbaha.count = 0;
    saveMasbahaState();
    updateMasbahaDisplay();
    triggerHaptic('tap');
    showToast('تم التصفير', 'تمت إعادة تعيين عداد المسبحة إلى الصفر.');
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

  // ==========================================
  // 12. الفهرس والتنقل السريع (Index Modal)
  // ==========================================
  function openListModal() {
    const cat = getCurrentCategoryData();
    elements.modalCategoryTitle.textContent = `فهرس ${cat.name}`;
    elements.modalDhikrList.innerHTML = '';

    cat.items.forEach((item, idx) => {
      const c = state.progress[item.id] || 0;
      const target = getDhikrTarget(item);
      const isDone = c >= target;
      const isActive = idx === state.currentIndex;

      const row = document.createElement('div');
      row.className = `modal-dhikr-item ${isActive ? 'active' : ''}`;
      row.innerHTML = `
        <span class="modal-dhikr-preview">${idx + 1}. ${item.text.replace(/\n/g, ' ')}</span>
        <div class="modal-dhikr-meta">
          <span class="modal-status-badge ${isDone ? 'done' : ''}">${c} / ${target}</span>
        </div>
      `;
      row.addEventListener('click', () => {
        state.currentIndex = idx;
        saveCurrentPosition();
        renderActiveDhikr();
        closeListModal();
      });
      elements.modalDhikrList.appendChild(row);
    });

    elements.listModalBackdrop.classList.remove('hidden');
  }

  function closeListModal() {
    elements.listModalBackdrop.classList.add('hidden');
  }

  // ==========================================
  // 13. وضع التسبيح بالنقر على كامل الشاشة
  // ==========================================
  function enterFullScreenTap() {
    state.isFullScreenTap = true;
    renderActiveDhikr();
    elements.screenTapOverlay.classList.remove('hidden');
  }

  function exitFullScreenTap() {
    state.isFullScreenTap = false;
    elements.screenTapOverlay.classList.add('hidden');
  }

  // ==========================================
  // 14. الإشعارات والنسخ والاحتفال
  // ==========================================
  let toastTimeout = null;
  function showToast(title, message) {
    elements.toastTitle.textContent = title;
    elements.toastMessage.textContent = message;
    elements.toastNotification.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      elements.toastNotification.classList.add('hidden');
    }, 4000);
  }

  function copyCurrentDhikr() {
    const item = getCurrentDhikrItem();
    if (!item) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(item.text).then(() => {
        showToast('تم النسخ بنجاح', 'تم نسخ نص الذكر إلى الحافظة.');
      }).catch(() => fallbackCopy(item.text));
    } else {
      fallbackCopy(item.text);
    }
  }

  function fallbackCopy(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('تم النسخ بنجاح', 'تم نسخ نص الذكر إلى الحافظة.');
  }

  function showCelebrationSpark() {
    // وميض احتفالي ناعم
    elements.dhikrCard.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.45)';
    setTimeout(() => {
      elements.dhikrCard.style.boxShadow = '';
    }, 600);
  }

  // ==========================================
  // 15. اختصارات لوحة المفاتيح (Keyboard Shortcuts)
  // ==========================================
  function handleKeyDown(e) {
    // تجاهل لو كان المستخدم يكتب في حقل إدخال
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // زر المسافة (Space) للتسبيح
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.currentCategory === 'masbaha') {
        handleMasbahaCounterTap();
      } else {
        handleMainCounterTap();
      }
    }
    // السهم لليسار (التالي في RTL)
    else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (state.currentCategory !== 'masbaha') goToNextDhikr();
    }
    // السهم لليمين (السابق في RTL)
    else if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (state.currentCategory !== 'masbaha') goToPrevDhikr();
    }
    // حرف Z أو Backspace للتراجع
    else if (e.code === 'KeyZ' || e.code === 'Backspace') {
      e.preventDefault();
      if (state.currentCategory === 'masbaha') {
        undoMasbaha();
      } else {
        undoCurrentDhikr();
      }
    }
    // حرف R للتصفير
    else if (e.code === 'KeyR') {
      e.preventDefault();
      if (state.currentCategory === 'masbaha') {
        resetMasbaha();
      } else {
        resetCurrentDhikr();
      }
    }
    // زر الهروب Escape لإغلاق النوافذ
    else if (e.code === 'Escape') {
      closeListModal();
      closeTargetModal();
      if (state.isFullScreenTap) exitFullScreenTap();
    }
  }

  // ==========================================
  // 16. ربط الأحداث والتهيئة الأولية (Init)
  // ==========================================
  function bindEvents() {
    // تبويبات الأقسام (تفويض النقر لضمان استجابة فورية وقوية)
    if (elements.categoriesTabs) {
      elements.categoriesTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (btn && btn.dataset.id) {
          e.preventDefault();
          switchCategory(btn.dataset.id);
        }
      });
    }

    // أزرار الرأس
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

    // التسبيح عبر النقر على شاشة النقر الكامل
    elements.screenTapOverlay.addEventListener('click', () => {
      if (state.currentCategory === 'masbaha') {
        handleMasbahaCounterTap();
      } else {
        handleMainCounterTap();
      }
    });

    // التحكم في حجم خط الذكر
    if (elements.decreaseFontBtn) elements.decreaseFontBtn.addEventListener('click', decreaseFontSize);
    if (elements.increaseFontBtn) elements.increaseFontBtn.addEventListener('click', increaseFontSize);

    // نافذة تعديل هدف التكرار المخصص
    if (elements.openTargetModalBtn) {
      elements.openTargetModalBtn.addEventListener('click', openTargetModal);
    }
    if (elements.closeTargetModalBtn) {
      elements.closeTargetModalBtn.addEventListener('click', closeTargetModal);
    }
    if (elements.targetModalBackdrop) {
      elements.targetModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.targetModalBackdrop) closeTargetModal();
      });
    }
    if (elements.quickTargetChips) {
      elements.quickTargetChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.target-choice-chip');
        if (chip && chip.dataset.target) {
          setDhikrTarget(chip.dataset.target);
        }
      });
    }
    if (elements.applyCustomTargetBtn) {
      elements.applyCustomTargetBtn.addEventListener('click', () => {
        if (elements.customTargetInput) {
          setDhikrTarget(elements.customTargetInput.value.trim());
        }
      });
    }
    if (elements.customTargetInput) {
      elements.customTargetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          setDhikrTarget(elements.customTargetInput.value.trim());
        }
      });
    }

    // زر العداد وأدوات بطاقة الذكر
    elements.mainCounterBtn.addEventListener('click', handleMainCounterTap);
    elements.nextDhikrBtn.addEventListener('click', goToNextDhikr);
    elements.prevDhikrBtn.addEventListener('click', goToPrevDhikr);
    elements.undoCountBtn.addEventListener('click', undoCurrentDhikr);
    elements.resetCountBtn.addEventListener('click', resetCurrentDhikr);
    elements.copyDhikrBtn.addEventListener('click', copyCurrentDhikr);
    elements.openListModalBtn.addEventListener('click', openListModal);

    // واجهة المسبحة الحرة
    elements.masbahaCounterBtn.addEventListener('click', handleMasbahaCounterTap);
    elements.masbahaUndoBtn.addEventListener('click', undoMasbaha);
    elements.masbahaResetBtn.addEventListener('click', resetMasbaha);

    // نافذة الفهرس
    elements.closeModalBtn.addEventListener('click', closeListModal);
    elements.listModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.listModalBackdrop) closeListModal();
    });

    // لوحة المفاتيح
    window.addEventListener('keydown', handleKeyDown);
  }

  function init() {
    loadPersistedState();
    renderCategoriesTabs();
    initMasbahaPresets();
    renderCurrentView();
    bindEvents();
  }

  // انطلاق التطبيق فور جاهزية الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
