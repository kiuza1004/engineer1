/**
 * 산업안전산업기사 마스터 PRO 웹앱 메인 엔진 (Argon Edition)
 * 순수 Vanilla JS (외부 프레임워크 종속성 0, 높은 하위 호환성)
 * - 기출 50선 & 기출변형 응용 25선 (과목별 필터링, 셔플, 북마크 영구저장)
 * - 실제 국가기술자격 합격 판정 알고리즘 (과목당 40점 과락 + 평균 60점 분석)
 * - 핵심요약노트 실시간 키워드 검색 & 하이라이트
 * - 스마트 오답노트 (누적 오답 횟수, 과목별 필터, 정답 가리기 토글, 재도전 CBT)
 * - 키보드 단축키 (1~4 보기 선택, 좌/우 화살표 이동, B 북마크)
 */

(function () {
  'use strict';

  const STORAGE_KEY_WRONG_NOTES = 'industrial_safety_wrong_notes_v2';
  const STORAGE_KEY_BOOKMARKS = 'industrial_safety_bookmarks_v2';
  const STORAGE_KEY_THEME = 'industrial_safety_theme';

  // 북마크 로컬스토리지 로드
  function loadStoredBookmarks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveStoredBookmarks(bookmarkSet) {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(Array.from(bookmarkSet)));
    } catch (e) {}
  }

  const sharedBookmarks = loadStoredBookmarks();

  // 1. 상태 관리
  const state = {
    currentMenu: 'info', // 'info' | 'past' | 'applied' | 'wrongNotes'
    currentSummarySubId: 'sub1', // 'sub1' ~ 'sub5' | 'all'
    summarySearchKeyword: '',
    theme: localStorage.getItem(STORAGE_KEY_THEME) || 'light',

    pastExam: {
      mode: 'practice', // 'practice' | 'mock'
      subjectFilter: 'all', // 'all' | 'sub1' ~ 'sub5' | 'bookmark'
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      isSubmitted: false,
      timerSeconds: 75 * 60,
      timerInterval: null,
      isRetakeMode: false
    },

    appliedExam: {
      mode: 'practice',
      subjectFilter: 'all',
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      isSubmitted: false
    },

    wrongNotes: {
      subjectFilter: 'all',
      hideExplanations: false
    }
  };

  // 2. DOM 요소 캐싱
  const dom = {
    pwaNoticeBanner: document.getElementById('pwaNoticeBanner'),
    closeNoticeBtn: document.getElementById('closeNoticeBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    navTabBtns: document.querySelectorAll('.nav-tab-btn'),
    wrongCountBadge: document.getElementById('wrongCountBadge'),
    sections: {
      info: document.getElementById('menu-info'),
      past: document.getElementById('menu-past'),
      applied: document.getElementById('menu-applied'),
      wrongNotes: document.getElementById('menu-wrongNotes')
    },
    // 기본정보 & 요약노트
    subTabBtns: document.querySelectorAll('.sub-tab-btn'),
    summarySearchInput: document.getElementById('summarySearchInput'),
    subjectChips: document.getElementById('subjectChips'),
    detailedSummaryContainer: document.getElementById('detailedSummaryContainer'),
    infoCertTitle: document.getElementById('infoCertTitle'),
    infoCertSub: document.getElementById('infoCertSub'),
    infoCertOverview: document.getElementById('infoCertOverview'),
    infoCertCareer: document.getElementById('infoCertCareer'),
    infoCertFee: document.getElementById('infoCertFee'),
    infoScheduleTableBody: document.getElementById('infoScheduleTableBody'),
    eligibilityOptions: document.getElementById('eligibilityOptions'),
    eligibilityResultBox: document.getElementById('eligibilityResultBox'),
    infoCriteriaContainer: document.getElementById('infoCriteriaContainer'),
    // 기출문제
    pastRoundTitle: document.getElementById('pastRoundTitle'),
    pastModeBadge: document.getElementById('pastModeBadge'),
    pastTimerBox: document.getElementById('pastTimerBox'),
    pastTimerDisplay: document.getElementById('pastTimerDisplay'),
    btnShufflePast: document.getElementById('btnShufflePast'),
    togglePastModeBtn: document.getElementById('togglePastModeBtn'),
    pastSubjectFilterChips: document.getElementById('pastSubjectFilterChips'),
    pastProgressBar: document.getElementById('pastProgressBar'),
    pastOmrGrid: document.getElementById('pastOmrGrid'),
    pastQuestionContainer: document.getElementById('pastQuestionContainer'),
    pastResultContainer: document.getElementById('pastResultContainer'),
    // 응용문제
    appliedTitle: document.getElementById('appliedTitle'),
    btnShuffleApplied: document.getElementById('btnShuffleApplied'),
    btnResetApplied: document.getElementById('btnResetApplied'),
    appliedSubjectFilterChips: document.getElementById('appliedSubjectFilterChips'),
    appliedProgressBar: document.getElementById('appliedProgressBar'),
    appliedOmrGrid: document.getElementById('appliedOmrGrid'),
    appliedQuestionContainer: document.getElementById('appliedQuestionContainer'),
    appliedResultContainer: document.getElementById('appliedResultContainer'),
    // 오답노트
    wrongStatsBar: document.getElementById('wrongStatsBar'),
    wrongNotesListContainer: document.getElementById('wrongNotesListContainer'),
    btnRetakeWrongQuestions: document.getElementById('btnRetakeWrongQuestions'),
    btnToggleAllWrongExplanations: document.getElementById('btnToggleAllWrongExplanations'),
    btnClearAllWrongNotes: document.getElementById('btnClearAllWrongNotes')
  };

  // 3. 오답노트 로컬스토리지 관리 (기존 v1 데이터 호환 마이그레이션 포함)
  function getStoredWrongNotes() {
    try {
      let data = localStorage.getItem(STORAGE_KEY_WRONG_NOTES);
      if (!data) {
        const legacy = localStorage.getItem('industrial_safety_wrong_notes');
        if (legacy) {
          localStorage.setItem(STORAGE_KEY_WRONG_NOTES, legacy);
          data = legacy;
        }
      }
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredWrongNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEY_WRONG_NOTES, JSON.stringify(notes));
      updateWrongBadge();
    } catch (e) {}
  }

  function addWrongQuestion(questionObj, userAnswer) {
    const list = getStoredWrongNotes();
    const existingIndex = list.findIndex(item => item.id === questionObj.id);
    const prevCount = existingIndex >= 0 ? (list[existingIndex].wrongCount || 1) : 0;

    const itemData = {
      id: questionObj.id,
      subjectId: questionObj.subjectId || 'sub1',
      subject: questionObj.subject,
      question: questionObj.question,
      options: questionObj.options,
      answer: questionObj.answer,
      explanation: questionObj.explanation,
      lawRef: questionObj.lawRef || '',
      changePoint: questionObj.changePoint || '',
      originalConcept: questionObj.originalConcept || '',
      userAnswer: userAnswer,
      wrongCount: prevCount + 1,
      date: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = itemData;
    } else {
      list.push(itemData);
    }
    saveStoredWrongNotes(list);
  }

  function removeWrongQuestion(questionId) {
    let list = getStoredWrongNotes();
    const beforeLen = list.length;
    list = list.filter(item => item.id !== questionId);
    if (list.length !== beforeLen) {
      saveStoredWrongNotes(list);
      if (state.currentMenu === 'wrongNotes') {
        renderWrongNotes();
      }
    }
  }

  function clearAllWrongNotes() {
    if (confirm('오답노트의 모든 문제를 완전히 비우시겠습니까?')) {
      saveStoredWrongNotes([]);
      renderWrongNotes();
    }
  }

  function updateWrongBadge() {
    const list = getStoredWrongNotes();
    if (dom.wrongCountBadge) {
      dom.wrongCountBadge.textContent = list.length;
      dom.wrongCountBadge.style.display = list.length > 0 ? 'inline-block' : 'none';
    }
  }

  // 4. 문제 목록 필터링 및 초기화
  function buildFilteredQuestions(type) {
    const sourceQuestions = type === 'past'
      ? APP_DATA.pastExams[0].questions
      : APP_DATA.appliedExams[0].questions;
    const examState = type === 'past' ? state.pastExam : state.appliedExam;
    const filter = examState.subjectFilter;

    let filtered = sourceQuestions.filter(q => {
      if (filter === 'all') return true;
      if (filter === 'bookmark') return sharedBookmarks.has(q.id);
      return q.subjectId === filter;
    });

    examState.questions = [...filtered];
    examState.currentIndex = 0;
    examState.isSubmitted = false;
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  // 5. 앱 초기화
  function initApp() {
    initTheme();
    initPwa();
    buildFilteredQuestions('past');
    buildFilteredQuestions('applied');
    bindEventListeners();
    updateWrongBadge();
    renderAll();
  }

  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeBtn();
  }

  function updateThemeBtn() {
    dom.themeToggleBtn.innerHTML = state.theme === 'dark' ? '☀️ 주간모드' : '🌙 야간모드';
  }

  function initPwa() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('PWA ServiceWorker 등록 완료:', reg.scope))
          .catch(err => console.warn('PWA 등록 실패:', err));
      });
    }
  }

  function bindEventListeners() {
    // PWA 배너 닫기
    dom.closeNoticeBtn.addEventListener('click', () => {
      dom.pwaNoticeBanner.style.display = 'none';
    });

    // 테마 토글
    dom.themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem(STORAGE_KEY_THEME, state.theme);
      updateThemeBtn();
    });

    // 메인 메뉴 전환
    dom.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.target === 'past' && state.pastExam.isRetakeMode) {
          state.pastExam.isRetakeMode = false;
          buildFilteredQuestions('past');
        }
        switchMainMenu(btn.dataset.target);
      });
    });

    // 기본정보 서브탭 전환
    dom.subTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchInfoSubTab(btn.dataset.sub);
      });
    });

    // 요약노트 실시간 키워드 검색
    if (dom.summarySearchInput) {
      dom.summarySearchInput.addEventListener('input', (e) => {
        state.summarySearchKeyword = e.target.value.trim();
        renderDetailedSummary();
      });
    }

    // 요약노트 과목 칩스 클릭
    if (dom.subjectChips) {
      const chipBtns = dom.subjectChips.querySelectorAll('.chip-btn');
      chipBtns.forEach(chip => {
        chip.addEventListener('click', () => {
          chipBtns.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.currentSummarySubId = chip.dataset.subId;
          renderDetailedSummary();
        });
      });
    }

    // 기출문제 과목 필터 칩스
    if (dom.pastSubjectFilterChips) {
      const chips = dom.pastSubjectFilterChips.querySelectorAll('.chip-btn');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          state.pastExam.isRetakeMode = false;
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.pastExam.subjectFilter = chip.dataset.filter;
          buildFilteredQuestions('past');
          renderPastExam();
        });
      });
    }

    // 응용문제 과목 필터 칩스
    if (dom.appliedSubjectFilterChips) {
      const chips = dom.appliedSubjectFilterChips.querySelectorAll('.chip-btn');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          state.appliedExam.subjectFilter = chip.dataset.filter;
          buildFilteredQuestions('applied');
          renderAppliedExam();
        });
      });
    }

    // 기출문제 순서 섞기
    dom.btnShufflePast.addEventListener('click', () => {
      state.pastExam.questions = shuffleArray(state.pastExam.questions);
      state.pastExam.currentIndex = 0;
      renderPastExam();
    });

    // 응용문제 순서 섞기 및 초기화
    dom.btnShuffleApplied.addEventListener('click', () => {
      state.appliedExam.questions = shuffleArray(state.appliedExam.questions);
      state.appliedExam.currentIndex = 0;
      renderAppliedExam();
    });

    dom.btnResetApplied.addEventListener('click', () => {
      if (confirm('응용문제 풀이 기록을 초기화하고 처음부터 다시 푸시겠습니까?')) {
        state.appliedExam.userAnswers = {};
        state.appliedExam.currentIndex = 0;
        state.appliedExam.isSubmitted = false;
        renderAppliedExam();
      }
    });

    // 기출문제 모드 전환 버튼
    dom.togglePastModeBtn.addEventListener('click', () => {
      state.pastExam.isRetakeMode = false;
      if (state.pastExam.mode === 'practice') {
        if (confirm('실전 CBT 모의고사 모드로 전환하시겠습니까?\n75분 제한시간 타이머가 작동하며, 최종 제출 시 과목별 과락(40점) 및 합격(평균 60점) 여부가 일괄 채점됩니다.')) {
          state.pastExam.mode = 'mock';
          state.pastExam.userAnswers = {};
          state.pastExam.isSubmitted = false;
          state.pastExam.currentIndex = 0;
          startPastTimer();
        }
      } else {
        if (confirm('연습 모드로 전환하시겠습니까?\n타이머가 멈추고 문제 풀이 즉시 정답과 상세 해설이 표시됩니다.')) {
          state.pastExam.mode = 'practice';
          state.pastExam.isSubmitted = false;
          stopPastTimer();
        }
      }
      renderPastExam();
    });

    // 오답노트 액션
    dom.btnClearAllWrongNotes.addEventListener('click', clearAllWrongNotes);
    dom.btnRetakeWrongQuestions.addEventListener('click', startRetakeWrongExam);
    dom.btnToggleAllWrongExplanations.addEventListener('click', () => {
      state.wrongNotes.hideExplanations = !state.wrongNotes.hideExplanations;
      dom.btnToggleAllWrongExplanations.innerHTML = state.wrongNotes.hideExplanations
        ? '👁️ 정답/해설 모두 보기'
        : '👁️ 정답/해설 가리기';
      renderWrongNotes();
    });

    // 키보드 단축키 지원 (1~4 보기 선택, 좌우 화살표 이동, B 북마크)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (state.currentMenu !== 'past' && state.currentMenu !== 'applied') return;

      const type = state.currentMenu;
      const s = type === 'past' ? state.pastExam : state.appliedExam;
      if (s.isSubmitted || !s.questions.length) return;
      const currentQ = s.questions[s.currentIndex];
      if (!currentQ) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = parseInt(e.key, 10) - 1;
        handleSelectOption(type, currentQ, optIdx);
      } else if (e.key === 'ArrowRight') {
        if (s.currentIndex < s.questions.length - 1) {
          s.currentIndex++;
          renderExamView(type);
        }
      } else if (e.key === 'ArrowLeft') {
        if (s.currentIndex > 0) {
          s.currentIndex--;
          renderExamView(type);
        }
      } else if (e.key.toLowerCase() === 'b') {
        toggleBookmark(type, currentQ.id);
      }
    });
  }

  function switchMainMenu(target) {
    state.currentMenu = target;
    dom.navTabBtns.forEach(b => b.classList.toggle('active', b.dataset.target === target));
    Object.keys(dom.sections).forEach(k => dom.sections[k].classList.toggle('active', k === target));

    if (target === 'past') renderPastExam();
    else if (target === 'applied') renderAppliedExam();
    else if (target === 'wrongNotes') renderWrongNotes();
    else renderInfo();
  }

  function switchInfoSubTab(targetSub) {
    dom.subTabBtns.forEach(b => b.classList.toggle('active', b.dataset.sub === targetSub));
    document.querySelectorAll('.sub-info-content').forEach(c => {
      c.style.display = c.id === `sub-info-${targetSub}` ? 'block' : 'none';
    });
  }

  function renderAll() {
    renderInfo();
    renderDetailedSummary();
    renderPastExam();
    renderAppliedExam();
    renderWrongNotes();
  }

  // ============================================================
  // 1. 기본정보 및 5과목 기출 핵심요약노트
  // ============================================================
  function renderInfo() {
    const info = APP_DATA.info;
    if (!info) return;

    dom.infoCertTitle.textContent = `${info.name} 자격 개요 및 검정 안내`;
    dom.infoCertSub.textContent = `${info.category} | 시행: ${info.agency} | 영문: ${info.engName}`;
    dom.infoCertOverview.textContent = info.overview;
    dom.infoCertCareer.textContent = info.careerProspect;
    dom.infoCertFee.textContent = info.examFee;

    // 일정 테이블
    dom.infoScheduleTableBody.innerHTML = '';
    info.schedule.forEach(sch => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:800; color:var(--primary);">${sch.round}</td>
        <td>${sch.apply}</td>
        <td><strong>${sch.exam}</strong></td>
        <td>${sch.result}</td>
      `;
      dom.infoScheduleTableBody.appendChild(tr);
    });

    // 응시자격 진단
    dom.eligibilityOptions.innerHTML = '';
    info.eligibility.forEach((el, idx) => {
      const label = document.createElement('label');
      label.className = 'eligibility-option';
      label.innerHTML = `
        <input type="radio" name="eligibility" value="${idx}">
        <div>
          <strong>${el.type}</strong>: <span style="font-size:0.88rem; color:var(--text-muted);">${el.detail}</span>
        </div>
      `;
      label.querySelector('input').addEventListener('change', () => {
        dom.eligibilityResultBox.style.display = 'block';
        dom.eligibilityResultBox.innerHTML = `
          <div style="color:var(--success); margin-bottom:4px;">✅ <strong>[산업안전산업기사 응시 자격 충족]</strong></div>
          <div>선택하신 <strong>'${el.type}'</strong> 요건은 Q-Net 응시자격 자가진단 기준을 통과합니다. 필기시험 합격 후 실기 원서접수 전까지 증빙서류(졸업·경력·학점증명서)를 제출하시면 됩니다.</div>
        `;
      });
      dom.eligibilityOptions.appendChild(label);
    });

    // 5과목 체계 및 합격기준
    const ws = info.examStructure.written;
    const ps = info.examStructure.practical;
    dom.infoCriteriaContainer.innerHTML = `
      <div style="background-color:var(--bg-main); padding:18px; border-radius:var(--radius-sm); border-left:4px solid var(--primary);">
        <h4 style="font-size:1.05rem; margin-bottom:8px; color:var(--primary);">${ws.title}</h4>
        <ul style="padding-left:18px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
          <li><strong>문항 수 및 시험시간:</strong> ${ws.questions} (${ws.duration})</li>
          <li><strong>합격 기준 (과락 주의):</strong> <span style="color:var(--danger); font-weight:800;">${ws.passStandard}</span></li>
        </ul>
        <div style="margin-top:14px;">
          <strong>출제 5개 과목 세부 구성:</strong>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            ${ws.subjects.map(s => `
              <div style="background:var(--bg-card); padding:10px 14px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:0.89rem;">
                <strong style="color:var(--primary);">${s.name}</strong> (${s.questions}문항)
                <div style="color:var(--text-muted); margin-top:2px;">${s.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="background-color:var(--bg-main); padding:18px; border-radius:var(--radius-sm); border-left:4px solid var(--warning);">
        <h4 style="font-size:1.05rem; margin-bottom:8px; color:var(--warning);">${ps.title}</h4>
        <ul style="padding-left:18px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
          <li><strong>검정 방식:</strong> ${ps.method}</li>
          <li><strong>합격 기준:</strong> <span style="color:var(--success); font-weight:800;">${ps.passStandard}</span></li>
        </ul>
      </div>
    `;
  }

  // 과목별 세부 요약집 렌더링 (키워드 검색 필터 및 하이라이트 지원)
  function renderDetailedSummary() {
    const info = APP_DATA.info;
    if (!info || !info.detailedSummaries) return;

    const kw = state.summarySearchKeyword.toLowerCase();
    let targetSubjects = [];

    if (kw.length > 0 || state.currentSummarySubId === 'all') {
      targetSubjects = info.detailedSummaries;
    } else {
      const found = info.detailedSummaries.find(s => s.subjectId === state.currentSummarySubId);
      targetSubjects = found ? [found] : [info.detailedSummaries[0]];
    }

    let html = '';
    let matchCount = 0;

    targetSubjects.forEach(sub => {
      const matchedSections = sub.sections.filter(sec => {
        if (!kw) return true;
        return sec.title.toLowerCase().includes(kw) || sec.content.toLowerCase().includes(kw);
      });

      if (matchedSections.length === 0) return;
      matchCount += matchedSections.length;

      html += `
        <div style="margin-bottom:24px;">
          <div style="margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid var(--primary);">
            <h3 style="font-size:1.12rem; font-weight:800; color:var(--primary); display:flex; align-items:center; gap:6px;">
              <span>📌</span> ${escapeHtml(sub.subjectName)} (${matchedSections.length}개 핵심 테마)
            </h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${matchedSections.map(sec => `
              <div class="summary-section-box">
                <div class="summary-section-title">
                  <span>🎯</span> ${highlightKeyword(sec.title, state.summarySearchKeyword)}
                </div>
                <div class="summary-section-body">${highlightKeyword(sec.content, state.summarySearchKeyword)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    if (matchCount === 0) {
      html = `
        <div class="empty-state-box">
          <div class="empty-state-icon">🔍</div>
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main);">'${escapeHtml(state.summarySearchKeyword)}' 검색 결과가 없습니다.</h3>
          <p style="font-size:0.88rem; margin-top:4px;">다른 키워드(예: 도수율, 안전모, 롤러기, 방폭, 안전난간, 비계)로 검색해 보세요.</p>
        </div>
      `;
    }

    dom.detailedSummaryContainer.innerHTML = html;
  }

  function highlightKeyword(text, keyword) {
    const escaped = escapeHtml(text);
    if (!keyword) return escaped;
    const safeKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeKw})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // ============================================================
  // 2. CBT 시험 엔진 (기출 50선 & 응용 25선 & 오답 재도전 공통)
  // ============================================================
  function startPastTimer() {
    stopPastTimer();
    state.pastExam.timerSeconds = 75 * 60;
    dom.pastTimerBox.style.display = 'flex';
    updatePastTimer();

    state.pastExam.timerInterval = setInterval(() => {
      state.pastExam.timerSeconds--;
      updatePastTimer();
      if (state.pastExam.timerSeconds <= 0) {
        stopPastTimer();
        alert('제한시간 75분이 종료되었습니다! 답안을 자동 제출합니다.');
        submitExam('past');
      }
    }, 1000);
  }

  function stopPastTimer() {
    if (state.pastExam.timerInterval) {
      clearInterval(state.pastExam.timerInterval);
      state.pastExam.timerInterval = null;
    }
    dom.pastTimerBox.style.display = 'none';
  }

  function updatePastTimer() {
    const mins = Math.floor(state.pastExam.timerSeconds / 60);
    const secs = state.pastExam.timerSeconds % 60;
    dom.pastTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderPastExam() {
    const s = state.pastExam;
    dom.pastRoundTitle.textContent = s.isRetakeMode
      ? `🔥 오답노트 집중 재도전 (${s.questions.length}문항)`
      : `산업안전 정기 기출 CBT (${s.questions.length}문항)`;

    dom.pastModeBadge.textContent = s.mode === 'practice' ? '연습 모드 (즉시해설)' : '실전 모의고사 (타이머)';
    dom.pastModeBadge.style.backgroundColor = s.mode === 'practice' ? 'var(--primary)' : 'var(--danger)';
    dom.togglePastModeBtn.textContent = s.mode === 'practice' ? '⏱️ 실전 모의고사로 전환' : '📖 연습 모드로 전환';
    dom.pastSubjectFilterChips.style.display = s.isRetakeMode ? 'none' : 'flex';

    renderExamView('past');
  }

  function renderAppliedExam() {
    const s = state.appliedExam;
    dom.appliedTitle.textContent = `산업안전 기출변형·복합 고난도 챌린지 (${s.questions.length}문항)`;
    renderExamView('applied');
  }

  function renderExamView(type) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const qContainer = type === 'past' ? dom.pastQuestionContainer : dom.appliedQuestionContainer;
    const rContainer = type === 'past' ? dom.pastResultContainer : dom.appliedResultContainer;
    const omrEl = type === 'past' ? dom.pastOmrGrid : dom.appliedOmrGrid;
    const progEl = type === 'past' ? dom.pastProgressBar : dom.appliedProgressBar;

    if (s.questions.length === 0) {
      progEl.style.display = 'none';
      omrEl.innerHTML = '';
      rContainer.style.display = 'none';
      qContainer.style.display = 'block';
      qContainer.innerHTML = `
        <div class="card empty-state-box">
          <div class="empty-state-icon">⭐</div>
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main);">해당 필터에 표시할 문항이 없습니다.</h3>
          <p style="font-size:0.88rem; margin-top:6px;">문제를 풀면서 우측 상단의 [☆ 북마크] 버튼을 누르면 북마크 전용 필터에서 모아볼 수 있습니다.</p>
        </div>
      `;
      return;
    }

    progEl.style.display = 'flex';
    renderProgressBar(type);

    if (s.isSubmitted) {
      qContainer.style.display = 'none';
      rContainer.style.display = 'block';
      renderOmrGrid(type);
      renderExamResult(type);
    } else {
      qContainer.style.display = 'block';
      rContainer.style.display = 'none';
      renderOmrGrid(type);
      renderQuestionCard(type);
    }
  }

  function renderProgressBar(type) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const progEl = type === 'past' ? dom.pastProgressBar : dom.appliedProgressBar;
    const total = s.questions.length;
    let answeredCount = 0;
    let correctCount = 0;

    s.questions.forEach(q => {
      if (s.userAnswers[q.id] !== undefined) {
        answeredCount++;
        if (s.userAnswers[q.id] === q.answer) correctCount++;
      }
    });

    const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    const accPct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    progEl.innerHTML = `
      <div class="progress-meta-row">
        <span>📊 풀이 진행률: <strong style="color:var(--primary);">${answeredCount} / ${total}문항 (${pct}%)</strong></span>
        <span>${s.mode === 'practice' || s.isSubmitted ? `🎯 실시간 정답률: <strong style="color:var(--primary);">${accPct}%</strong>` : '⏱️ 실전 모의고사 진행 중'}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;"></div>
      </div>
    `;
  }

  function renderOmrGrid(type) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const gridEl = type === 'past' ? dom.pastOmrGrid : dom.appliedOmrGrid;

    gridEl.innerHTML = '';
    s.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'omr-num-btn';
      btn.textContent = idx + 1;

      if (idx === s.currentIndex) btn.classList.add('current');
      if (s.userAnswers[q.id] !== undefined) btn.classList.add('answered');
      if (sharedBookmarks.has(q.id)) btn.classList.add('bookmarked');

      if ((s.mode === 'practice' && s.userAnswers[q.id] !== undefined) || s.isSubmitted) {
        if (s.userAnswers[q.id] === q.answer) {
          btn.classList.add('correct');
        } else if (s.userAnswers[q.id] !== undefined) {
          btn.classList.add('incorrect');
        }
      }

      btn.addEventListener('click', () => {
        s.currentIndex = idx;
        if (s.isSubmitted) {
          const qContainer = type === 'past' ? dom.pastQuestionContainer : dom.appliedQuestionContainer;
          qContainer.style.display = 'block';
        }
        renderQuestionCard(type);
        renderOmrGrid(type);
      });
      gridEl.appendChild(btn);
    });
  }

  function toggleBookmark(type, questionId) {
    if (sharedBookmarks.has(questionId)) {
      sharedBookmarks.delete(questionId);
    } else {
      sharedBookmarks.add(questionId);
    }
    saveStoredBookmarks(sharedBookmarks);
    renderExamView(type);
  }

  function handleSelectOption(type, q, optIdx) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    if (s.isSubmitted) return;

    s.userAnswers[q.id] = optIdx;

    if (s.mode === 'practice') {
      if (optIdx !== q.answer) {
        addWrongQuestion(q, optIdx);
      } else if (s.isRetakeMode) {
        // 오답 재도전 모드에서 맞추면 오답노트에서 자동 마스터 제거
        removeWrongQuestion(q.id);
      }
    }

    renderExamView(type);
  }

  function renderQuestionCard(type) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const container = type === 'past' ? dom.pastQuestionContainer : dom.appliedQuestionContainer;
    const totalQ = s.questions.length;
    const q = s.questions[s.currentIndex];
    if (!q) return;

    const isBookmarked = sharedBookmarks.has(q.id);
    const selectedOption = s.userAnswers[q.id];
    const isAnswered = selectedOption !== undefined;
    const showExplanation = (s.mode === 'practice' && isAnswered) || s.isSubmitted;

    let appliedIndicatorHtml = '';
    if (q.changePoint) {
      appliedIndicatorHtml = `
        <div class="applied-indicator-box">
          <div><span class="label">🎯 원본 기출 개념:</span> ${escapeHtml(q.originalConcept || '')}</div>
          <div style="margin-top:4px;"><span class="label">⚡ 고난도 변형 포인트:</span> <strong>${escapeHtml(q.changePoint)}</strong></div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="question-card">
        <div class="question-header">
          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
            <span class="question-tag">${escapeHtml(q.subject)}</span>
            ${q.freq ? `<span class="freq-badge">🔥 ${escapeHtml(q.freq)}</span>` : ''}
            ${q.lawRef ? `<span class="law-ref-badge">📌 ${escapeHtml(q.lawRef)}</span>` : ''}
            <span style="font-weight:800; color:var(--text-muted); font-size:0.88rem;">문항 ${s.currentIndex + 1} / ${totalQ}</span>
          </div>
          <button class="bookmark-toggle-btn ${isBookmarked ? 'active' : ''}" id="btnBookmark" title="단축키 B">
            <span>${isBookmarked ? '★ 북마크됨' : '☆ 북마크'}</span>
          </button>
        </div>

        ${appliedIndicatorHtml}

        <div class="question-text">${s.currentIndex + 1}. ${escapeHtml(q.question)}</div>

        <div class="options-list" id="optionsList">
          ${q.options.map((opt, optIdx) => {
            let itemClass = 'option-item';
            if (selectedOption === optIdx) itemClass += ' selected';
            
            if (showExplanation) {
              if (optIdx === q.answer) {
                itemClass += ' correct-answer';
              } else if (selectedOption === optIdx && optIdx !== q.answer) {
                itemClass += ' wrong-answer';
              }
            }

            return `
              <div class="${itemClass}" data-opt-idx="${optIdx}">
                <div class="option-num">${optIdx + 1}</div>
                <div style="flex:1;">${escapeHtml(opt)}</div>
                ${showExplanation && optIdx === q.answer ? '<span style="color:var(--success); font-weight:800; flex-shrink:0;">✓ 정답</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${showExplanation ? `
          <div class="explanation-box">
            <div class="explanation-title">
              💡 ${selectedOption === q.answer
                ? '<span style="color:var(--success);">정답입니다! 완벽하게 이해하셨습니다.</span>'
                : '<span style="color:var(--danger);">오답입니다. (스마트 오답노트에 자동 등록되었습니다)</span>'}
              <span style="margin-left:auto; font-size:0.88rem;">정답: ${q.answer + 1}번</span>
            </div>
            <div style="white-space:pre-wrap;">${escapeHtml(q.explanation)}</div>
          </div>
        ` : ''}

        <div class="question-nav-actions" style="margin-top: 24px;">
          <button class="btn btn-secondary" id="btnPrev" ${s.currentIndex === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            ◀ 이전 문항
          </button>
          
          <div style="display:flex; gap:8px;">
            <button class="btn btn-success" id="btnSubmitNow">
              📊 채점 및 과락 분석 리포트
            </button>
            ${s.currentIndex < totalQ - 1 ? `
              <button class="btn btn-primary" id="btnNext">
                다음 문항 ▶
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // 북마크 토글
    container.querySelector('#btnBookmark').addEventListener('click', () => {
      toggleBookmark(type, q.id);
    });

    // 보기 선택
    container.querySelectorAll('.option-item').forEach(el => {
      el.addEventListener('click', () => {
        const optIdx = parseInt(el.dataset.optIdx, 10);
        handleSelectOption(type, q, optIdx);
      });
    });

    // 이전 문항
    const btnPrev = container.querySelector('#btnPrev');
    if (btnPrev && s.currentIndex > 0) {
      btnPrev.addEventListener('click', () => {
        s.currentIndex--;
        renderExamView(type);
      });
    }

    // 다음 문항
    const btnNext = container.querySelector('#btnNext');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (s.currentIndex < totalQ - 1) {
          s.currentIndex++;
          renderExamView(type);
        }
      });
    }

    // 채점 및 결과 리포트
    const btnSubmitNow = container.querySelector('#btnSubmitNow');
    if (btnSubmitNow) {
      btnSubmitNow.addEventListener('click', () => {
        const unanswered = s.questions.filter(item => s.userAnswers[item.id] === undefined).length;
        if (unanswered > 0) {
          if (!confirm(`아직 풀지 않은 문항이 ${unanswered}문항 있습니다.\n현재 상태로 채점 및 과락 분석을 진행하시겠습니까?`)) {
            return;
          }
        }
        submitExam(type);
      });
    }
  }

  function submitExam(type) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    if (type === 'past') stopPastTimer();

    s.isSubmitted = true;
    s.currentIndex = 0;

    // 채점 시 틀린 문항을 오답노트에 저장
    s.questions.forEach(q => {
      const userAns = s.userAnswers[q.id];
      if (userAns !== undefined && userAns !== q.answer) {
        addWrongQuestion(q, userAns);
      } else if (userAns === q.answer && s.isRetakeMode) {
        removeWrongQuestion(q.id);
      }
    });

    renderExamView(type);
  }

  // 실제 국가기술자격 합격 판정 (과목당 40점 과락 체크 + 전 과목 평균 60점 체크)
  function renderExamResult(type) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const container = type === 'past' ? dom.pastResultContainer : dom.appliedResultContainer;

    let correctCount = 0;
    const wrongQuestions = [];
    const subjectMap = {};

    s.questions.forEach(q => {
      const subName = q.subject;
      if (!subjectMap[subName]) {
        subjectMap[subName] = { total: 0, correct: 0 };
      }
      subjectMap[subName].total++;

      const userAns = s.userAnswers[q.id];
      if (userAns === q.answer) {
        correctCount++;
        subjectMap[subName].correct++;
      } else {
        wrongQuestions.push(q);
      }
    });

    const totalCount = s.questions.length;
    const avgScore = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // 과목별 과락(40점 미만) 여부 판정
    const failedSubjects = [];
    const subjectBreakdownHtml = Object.keys(subjectMap).map(subName => {
      const st = subjectMap[subName];
      const subScore = Math.round((st.correct / st.total) * 100);
      const isSubFail = subScore < 40;
      if (isSubFail) failedSubjects.push(subName);

      const barColor = isSubFail ? 'var(--danger)' : (subScore >= 60 ? 'var(--success)' : 'var(--warning)');
      return `
        <div class="breakdown-row">
          <div class="breakdown-header">
            <span>${escapeHtml(subName)} (${st.correct}/${st.total}문항)</span>
            <span style="color:${barColor};">${subScore}점 ${isSubFail ? '⚠️ [과락 - 40점 미만]' : '✅ [통과]'}</span>
          </div>
          <div class="breakdown-bar-bg">
            <div class="breakdown-bar-fill" style="width:${subScore}%; background-color:${barColor};"></div>
          </div>
        </div>
      `;
    }).join('');

    const isAvgPass = avgScore >= 60;
    const isFinalPass = isAvgPass && failedSubjects.length === 0;

    let statusMessage = '';
    if (isFinalPass) {
      statusMessage = '축하합니다! 전 과목 40점 이상(과락 없음) 및 총 평균 60점 이상으로 최종 합격 기준을 통과했습니다!';
    } else if (isAvgPass && failedSubjects.length > 0) {
      statusMessage = `평균 점수는 ${avgScore}점으로 60점을 넘었으나, [${failedSubjects.join(', ')}] 과목이 40점 미만 과락이어서 불합격 판정되었습니다.`;
    } else {
      statusMessage = `총 평균 ${avgScore}점으로 합격 기준(60점)에 미달하였습니다. 스마트 오답노트에서 취약 과목을 복습하세요!`;
    }

    container.innerHTML = `
      <div class="card result-card">
        <div class="result-badge ${isFinalPass ? 'pass' : 'fail'}">
          ${isFinalPass ? '🎉 산업안전산업기사 합격 기준 통과!' : (isAvgPass ? '⚠️ 과목 과락(40점 미만) 불합격' : '⚠️ 평균 점수 미달 불합격')}
        </div>
        <div class="result-score">
          ${avgScore}<span> / 100점</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem; max-width:640px; margin:0 auto;">
          ${escapeHtml(statusMessage)}
        </p>

        <div class="result-stats-grid">
          <div class="stat-item">
            <div class="stat-value" style="color:var(--primary);">${totalCount}문항</div>
            <div class="stat-label">응시 문항 수</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--success);">${correctCount}문항</div>
            <div class="stat-label">정답 문항</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--danger);">${wrongQuestions.length}문항</div>
            <div class="stat-label">오답 (오답노트 자동저장)</div>
          </div>
        </div>

        <!-- 과목별 득점 및 과락 정밀 분석 차트 -->
        <div class="subject-breakdown-box">
          <h4 style="font-size:1rem; font-weight:800; margin-bottom:14px; color:var(--text-main);">
            📊 과목별 득점 및 과락(40점 기준) 정밀 분석
          </h4>
          ${subjectBreakdownHtml}
        </div>

        <div style="display:flex; justify-content:center; gap:12px; margin-top:24px; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnReviewAll">📖 문항별 상세 해설 보기</button>
          <button class="btn btn-secondary" id="btnGoToWrongNotes">🚨 스마트 오답노트로 이동</button>
          <button class="btn btn-secondary" id="btnRestart">🔄 새로 다시 풀기</button>
        </div>
      </div>
    `;

    container.querySelector('#btnReviewAll').addEventListener('click', () => {
      const qContainer = type === 'past' ? dom.pastQuestionContainer : dom.appliedQuestionContainer;
      qContainer.style.display = 'block';
      renderQuestionCard(type);
      qContainer.scrollIntoView({ behavior: 'smooth' });
    });

    container.querySelector('#btnGoToWrongNotes').addEventListener('click', () => {
      switchMainMenu('wrongNotes');
    });

    container.querySelector('#btnRestart').addEventListener('click', () => {
      s.userAnswers = {};
      s.currentIndex = 0;
      s.isSubmitted = false;
      if (type === 'past' && s.mode === 'mock') {
        startPastTimer();
      }
      renderExamView(type);
    });
  }

  // ============================================================
  // 3. 스마트 오답노트 메뉴 (과목별 필터, 오답 횟수, 해설 가리기)
  // ============================================================
  function renderWrongNotes() {
    const allList = getStoredWrongNotes();
    updateWrongBadge();

    // 과목별 통계 산출
    const subjectStats = {};
    allList.forEach(item => {
      const subId = item.subjectId || 'sub1';
      if (!subjectStats[subId]) {
        subjectStats[subId] = { name: item.subject, count: 0 };
      }
      subjectStats[subId].count++;
    });

    const currentFilter = state.wrongNotes.subjectFilter;
    const filteredList = currentFilter === 'all'
      ? allList
      : allList.filter(item => (item.subjectId || 'sub1') === currentFilter);

    // 과목 필터 칩스 렌더링
    dom.wrongStatsBar.innerHTML = `
      <button class="wrong-stat-chip ${currentFilter === 'all' ? 'active' : ''}" data-w-filter="all">
        전체 오답 (${allList.length})
      </button>
      ${Object.keys(subjectStats).map(subId => `
        <button class="wrong-stat-chip ${currentFilter === subId ? 'active' : ''}" data-w-filter="${subId}">
          ${escapeHtml(subjectStats[subId].name)} (${subjectStats[subId].count})
        </button>
      `).join('')}
    `;

    dom.wrongStatsBar.querySelectorAll('.wrong-stat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.wrongNotes.subjectFilter = chip.dataset.wFilter;
        renderWrongNotes();
      });
    });

    if (allList.length === 0) {
      dom.wrongNotesListContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">🎉</div>
          <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">현재 저장된 오답이 없습니다!</h3>
          <p style="font-size:0.9rem;">기출문제(50선)나 기출변형 응용문제(25선)를 풀며 틀린 문제가 발생하면 이곳에 자동으로 기록됩니다.</p>
          <div style="display:flex; justify-content:center; gap:10px; margin-top:16px;">
            <button class="btn btn-primary" id="btnEmptyGoPast">📝 기출문제 50선 풀기</button>
            <button class="btn btn-secondary" id="btnEmptyGoApplied">💡 기출변형 25선 풀기</button>
          </div>
        </div>
      `;
      dom.btnRetakeWrongQuestions.style.display = 'none';
      dom.btnToggleAllWrongExplanations.style.display = 'none';
      dom.btnClearAllWrongNotes.style.display = 'none';

      const goPast = dom.wrongNotesListContainer.querySelector('#btnEmptyGoPast');
      const goApplied = dom.wrongNotesListContainer.querySelector('#btnEmptyGoApplied');
      if (goPast) goPast.addEventListener('click', () => switchMainMenu('past'));
      if (goApplied) goApplied.addEventListener('click', () => switchMainMenu('applied'));
      return;
    }

    dom.btnRetakeWrongQuestions.style.display = 'inline-flex';
    dom.btnToggleAllWrongExplanations.style.display = 'inline-flex';
    dom.btnClearAllWrongNotes.style.display = 'inline-flex';

    // 누적 오답 횟수가 많은 순으로 정렬
    const sortedList = [...filteredList].sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1));

    dom.wrongNotesListContainer.innerHTML = sortedList.map((item, idx) => `
      <div class="wrong-card">
        <div class="wrong-card-header">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="question-tag">${escapeHtml(item.subject)}</span>
            <span class="wrong-count-pill">🔥 누적 ${item.wrongCount || 1}회 틀림</span>
            ${item.lawRef ? `<span class="law-ref-badge">📌 ${escapeHtml(item.lawRef)}</span>` : ''}
          </div>
          <button class="btn-remove-wrong" data-remove-id="${item.id}">
            ✓ 암기 완료 (마스터 삭제)
          </button>
        </div>

        <div style="font-size:1.06rem; font-weight:700; margin-bottom:14px; line-height:1.6;">
          ${idx + 1}. ${escapeHtml(item.question)}
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:14px;">
          ${item.options.map((opt, oIdx) => {
            const isCorrect = oIdx === item.answer;
            const isUserWrong = oIdx === item.userAnswer && !isCorrect;
            let bg = 'var(--bg-main)';
            let border = 'var(--border)';
            let color = 'var(--text-main)';

            if (!state.wrongNotes.hideExplanations) {
              if (isCorrect) {
                bg = 'var(--success-bg)';
                border = 'var(--success)';
                color = 'var(--success)';
              } else if (isUserWrong) {
                bg = 'var(--danger-bg)';
                border = 'var(--danger)';
                color = 'var(--danger)';
              }
            }

            return `
              <div style="padding:10px 14px; border-radius:var(--radius-sm); border:1px solid ${border}; background:${bg}; color:${color}; font-size:0.92rem; font-weight:${isCorrect && !state.wrongNotes.hideExplanations ? '800' : '500'};">
                ${oIdx + 1}) ${escapeHtml(opt)}
                ${!state.wrongNotes.hideExplanations && isCorrect ? ' <strong>[✓ 정답]</strong>' : ''}
                ${!state.wrongNotes.hideExplanations && isUserWrong ? ' <strong>[❌ 내가 고른 오답]</strong>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${state.wrongNotes.hideExplanations ? `
          <div style="text-align:center; padding:10px; background:var(--bg-main); border-radius:var(--radius-sm); font-size:0.88rem; color:var(--text-muted);">
            🔒 정답과 해설이 가려져 있습니다. 상단의 [정답/해설 모두 보기]를 눌러 확인하세요.
          </div>
        ` : `
          <div class="explanation-box" style="margin-top:8px;">
            <div class="explanation-title">💡 초정밀 해설 & 암기 포인트 (정답: ${item.answer + 1}번)</div>
            <div style="white-space:pre-wrap;">${escapeHtml(item.explanation)}</div>
          </div>
        `}
      </div>
    `).join('');

    // 개별 마스터 삭제 이벤트
    dom.wrongNotesListContainer.querySelectorAll('.btn-remove-wrong').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.removeId, 10);
        removeWrongQuestion(id);
      });
    });
  }

  // 오답만 모아서 재도전 시험 모드 시작
  function startRetakeWrongExam() {
    const list = getStoredWrongNotes();
    if (list.length === 0) {
      alert('오답노트에 저장된 문제가 없습니다.');
      return;
    }

    stopPastTimer();
    state.pastExam.mode = 'practice';
    state.pastExam.isRetakeMode = true;
    state.pastExam.questions = [...list];
    state.pastExam.currentIndex = 0;
    state.pastExam.userAnswers = {};
    state.pastExam.isSubmitted = false;

    switchMainMenu('past');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  initApp();
})();
