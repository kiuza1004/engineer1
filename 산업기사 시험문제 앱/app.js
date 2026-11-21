/**
 * 산업안전산업기사 마스터 웹앱 메인 엔진
 * 순수 Vanilla JS (외부 프레임워크 종속성 0, 높은 하위 호환성)
 */

(function () {
  'use strict';

  const STORAGE_KEY_WRONG_NOTES = 'industrial_safety_wrong_notes';
  const STORAGE_KEY_THEME = 'industrial_safety_theme';

  // 1. 상태 관리
  const state = {
    currentMenu: 'info', // 'info' | 'past' | 'applied' | 'wrongNotes'
    currentSummarySubId: 'sub1', // 'sub1' ~ 'sub5'
    theme: localStorage.getItem(STORAGE_KEY_THEME) || 'light',

    pastExam: {
      mode: 'practice', // 'practice' | 'mock'
      currentIndex: 0,
      userAnswers: {},
      bookmarks: new Set(),
      isSubmitted: false,
      timerSeconds: 25 * 60,
      timerInterval: null
    },

    appliedExam: {
      mode: 'practice',
      currentIndex: 0,
      userAnswers: {},
      bookmarks: new Set(),
      isSubmitted: false
    },

    // 오답노트 전용 재도전 시험 상태
    retakeExam: {
      active: false,
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      bookmarks: new Set(),
      isSubmitted: false
    }
  };

  // 2. DOM 요소
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
    togglePastModeBtn: document.getElementById('togglePastModeBtn'),
    pastOmrGrid: document.getElementById('pastOmrGrid'),
    pastQuestionContainer: document.getElementById('pastQuestionContainer'),
    pastResultContainer: document.getElementById('pastResultContainer'),
    // 응용문제
    appliedTitle: document.getElementById('appliedTitle'),
    appliedOmrGrid: document.getElementById('appliedOmrGrid'),
    appliedQuestionContainer: document.getElementById('appliedQuestionContainer'),
    appliedResultContainer: document.getElementById('appliedResultContainer'),
    // 오답노트
    wrongStatsBar: document.getElementById('wrongStatsBar'),
    wrongNotesListContainer: document.getElementById('wrongNotesListContainer'),
    btnRetakeWrongQuestions: document.getElementById('btnRetakeWrongQuestions'),
    btnClearAllWrongNotes: document.getElementById('btnClearAllWrongNotes')
  };

  // 3. 오답노트 로컬스토리지 관리
  function getStoredWrongNotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_WRONG_NOTES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('오답노트 읽기 오류:', e);
      return [];
    }
  }

  function saveStoredWrongNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEY_WRONG_NOTES, JSON.stringify(notes));
      updateWrongBadge();
    } catch (e) {
      console.error('오답노트 저장 오류:', e);
    }
  }

  function addWrongQuestion(questionObj, userAnswer) {
    const list = getStoredWrongNotes();
    const existingIndex = list.findIndex(item => item.id === questionObj.id);
    const itemData = {
      id: questionObj.id,
      subject: questionObj.subject,
      question: questionObj.question,
      options: questionObj.options,
      answer: questionObj.answer,
      explanation: questionObj.explanation,
      userAnswer: userAnswer,
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
    list = list.filter(item => item.id !== questionId);
    saveStoredWrongNotes(list);
    renderWrongNotes();
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

  // 4. 초기화 함수
  function initApp() {
    initTheme();
    initPwa();
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

  // 이벤트 바인딩
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
        switchMainMenu(btn.dataset.target);
      });
    });

    // 기본정보 서브탭 전환
    dom.subTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchInfoSubTab(btn.dataset.sub);
      });
    });

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

    // 기출문제 모드 전환 버튼
    dom.togglePastModeBtn.addEventListener('click', () => {
      if (state.pastExam.mode === 'practice') {
        if (confirm('실전 CBT 모의고사 모드로 전환하시겠습니까?\n25분 제한시간 타이머가 시작되며, 최종 제출 시 채점 결과가 공개됩니다.')) {
          state.pastExam.mode = 'mock';
          startPastTimer();
        }
      } else {
        if (confirm('연습 모드로 전환하시겠습니까?\n타이머가 멈추고 문제 풀이 시 정답과 해설이 즉시 공개됩니다.')) {
          state.pastExam.mode = 'practice';
          stopPastTimer();
        }
      }
      resetExamState('past', false);
      renderPastExam();
    });

    // 오답노트 전체 비우기
    dom.btnClearAllWrongNotes.addEventListener('click', clearAllWrongNotes);

    // 오답노트 재도전 풀기
    dom.btnRetakeWrongQuestions.addEventListener('click', () => {
      startRetakeWrongExam();
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
  // 1. 기본정보 및 과목별 기출 핵심요약노트 렌더링
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
        <td style="font-weight:700; color:var(--primary);">${sch.round}</td>
        <td>${sch.apply}</td>
        <td><strong>${sch.exam}</strong></td>
        <td>${sch.result}</td>
      `;
      dom.infoScheduleTableBody.appendChild(tr);
    });

    // 응시자격
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
          <div style="color:var(--success); margin-bottom:4px;">✅ <strong>[응시 자격 충족 가능]</strong></div>
          <div>선택하신 <strong>'${el.type}'</strong> 전형은 Q-Net 서류 심사 시 관련 서류를 제출하시면 필기 응시 자격이 부여됩니다.</div>
        `;
      });
      dom.eligibilityOptions.appendChild(label);
    });

    // 5과목 체계 및 합격기준
    const ws = info.examStructure.written;
    const ps = info.examStructure.practical;
    dom.infoCriteriaContainer.innerHTML = `
      <div style="background-color:var(--bg-main); padding:16px; border-radius:var(--radius-sm); border-left:4px solid var(--primary);">
        <h4 style="font-size:1.05rem; margin-bottom:6px; color:var(--primary);">${ws.title}</h4>
        <ul style="padding-left:18px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
          <li><strong>문항 수 및 시간:</strong> ${ws.questions} (${ws.duration})</li>
          <li><strong>합격 기준:</strong> <span style="color:var(--danger); font-weight:800;">${ws.passStandard}</span></li>
        </ul>
        <div style="margin-top:12px;">
          <strong>출제 5개 과목 구성:</strong>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            ${ws.subjects.map(s => `
              <div style="background:var(--bg-card); padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:0.88rem;">
                <strong>${s.name}</strong> (${s.questions}문항) - <span style="color:var(--text-muted);">${s.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="background-color:var(--bg-main); padding:16px; border-radius:var(--radius-sm); border-left:4px solid var(--warning);">
        <h4 style="font-size:1.05rem; margin-bottom:6px; color:var(--warning);">${ps.title}</h4>
        <ul style="padding-left:18px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
          <li><strong>검정 방식:</strong> ${ps.method}</li>
          <li><strong>합격 기준:</strong> <span style="color:var(--success); font-weight:800;">${ps.passStandard}</span></li>
        </ul>
      </div>
    `;
  }

  // 과목별 세부 요약집 렌더링
  function renderDetailedSummary() {
    const info = APP_DATA.info;
    if (!info || !info.detailedSummaries) return;

    const currentSub = info.detailedSummaries.find(s => s.subjectId === state.currentSummarySubId) || info.detailedSummaries[0];
    if (!currentSub) return;

    dom.detailedSummaryContainer.innerHTML = `
      <div style="margin-bottom:12px;">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--primary); display:flex; align-items:center; gap:6px;">
          <span>📌</span> ${currentSub.subjectName}
        </h3>
      </div>
      <div style="display:flex; flex-direction:column; gap:14px;">
        ${currentSub.sections.map(sec => `
          <div class="summary-section-box">
            <div class="summary-section-title">
              <span>🎯</span> ${sec.title}
            </div>
            <div class="summary-section-body">${escapeHtml(sec.content)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ============================================================
  // 2. 기출문제 메뉴
  // ============================================================
  function resetExamState(type, clearAnswers = true) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    s.currentIndex = 0;
    s.isSubmitted = false;
    if (clearAnswers) {
      s.userAnswers = {};
      s.bookmarks.clear();
    }
    if (type === 'past') {
      stopPastTimer();
      s.timerSeconds = 25 * 60;
    }
  }

  function startPastTimer() {
    stopPastTimer();
    state.pastExam.timerSeconds = 25 * 60;
    dom.pastTimerBox.style.display = 'flex';
    updatePastTimer();

    state.pastExam.timerInterval = setInterval(() => {
      state.pastExam.timerSeconds--;
      updatePastTimer();
      if (state.pastExam.timerSeconds <= 0) {
        stopPastTimer();
        alert('시험 시간이 종료되었습니다! 작성된 답안을 자동 제출합니다.');
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
    const exam = APP_DATA.pastExams[0];
    if (!exam) return;

    dom.pastRoundTitle.textContent = exam.title;
    dom.pastModeBadge.textContent = state.pastExam.mode === 'practice' ? '연습 모드 (즉시해설)' : '실전 모의고사 (타이머)';
    dom.pastModeBadge.style.backgroundColor = state.pastExam.mode === 'practice' ? 'var(--primary)' : 'var(--danger)';
    dom.togglePastModeBtn.textContent = state.pastExam.mode === 'practice' ? '실전 모의고사 모드로 전환' : '연습 모드로 전환';

    if (state.pastExam.isSubmitted) {
      dom.pastQuestionContainer.style.display = 'none';
      dom.pastResultContainer.style.display = 'block';
      renderExamResult('past');
    } else {
      dom.pastQuestionContainer.style.display = 'block';
      dom.pastResultContainer.style.display = 'none';
      renderQuestionCard('past');
      renderOmrGrid('past');
    }
  }

  function renderOmrGrid(type) {
    const exam = type === 'past' ? APP_DATA.pastExams[0] : (type === 'applied' ? APP_DATA.appliedExams[0] : state.retakeExam);
    const s = type === 'past' ? state.pastExam : (type === 'applied' ? state.appliedExam : state.retakeExam);
    const gridEl = type === 'past' ? dom.pastOmrGrid : dom.appliedOmrGrid;

    gridEl.innerHTML = '';
    exam.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'omr-num-btn';
      btn.textContent = idx + 1;

      if (idx === s.currentIndex) btn.classList.add('current');
      if (s.userAnswers[q.id] !== undefined) btn.classList.add('answered');
      if (s.bookmarks && s.bookmarks.has(q.id)) btn.classList.add('bookmarked');

      if (s.isSubmitted) {
        if (s.userAnswers[q.id] === q.answer) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
        }
      }

      btn.addEventListener('click', () => {
        s.currentIndex = idx;
        renderQuestionCard(type);
        renderOmrGrid(type);
      });
      gridEl.appendChild(btn);
    });
  }

  function renderQuestionCard(type) {
    const exam = type === 'past' ? APP_DATA.pastExams[0] : (type === 'applied' ? APP_DATA.appliedExams[0] : state.retakeExam);
    const s = type === 'past' ? state.pastExam : (type === 'applied' ? state.appliedExam : state.retakeExam);
    const container = type === 'past' ? dom.pastQuestionContainer : (type === 'applied' ? dom.appliedQuestionContainer : dom.pastQuestionContainer);
    const totalQ = exam.questions.length;
    const q = exam.questions[s.currentIndex];

    if (!q) return;

    const isBookmarked = s.bookmarks && s.bookmarks.has(q.id);
    const selectedOption = s.userAnswers[q.id];
    const isAnswered = selectedOption !== undefined;
    const showExplanation = (s.mode === 'practice' && isAnswered) || s.isSubmitted;

    let appliedIndicatorHtml = '';
    if (type === 'applied' && q.changePoint) {
      appliedIndicatorHtml = `
        <div class="applied-indicator-box">
          <div><span class="label">🎯 원본 기출 개념:</span> ${q.originalConcept || ''}</div>
          <div style="margin-top:4px;"><span class="label">⚡ 변형 포인트:</span> <strong>${q.changePoint}</strong></div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="question-card">
        <div class="question-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="question-tag">${q.subject}</span>
            <span style="font-weight:700; color:var(--text-muted); font-size:0.9rem;">문항 ${s.currentIndex + 1} / ${totalQ}</span>
          </div>
          <button class="bookmark-toggle-btn ${isBookmarked ? 'active' : ''}" id="btnBookmark" title="문제 보관">
            ${isBookmarked ? '★' : '☆'}
          </button>
        </div>

        ${appliedIndicatorHtml}

        <div class="question-text">${escapeHtml(q.question)}</div>

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
                ${showExplanation && optIdx === q.answer ? '<span style="color:var(--success); font-weight:800;">✓ 정답</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${showExplanation ? `
          <div class="explanation-box">
            <div class="explanation-title">
              💡 ${selectedOption === q.answer ? '<span style="color:var(--success);">정답입니다!</span>' : '<span style="color:var(--danger);">오답입니다. (오답노트에 자동 저장됨)</span>'} 정답: ${q.answer + 1}번
            </div>
            <div style="white-space:pre-wrap;">${escapeHtml(q.explanation)}</div>
          </div>
        ` : ''}

        <div class="question-nav-actions" style="margin-top: 24px;">
          <button class="btn btn-secondary" id="btnPrev" ${s.currentIndex === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            ◀ 이전 문항
          </button>
          
          <div style="display:flex; gap:8px;">
            ${s.currentIndex === totalQ - 1 ? `
              <button class="btn btn-success" id="btnSubmit">
                시험 완료 및 제출 (채점)
              </button>
            ` : `
              <button class="btn btn-primary" id="btnNext">
                다음 문항 ▶
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    // 북마크
    container.querySelector('#btnBookmark').addEventListener('click', () => {
      if (s.bookmarks.has(q.id)) s.bookmarks.delete(q.id);
      else s.bookmarks.add(q.id);
      renderQuestionCard(type);
      renderOmrGrid(type);
    });

    // 보기 클릭
    container.querySelectorAll('.option-item').forEach(el => {
      el.addEventListener('click', () => {
        if (s.isSubmitted) return;
        const optIdx = parseInt(el.dataset.optIdx, 10);
        s.userAnswers[q.id] = optIdx;

        // 연습모드에서 틀린 경우 오답노트에 실시간 저장
        if (s.mode === 'practice') {
          if (optIdx !== q.answer) {
            addWrongQuestion(q, optIdx);
          } else {
            // 맞추었으면 오답노트에서 자동 제거 (재도전 시 마스터 처리)
            removeWrongQuestion(q.id);
          }
        }

        renderQuestionCard(type);
        renderOmrGrid(type);
      });
    });

    // 이전
    const btnPrev = container.querySelector('#btnPrev');
    if (btnPrev && s.currentIndex > 0) {
      btnPrev.addEventListener('click', () => {
        s.currentIndex--;
        renderQuestionCard(type);
        renderOmrGrid(type);
      });
    }

    // 다음
    const btnNext = container.querySelector('#btnNext');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (s.currentIndex < totalQ - 1) {
          s.currentIndex++;
          renderQuestionCard(type);
          renderOmrGrid(type);
        }
      });
    }

    // 제출
    const btnSubmit = container.querySelector('#btnSubmit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const unanswered = exam.questions.filter(item => s.userAnswers[item.id] === undefined).length;
        if (unanswered > 0) {
          if (!confirm(`아직 풀지 않은 문제가 ${unanswered}문항 있습니다.\n정말 제출하시겠습니까?`)) {
            return;
          }
        }
        submitExam(type);
      });
    }
  }

  function submitExam(type) {
    const exam = type === 'past' ? APP_DATA.pastExams[0] : (type === 'applied' ? APP_DATA.appliedExams[0] : state.retakeExam);
    const s = type === 'past' ? state.pastExam : (type === 'applied' ? state.appliedExam : state.retakeExam);

    if (type === 'past') stopPastTimer();
    s.isSubmitted = true;
    s.currentIndex = 0;

    // 틀린 문제들을 오답노트에 자동 등록
    exam.questions.forEach(q => {
      const userAns = s.userAnswers[q.id];
      if (userAns !== undefined && userAns !== q.answer) {
        addWrongQuestion(q, userAns);
      } else if (userAns === q.answer) {
        // 맞추면 오답노트 목록에서 삭제
        removeWrongQuestion(q.id);
      }
    });

    if (type === 'past') renderPastExam();
    else if (type === 'applied') renderAppliedExam();
    else renderExamResult('retake');
  }

  function renderExamResult(type) {
    const exam = type === 'past' ? APP_DATA.pastExams[0] : (type === 'applied' ? APP_DATA.appliedExams[0] : state.retakeExam);
    const s = type === 'past' ? state.pastExam : (type === 'applied' ? state.appliedExam : state.retakeExam);
    const container = type === 'past' ? dom.pastResultContainer : (type === 'applied' ? dom.appliedResultContainer : dom.pastResultContainer);

    let correctCount = 0;
    const wrongQuestions = [];

    exam.questions.forEach(q => {
      const userAns = s.userAnswers[q.id];
      if (userAns === q.answer) correctCount++;
      else wrongQuestions.push(q);
    });

    const totalCount = exam.questions.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const isPassed = score >= 60;

    container.innerHTML = `
      <div class="card result-card">
        <div class="result-badge ${isPassed ? 'pass' : 'fail'}">
          ${isPassed ? '🎉 산업안전 합격선 통과!' : '⚠️ 과락 및 기준 점수 미달'}
        </div>
        <div class="result-score">
          ${score}<span> / 100점</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">
          ${isPassed ? '축하합니다! 합격 기준인 60점을 달성하였습니다.' : '합격선(60점)에 미달하였습니다. 오답 노트로 이동하여 틀린 문제를 다시 복습하세요!'}
        </p>

        <div class="result-stats-grid">
          <div class="stat-item">
            <div class="stat-value" style="color:var(--primary);">${totalCount}</div>
            <div class="stat-label">총 문항 수</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--success);">${correctCount}</div>
            <div class="stat-label">정답 문항</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--danger);">${wrongQuestions.length}</div>
            <div class="stat-label">오답 문항 (노트 자동저장)</div>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:12px; margin-top:20px; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnReviewAll">전체 문항 해설 보기</button>
          <button class="btn btn-secondary" id="btnGoToWrongNotes">🚨 스마트 오답노트 확인</button>
          <button class="btn btn-secondary" id="btnRestart">새로 다시 풀기</button>
        </div>
      </div>
    `;

    container.querySelector('#btnReviewAll').addEventListener('click', () => {
      s.isSubmitted = true;
      s.currentIndex = 0;
      if (type === 'past') {
        dom.pastResultContainer.style.display = 'none';
        dom.pastQuestionContainer.style.display = 'block';
        renderQuestionCard('past');
        renderOmrGrid('past');
      } else {
        dom.appliedResultContainer.style.display = 'none';
        dom.appliedQuestionContainer.style.display = 'block';
        renderQuestionCard('applied');
        renderOmrGrid('applied');
      }
    });

    container.querySelector('#btnGoToWrongNotes').addEventListener('click', () => {
      switchMainMenu('wrongNotes');
    });

    container.querySelector('#btnRestart').addEventListener('click', () => {
      resetExamState(type, true);
      if (type === 'past') renderPastExam();
      else renderAppliedExam();
    });
  }

  // ============================================================
  // 3. 기출변형 응용문제 메뉴
  // ============================================================
  function renderAppliedExam() {
    const exam = APP_DATA.appliedExams[0];
    if (!exam) return;

    dom.appliedTitle.textContent = exam.title;

    if (state.appliedExam.isSubmitted) {
      dom.appliedQuestionContainer.style.display = 'none';
      dom.appliedResultContainer.style.display = 'block';
      renderExamResult('applied');
    } else {
      dom.appliedQuestionContainer.style.display = 'block';
      dom.appliedResultContainer.style.display = 'none';
      renderQuestionCard('applied');
      renderOmrGrid('applied');
    }
  }

  // ============================================================
  // 4. 스마트 오답노트 메뉴 (신규!)
  // ============================================================
  function renderWrongNotes() {
    const list = getStoredWrongNotes();
    updateWrongBadge();

    // 오답 통계 요약 칩
    const subjectStats = {};
    list.forEach(item => {
      subjectStats[item.subject] = (subjectStats[item.subject] || 0) + 1;
    });

    dom.wrongStatsBar.innerHTML = `
      <div class="wrong-stat-chip" style="background:var(--primary-light); color:var(--primary); font-weight:800;">
        총 오답: ${list.length}문항
      </div>
      ${Object.keys(subjectStats).map(sub => `
        <div class="wrong-stat-chip">
          ${sub}: <strong>${subjectStats[sub]}</strong>
        </div>
      `).join('')}
    `;

    // 오답 목록 렌더링
    if (list.length === 0) {
      dom.wrongNotesListContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">🎉</div>
          <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">저장된 오답이 없습니다!</h3>
          <p style="font-size:0.9rem;">기출문제나 응용문제를 풀면 틀린 문제가 여기에 자동으로 누적됩니다.</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="document.querySelector('[data-target=past]').click();">
            기출문제 풀러 가기 📝
          </button>
        </div>
      `;
      dom.btnRetakeWrongQuestions.style.display = 'none';
      dom.btnClearAllWrongNotes.style.display = 'none';
      return;
    }

    dom.btnRetakeWrongQuestions.style.display = 'inline-flex';
    dom.btnClearAllWrongNotes.style.display = 'inline-flex';

    dom.wrongNotesListContainer.innerHTML = list.map((item, idx) => `
      <div class="wrong-card">
        <div class="wrong-card-header">
          <span class="question-tag">${item.subject}</span>
          <button class="btn-remove-wrong" data-remove-id="${item.id}">
            ✓ 마스터 (삭제)
          </button>
        </div>

        <div style="font-size:1.05rem; font-weight:700; margin-bottom:14px; line-height:1.6;">
          ${idx + 1}. ${escapeHtml(item.question)}
        </div>

        <div style="font-size:0.88rem; color:var(--danger); font-weight:700; margin-bottom:10px;">
          • 내가 선택한 답: ${item.userAnswer !== undefined ? (item.userAnswer + 1) + '번' : '미응답'} ❌ 
          <span style="color:var(--success); margin-left:8px;">• 정답: ${(item.answer + 1)}번 ✅</span>
        </div>

        <div class="explanation-box" style="margin-top:8px;">
          <div class="explanation-title">💡 상세 해설 & 암기 포인트:</div>
          <div style="white-space:pre-wrap;">${escapeHtml(item.explanation)}</div>
        </div>
      </div>
    `).join('');

    // 개별 삭제 버튼 이벤트 바인딩
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
      alert('오답노트에 문제가 없습니다.');
      return;
    }

    state.retakeExam = {
      active: true,
      title: '오답노트 집중 재도전 모의고사',
      questions: [...list],
      currentIndex: 0,
      userAnswers: {},
      bookmarks: new Set(),
      mode: 'practice',
      isSubmitted: false
    };

    // 기출문제 탭을 재도전 모드로 스위칭
    state.pastExam.mode = 'practice';
    switchMainMenu('past');
    dom.pastRoundTitle.textContent = `🚨 오답 재도전 챌린지 (${list.length}문항)`;
    dom.pastQuestionContainer.style.display = 'block';
    dom.pastResultContainer.style.display = 'none';

    renderQuestionCard('retake');
    renderOmrGrid('retake');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  initApp();
})();
