/**
 * 산업안전산업기사 마스터 웹앱 메인 엔진
 * 순수 Vanilla JS (외부 라이브러리 0, 높은 하위 호환성)
 */

(function () {
  'use strict';

  // 1. 상태 객체
  const state = {
    currentMenu: 'info',
    theme: localStorage.getItem('app_theme') || 'light',

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
    }
  };

  // 2. DOM 요소
  const dom = {
    pwaNoticeBanner: document.getElementById('pwaNoticeBanner'),
    closeNoticeBtn: document.getElementById('closeNoticeBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    navTabBtns: document.querySelectorAll('.nav-tab-btn'),
    sections: {
      info: document.getElementById('menu-info'),
      past: document.getElementById('menu-past'),
      applied: document.getElementById('menu-applied')
    },
    // 기본정보
    subTabBtns: document.querySelectorAll('.sub-tab-btn'),
    infoCertTitle: document.getElementById('infoCertTitle'),
    infoCertSub: document.getElementById('infoCertSub'),
    infoCertOverview: document.getElementById('infoCertOverview'),
    infoCertCareer: document.getElementById('infoCertCareer'),
    infoCertFee: document.getElementById('infoCertFee'),
    infoScheduleTableBody: document.getElementById('infoScheduleTableBody'),
    eligibilityOptions: document.getElementById('eligibilityOptions'),
    eligibilityResultBox: document.getElementById('eligibilityResultBox'),
    infoCriteriaContainer: document.getElementById('infoCriteriaContainer'),
    infoSummaryContainer: document.getElementById('infoSummaryContainer'),
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
    appliedResultContainer: document.getElementById('appliedResultContainer')
  };

  // 초기화
  function initApp() {
    initTheme();
    initPwa();
    bindEventListeners();
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
    // PWA 공지 닫기
    dom.closeNoticeBtn.addEventListener('click', () => {
      dom.pwaNoticeBanner.style.display = 'none';
    });

    // 다크모드
    dom.themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem('app_theme', state.theme);
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

    // 기출문제 모드 전환 (연습 vs 실전 모의고사)
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
  }

  function switchMainMenu(target) {
    state.currentMenu = target;
    dom.navTabBtns.forEach(b => b.classList.toggle('active', b.dataset.target === target));
    Object.keys(dom.sections).forEach(k => dom.sections[k].classList.toggle('active', k === target));

    if (target === 'past') renderPastExam();
    else if (target === 'applied') renderAppliedExam();
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
    renderPastExam();
    renderAppliedExam();
  }

  // ============================================================
  // 1. 기본정보 메뉴
  // ============================================================
  function renderInfo() {
    const info = APP_DATA.info;
    if (!info) return;

    dom.infoCertTitle.textContent = `${info.name} 자격 개요 및 검정 안내`;
    dom.infoCertSub.textContent = `${info.category} | 시행: ${info.agency} | 영문: ${info.engName}`;
    dom.infoCertOverview.textContent = info.overview;
    dom.infoCertCareer.textContent = info.careerProspect;
    dom.infoCertFee.textContent = info.examFee;

    // 일정
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
          <div>선택하신 <strong>'${el.type}'</strong> 전형은 Q-Net 서류 제출 기간에 관련 서류(졸업증명서, 경력증명서, 학점인정증명서 등)를 등록하시면 필기시험 합격이 유효 인정됩니다.</div>
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

    // 핵심 공식 아코디언
    dom.infoSummaryContainer.innerHTML = '';
    info.summaries.forEach((sum, idx) => {
      const item = document.createElement('div');
      item.className = 'summary-item';
      item.innerHTML = `
        <div class="summary-header">
          <span>${sum.subject}</span>
          <span>▼</span>
        </div>
        <div class="summary-body" style="${idx === 0 ? 'display:block;' : 'display:none;'}">
          <ul style="padding-left:18px; display:flex; flex-direction:column; gap:8px;">
            ${sum.points.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `;
      const header = item.querySelector('.summary-header');
      const body = item.querySelector('.summary-body');
      header.addEventListener('click', () => {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';
        header.querySelector('span:last-child').textContent = isHidden ? '▲' : '▼';
      });
      dom.infoSummaryContainer.appendChild(item);
    });
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
    const exam = type === 'past' ? APP_DATA.pastExams[0] : APP_DATA.appliedExams[0];
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const gridEl = type === 'past' ? dom.pastOmrGrid : dom.appliedOmrGrid;

    gridEl.innerHTML = '';
    exam.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'omr-num-btn';
      btn.textContent = idx + 1;

      if (idx === s.currentIndex) btn.classList.add('current');
      if (s.userAnswers[q.id] !== undefined) btn.classList.add('answered');
      if (s.bookmarks.has(q.id)) btn.classList.add('bookmarked');

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
    const exam = type === 'past' ? APP_DATA.pastExams[0] : APP_DATA.appliedExams[0];
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const container = type === 'past' ? dom.pastQuestionContainer : dom.appliedQuestionContainer;
    const totalQ = exam.questions.length;
    const q = exam.questions[s.currentIndex];

    if (!q) return;

    const isBookmarked = s.bookmarks.has(q.id);
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
              💡 ${selectedOption === q.answer ? '<span style="color:var(--success);">정답입니다!</span>' : '<span style="color:var(--danger);">오답입니다.</span>'} 정답: ${q.answer + 1}번
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

    // 보기 선택
    container.querySelectorAll('.option-item').forEach(el => {
      el.addEventListener('click', () => {
        if (s.isSubmitted) return;
        const optIdx = parseInt(el.dataset.optIdx, 10);
        s.userAnswers[q.id] = optIdx;
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
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    if (type === 'past') stopPastTimer();
    s.isSubmitted = true;
    s.currentIndex = 0;
    if (type === 'past') renderPastExam();
    else renderAppliedExam();
  }

  function renderExamResult(type) {
    const exam = type === 'past' ? APP_DATA.pastExams[0] : APP_DATA.appliedExams[0];
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const container = type === 'past' ? dom.pastResultContainer : dom.appliedResultContainer;

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
          ${isPassed ? '🎉 산업안전 합격 기준 통과!' : '⚠️ 기준 미달 (과락 주의)'}
        </div>
        <div class="result-score">
          ${score}<span> / 100점</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">
          ${isPassed ? '축하합니다! 합격 기준인 60점을 달성하였습니다.' : '합격선(60점)에 미달하였습니다. 오답 노트와 핵심 공식을 반드시 복습하세요!'}
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
            <div class="stat-label">오답 문항</div>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:12px; margin-top:20px; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnReviewAll">전체 문항 해설 보기</button>
          <button class="btn btn-secondary" id="btnRestart">새로 다시 풀기</button>
        </div>
      </div>

      ${wrongQuestions.length > 0 ? `
        <div class="card" style="margin-top:20px;">
          <h3 class="card-title" style="color:var(--danger);">🚨 산업안전 오답 집중 복습 (${wrongQuestions.length}문항)</h3>
          <p class="card-subtitle">틀린 문항의 기출 개념과 공식을 다시 점검하십시오.</p>
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${wrongQuestions.map((wq, wIdx) => `
              <div class="wrong-answer-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span class="question-tag">${wq.subject}</span>
                  <span style="font-size:0.85rem; color:var(--danger); font-weight:700;">내 답: ${s.userAnswers[wq.id] !== undefined ? s.userAnswers[wq.id] + 1 : '미응답'}번 | 정답: ${wq.answer + 1}번</span>
                </div>
                <div style="font-weight:700; margin-bottom:10px;">${wIdx + 1}. ${escapeHtml(wq.question)}</div>
                <div class="explanation-box" style="margin-top:0;">
                  <div class="explanation-title">💡 상세 해설:</div>
                  <div style="white-space:pre-wrap;">${escapeHtml(wq.explanation)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
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
