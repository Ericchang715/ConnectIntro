(function () {
  'use strict';
  const data = window.GUIDE_DATA;
  if (!data || !data.chapters || !data.gallery) return;
  const $ = function (id) { return document.getElementById(id); };
  const chapters = data.chapters.map(function (chapter) { return $(chapter.id); });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeChapter = -1;
  let presenting = false;
  let notesOpen = false;
  let currentImage = 0;
  let scrollScheduled = false;
  const imageDialog = $('image-dialog');
  const chapterDialog = $('chapter-dialog');
  const storageKey = 'hwatai-connect-teacher-guide-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { saved = {}; }
  if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};

  function saveLocal() {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) { /* Local storage is optional. */ }
  }
  function pad(value) { return String(value).padStart(2, '0'); }
  function setChapter(index) {
    index = Math.max(0, Math.min(chapters.length - 1, index));
    if (index === activeChapter) return;
    activeChapter = index;
    const chapter = data.chapters[index];
    $('current-page').textContent = pad(index + 1);
    $('current-chapter-title').textContent = chapter.label;
    $('notes-title').textContent = chapter.label;
    $('notes-copy').textContent = chapter.notes;
    $('notes-source').textContent = '原簡報第 ' + chapter.page + ' 頁';
    $('prev-chapter').disabled = index === 0;
    $('next-chapter').disabled = index === chapters.length - 1;
    document.querySelectorAll('[data-chapter-link]').forEach(function (element) {
      const selected = Number(element.dataset.chapterLink) === index;
      element.classList.toggle('active', selected);
      if (selected) element.setAttribute('aria-current', 'location');
      else element.removeAttribute('aria-current');
    });
  }
  function updateScroll() {
    scrollScheduled = false;
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    const probe = window.scrollY + headerHeight + Math.min(220, window.innerHeight * 0.23);
    let index = 0;
    chapters.forEach(function (chapter, i) {
      if (chapter.offsetTop <= probe) index = i;
    });
    setChapter(index);
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const progress = limit > 0 ? Math.max(0, Math.min(100, window.scrollY / limit * 100)) : 100;
    $('reading-progress').style.width = progress + '%';
  }
  function scheduleScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateScroll);
  }
  function goToChapter(index) {
    index = Math.max(0, Math.min(chapters.length - 1, index));
    chapters[index].querySelectorAll('.will-reveal').forEach(function (node) { node.classList.add('is-visible'); });
    chapters[index].scrollIntoView({ behavior: 'auto', block: 'start' });
    setChapter(index);
    try { history.replaceState(null, '', '#' + data.chapters[index].id); } catch (_) { /* Anchors still work. */ }
    scheduleScroll();
  }

  data.chapters.forEach(function (chapter, index) {
    const railLink = document.createElement('a');
    railLink.href = '#' + chapter.id;
    railLink.className = 'rail-link';
    railLink.dataset.chapterLink = String(index);
    railLink.setAttribute('aria-label', '第 ' + (index + 1) + ' 章：' + chapter.label);
    const railLabel = document.createElement('span');
    railLabel.className = 'rail-label';
    railLabel.textContent = chapter.label;
    railLink.append(railLabel, document.createTextNode(pad(index + 1)), document.createElement('i'));
    $('chapter-rail').appendChild(railLink);
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.chapterLink = String(index);
    const number = document.createElement('span');
    number.textContent = pad(index + 1);
    const arrow = document.createElement('i');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(number, document.createTextNode(chapter.label), arrow);
    button.addEventListener('click', function () { chapterDialog.close(); goToChapter(index); });
    item.appendChild(button);
    $('chapter-list').appendChild(item);
  });
  document.querySelectorAll('.chapter-menu-button').forEach(function (button) {
    button.addEventListener('click', function () { chapterDialog.showModal(); });
  });
  $('chapter-close').addEventListener('click', function () { chapterDialog.close(); });

  const readerContent = [
    ['先讀懂句子，再理解概念。', '利用簡化與翻譯協助理解原文，學生可依自己的閱讀速度前進。'],
    ['讓注意力，回到閱讀重點。', '透過畫面中的重點標示，協助學生整理正在閱讀的內容，再回到需要釐清的概念。'],
    ['依自己的步調，聽讀內容。', '運用朗讀支援自主學習，讓學生選擇適合自己的閱讀節奏。']
  ];
  const readerTabs = Array.from(document.querySelectorAll('[data-reader-tab]'));
  function changeReader(index, focus) {
    readerTabs.forEach(function (tab, i) {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    $('reader-panel-title').textContent = readerContent[index][0];
    $('reader-panel-copy').textContent = readerContent[index][1];
    $('reader-panel').setAttribute('aria-labelledby', readerTabs[index].id);
    if (focus) readerTabs[index].focus();
  }
  readerTabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { changeReader(index, false); });
    tab.addEventListener('keydown', function (event) {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % readerTabs.length;
      else if (event.key === 'ArrowLeft') next = (index + readerTabs.length - 1) % readerTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = readerTabs.length - 1;
      else return;
      event.preventDefault();
      event.stopPropagation();
      changeReader(next, true);
    });
  });

  function showImage(index) {
    currentImage = Math.max(0, Math.min(data.gallery.length - 1, index));
    const item = data.gallery[currentImage];
    $('image-title').textContent = item.title;
    $('image-page').textContent = '原始簡報第 ' + item.page + ' 頁 · 操作畫面';
    $('full-image').src = item.file;
    $('full-image').alt = item.title + '，保留原簡報的操作介面與標示';
    $('image-original').href = item.file;
    $('image-count').textContent = (currentImage + 1) + ' / ' + data.gallery.length;
    $('image-prev').disabled = currentImage === 0;
    $('image-next').disabled = currentImage === data.gallery.length - 1;
    $('image-stage').classList.remove('zoomed');
    $('image-zoom').setAttribute('aria-pressed', 'false');
    $('image-zoom').textContent = '放大閱讀';
    $('image-stage').scrollTop = 0;
    $('image-stage').scrollLeft = 0;
    if (!imageDialog.open) imageDialog.showModal();
  }
  document.querySelectorAll('[data-image]').forEach(function (button) {
    button.addEventListener('click', function () { showImage(Number(button.dataset.image)); });
  });
  $('image-close').addEventListener('click', function () { imageDialog.close(); });
  $('image-prev').addEventListener('click', function () { showImage(currentImage - 1); });
  $('image-next').addEventListener('click', function () { showImage(currentImage + 1); });
  $('image-zoom').addEventListener('click', function () {
    const zoomed = $('image-stage').classList.toggle('zoomed');
    this.setAttribute('aria-pressed', String(zoomed));
    this.textContent = zoomed ? '適合畫面' : '放大閱讀';
  });
  [imageDialog, chapterDialog].forEach(function (dialog) {
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  const checkInputs = Array.from(document.querySelectorAll('[data-check]'));
  function updateChecklist() {
    const done = checkInputs.filter(function (input) { return input.checked; }).length;
    $('setup-status').textContent = '已完成 ' + done + '／3 項準備';
    $('setup-progress-fill').style.width = (done / 3 * 100) + '%';
  }
  checkInputs.forEach(function (input) {
    input.checked = !!(saved.checks && saved.checks[input.dataset.check]);
    input.addEventListener('change', function () {
      if (!saved.checks || typeof saved.checks !== 'object') saved.checks = {};
      saved.checks[input.dataset.check] = input.checked;
      saveLocal();
      updateChecklist();
    });
  });
  updateChecklist();

  const plans = {
    reading: { tool: 'SmartBook', task: '設定一份課前預習', detail: '觀察學生完成率與概念題表現，找出下次課堂要釐清的地方。', goal: '改善課前閱讀' },
    feedback: { tool: 'Question Bank', task: '設定一份線上作業', detail: '先確認作答次數、截止與答案顯示規則，再查看共同的錯誤概念。', goal: '改善作業回饋' },
    application: { tool: 'Integrated Excel／ABA', task: '選一份計算練習或情境任務', detail: '先確認教材可用項目，完成後討論公式選擇或決策依據。', goal: '增加課堂應用' }
  };
  const chapterInput = $('pilot-chapter');
  const goalInputs = Array.from(document.querySelectorAll('input[name="goal"]'));
  if (typeof saved.chapter === 'string') chapterInput.value = saved.chapter.slice(0, 50);
  if (typeof saved.goal === 'string' && plans[saved.goal]) {
    goalInputs.forEach(function (input) { input.checked = input.value === saved.goal; });
  }
  function selectedPlan() {
    const selected = goalInputs.find(function (input) { return input.checked; });
    return plans[selected ? selected.value : 'reading'];
  }
  function updatePlan() {
    const plan = selectedPlan();
    const chapter = chapterInput.value.trim();
    $('plan-tool').textContent = plan.tool;
    $('plan-chapter').textContent = chapter ? '選定章節：' + chapter : '選定一個熟悉的章節';
    $('plan-task').textContent = plan.task;
    $('plan-detail').textContent = plan.detail;
    $('plan-status').textContent = '';
    saved.chapter = chapterInput.value.slice(0, 50);
    saved.goal = (goalInputs.find(function (input) { return input.checked; }) || goalInputs[0]).value;
    saveLocal();
  }
  chapterInput.addEventListener('input', updatePlan);
  goalInputs.forEach(function (input) { input.addEventListener('change', updatePlan); });
  updatePlan();
  function planText() {
    const plan = selectedPlan();
    const chapter = chapterInput.value.trim() || '選定一個熟悉的章節';
    return [
      'McGraw Hill Connect｜我的一章試跑計畫',
      '',
      '章節：' + chapter,
      '目標：' + plan.goal,
      '建議起點：' + plan.tool,
      '',
      '01 申請測試帳號',
      '與華泰文化業務窗口確認教材與可用功能。',
      '',
      '02 選定章節：' + chapter,
      '先控制在一章的範圍，方便觀察與調整。',
      '',
      '03 ' + plan.task,
      plan.detail,
      '',
      '完成後觀察：備課時間、學生完成率與常見錯誤概念。',
      '先求流程順暢，再逐步增加章節與活動。',
      '',
      '功能與教材資源以實際課程及帳號權限為準。',
      '這是個人規劃，不會送出帳號申請。'
    ].join('\n');
  }
  $('copy-plan').addEventListener('click', async function () {
    const content = planText();
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      $('plan-status').textContent = '已複製，可貼到你的備課筆記中。';
    } catch (_) {
      $('copy-plan-text').value = content;
      $('copy-fallback').hidden = false;
      $('copy-plan-text').focus();
      $('copy-plan-text').select();
      $('plan-status').textContent = '請選取並複製計畫，或下載文字檔。';
    }
  });
  $('copy-fallback-close').addEventListener('click', function () { $('copy-fallback').hidden = true; $('copy-plan').focus(); });
  $('download-plan').addEventListener('click', function () {
    const blob = new Blob(['\uFEFF' + planText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Connect-first-chapter-plan.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    $('plan-status').textContent = '已建立試跑計畫文字檔。';
  });

  function toggleNotes(value) {
    notesOpen = typeof value === 'boolean' ? value : !notesOpen;
    $('speaker-notes').hidden = !notesOpen;
    $('notes-toggle').setAttribute('aria-expanded', String(notesOpen));
  }
  function togglePresentation(value) {
    presenting = typeof value === 'boolean' ? value : !presenting;
    document.body.classList.toggle('presenting', presenting);
    $('presenter-bar').hidden = !presenting;
    $('present-toggle').setAttribute('aria-pressed', String(presenting));
    $('present-toggle').firstChild.nodeValue = presenting ? '結束簡報 ' : '簡報模式 ';
    if (presenting) {
      $('current-chapter-title').setAttribute('aria-live', 'polite');
      goToChapter(Math.max(0, activeChapter));
    } else {
      toggleNotes(false);
      $('current-chapter-title').removeAttribute('aria-live');
    }
    scheduleScroll();
  }
  $('present-toggle').addEventListener('click', function () { togglePresentation(); });
  $('exit-present').addEventListener('click', function () { togglePresentation(false); $('present-toggle').focus(); });
  $('prev-chapter').addEventListener('click', function () { goToChapter(activeChapter - 1); });
  $('next-chapter').addEventListener('click', function () { goToChapter(activeChapter + 1); });
  $('notes-toggle').addEventListener('click', function () { toggleNotes(); });
  $('notes-close').addEventListener('click', function () { toggleNotes(false); $('notes-toggle').focus(); });

  document.addEventListener('keydown', function (event) {
    if (imageDialog.open) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(currentImage - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showImage(currentImage + 1); }
      return;
    }
    if (chapterDialog.open || !presenting) return;
    if (event.target instanceof Element && event.target.closest('input,textarea,select,[role="tab"]')) return;
    if (event.key === 'Escape') {
      if (notesOpen) toggleNotes(false);
      else togglePresentation(false);
      return;
    }
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'PageDown') next = activeChapter + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') next = activeChapter - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = chapters.length - 1;
    else return;
    event.preventDefault();
    goToChapter(next);
  });

  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.chapter:not(.intro) > .wrap').forEach(function (element) {
      element.classList.add('will-reveal');
      observer.observe(element);
    });
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  window.addEventListener('load', scheduleScroll);
  document.querySelectorAll('img').forEach(function (image) { image.addEventListener('load', scheduleScroll); });
  updateScroll();
}());
