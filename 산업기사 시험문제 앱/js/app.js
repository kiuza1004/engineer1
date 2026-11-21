/**
 * 산업기사 자격증 마스터 어플리케이션 메인 엔진
 * 순수 Vanilla JavaScript (외부 프레임워크 종속성 0, 높은 하위 호환성)
 */

(function () {
  'use strict';

  // 1. 상태 관리 객체 (State)
  const state = {
    currentCertId: 'info_tech', // 'info_tech' | 'safety_tech'
    currentMenu: 'info',       // 'info' | 'past' | 'applied'
    theme: localStorage.getItem('app_theme') || 'light',
    
    // 기출문제 시험 상태
    pastExam: {
      mode: 'practice', // 'practice' (즉시해설) | 'mock' (실전 모의고사)
      currentIndex: 0,
      userAnswers: {},  // { [questionId]: selectedOptionIndex }
      bookmarks: new Set(),
      isSubmitted: false,
      timerSeconds: 0,
      timerInterval: null,
      filterWrongOnly: false
    },

    // 응용문제 시험 상태
    appliedExam: {
      mode: 'practice',
      currentIndex: 0,
      userAnswers: {},
      bookmarks: new Set(),
      isSubmitted: false,
      filterWrongOnly: false
    }
  };

  // 2. DOM 요소 캐싱
  const dom = {
    pwaNoticeBanner: document.getElementById('pwaNoticeBanner'),
    closeNoticeBtn: document.getElementById('closeNoticeBtn'),
    certSelector: document.getElementById('certSelector'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    navTabBtns: document.querySelectorAll('.nav-tab-btn'),
    sections: {
      info: document.getElementById('menu-info'),
      past: document.getElementById('menu-past'),
      applied: document.getElementById('menu-applied')
    },
    // 기본 정보 DOM
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
    // 기출문제 DOM
    pastRoundTitle: document.getElementById('pastRoundTitle'),
    pastModeBadge: document.getElementById('pastModeBadge'),
    pastTimerBox: document.getElementById('pastTimerBox'),
    pastTimerDisplay: document.getElementById('pastTimerDisplay'),
    togglePastModeBtn: document.getElementById('togglePastModeBtn'),
    pastOmrGrid: document.getElementById('pastOmrGrid'),
    pastQuestionContainer: document.getElementById('pastQuestionContainer'),
    pastResultContainer: document.getElementById('pastResultContainer'),
    // 응용문제 DOM
    appliedTitle: document.getElementById('appliedTitle'),
    appliedOmrGrid: document.getElementById('appliedOmrGrid'),
    appliedQuestionContainer: document.getElementById('appliedQuestionContainer'),
    appliedResultContainer: document.getElementById('appliedResultContainer')
  };

  // 3. 초기화 함수
  function initApp() {
    initTheme();
    initPwa();
    populateCertSelector();
    bindEventListeners();
    renderAll();
  }

  // 테마 초기화
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeButtonText();
  }

  function updateThemeButtonText() {
    dom.themeToggleBtn.innerHTML = state.theme === 'dark' ? '☀️ 주간모드' : '🌙 야간모드';
  }

  // PWA Service Worker 등록
  function initPwa() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((reg) => {
            console.log('PWA ServiceWorker 등록 완료:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA ServiceWorker 등록 실패:', err);
          });
      });
    }
  }

  // 종목 선택기 옵션 채우기
  function populateCertSelector() {
    dom.certSelector.innerHTML = '';
    APP_DATA.info.qualifications.forEach(cert => {
      const option = document.createElement('option');
      option.value = cert.id;
      option.textContent = cert.name;
      if (cert.id === state.currentCertId) {
        option.selected = true;
      }
      dom.certSelector.appendChild(option);
    });
  }

  // 이벤트 리스너 바인딩
  function bindEventListeners() {
    // PWA 안내 배너 닫기
    dom.closeNoticeBtn.addEventListener('click', () => {
      dom.pwaNoticeBanner.style.display = 'none';
    });

    // 테마 토글
    dom.themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem('app_theme', state.theme);
      updateThemeButtonText();
    });

    // 자격증 종목 변경
    dom.certSelector.addEventListener('change', (e) => {
      state.currentCertId = e.target.value;
      // 시험 상태 리셋
      resetExamState('past');
      resetExamState('applied');
      renderAll();
    });

    // 메인 3대 메뉴 탭 전환
    dom.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        switchMainMenu(target);
      });
    });

    // 기본정보 서브 탭 전환
    dom.subTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = btn.dataset.sub;
        switchInfoSubTab(sub);
      });
    });

    // 기출문제 모드 전환 버튼 (연습 vs 실전)
    dom.togglePastModeBtn.addEventListener('click', () => {
      if (state.pastExam.mode === 'practice') {
        if (confirm('실전 CBT 모의고사 모드로 전환하시겠습니까?\n제한시간 타이머가 시작되며, 채점 결과는 모든 문제를 풀고 제출할 때 공개됩니다.')) {
          state.pastExam.mode = 'mock';
          startPastTimer();
        }
      } else {
        if (confirm('연습 모드로 전환하시겠습니까?\n타이머가 멈추고 문제 풀이 시 정답과 해설이 즉시 표시됩니다.')) {
          state.pastExam.mode = 'practice';
          stopPastTimer();
        }
      }
      resetExamState('past', false);
      renderPastExam();
    });
  }

  // 메인 메뉴 전환
  function switchMainMenu(targetMenu) {
    state.currentMenu = targetMenu;
    dom.navTabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.target === targetMenu);
    });
    Object.keys(dom.sections).forEach(key => {
      dom.sections[key].classList.toggle('active', key === targetMenu);
    });

    if (targetMenu === 'past') {
      renderPastExam();
    } else if (targetMenu === 'applied') {
      renderAppliedExam();
    } else {
      renderInfo();
    }
  }

  // 기본정보 서브 탭 전환
  function switchInfoSubTab(targetSub) {
    dom.subTabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.sub === targetSub);
    });
    const subContents = document.querySelectorAll('.sub-info-content');
    subContents.forEach(c => {
      c.style.display = c.id === `sub-info-${targetSub}` ? 'block' : 'none';
    });
  }

  // 전체 화면 렌더링
  function renderAll() {
    renderInfo();
    renderPastExam();
    renderAppliedExam();
  }

  // ============================================================
  // 1. 기본 정보 메뉴 렌더링
  // ============================================================
  function renderInfo() {
    const cert = APP_DATA.info.qualifications.find(c => c.id === state.currentCertId);
    if (!cert) return;

    // 개요
    dom.infoCertTitle.textContent = `${cert.name} 자격 개요 및 검정 안내`;
    dom.infoCertSub.textContent = `${cert.category} | 시행처: ${cert.agency} | 영문명: ${cert.engName}`;
    dom.infoCertOverview.textContent = cert.overview;
    dom.infoCertCareer.textContent = cert.careerProspect;
    dom.infoCertFee.textContent = cert.examFee;

    // 일정 테이블
    dom.infoScheduleTableBody.innerHTML = '';
    cert.schedule.forEach(sch => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700; color:var(--primary);">${sch.round}</td>
        <td>${sch.apply}</td>
        <td><strong>${sch.exam}</strong></td>
        <td>${sch.result}</td>
      `;
      dom.infoScheduleTableBody.appendChild(tr);
    });

    // 응시 자격 진단 옵션
    dom.eligibilityOptions.innerHTML = '';
    cert.eligibility.forEach((el, idx) => {
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
          <div>선택하신 <strong>'${el.type}'</strong> 전형은 Q-Net 서류 심사 시 관련 졸업(예정)증명서, 경력증명서 또는 학점은행제 증명서를 제출하시면 필기 응시 자격이 부여됩니다.</div>
        `;
      });
      dom.eligibilityOptions.appendChild(label);
    });

    // 시험 과목 및 합격 기준
    const ws = cert.examStructure.written;
    const ps = cert.examStructure.practical;
    dom.infoCriteriaContainer.innerHTML = `
      <div style="background-color:var(--bg-main); padding:16px; border-radius:var(--radius-sm); border-left:4px solid var(--primary);">
        <h4 style="font-size:1.05rem; margin-bottom:6px; color:var(--primary);">${ws.title}</h4>
        <ul style="padding-left:18px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
          <li><strong>검정 방법:</strong> ${ws.method} (${ws.questions}, 시험시간 ${ws.duration})</li>
          <li><strong>합격 기준:</strong> <span style="color:var(--danger); font-weight:800;">${ws.passStandard}</span></li>
        </ul>
        <div style="margin-top:12px;">
          <strong>세부 시험 과목:</strong>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            ${ws.subjects.map(s => `
              <div style="background:var(--bg-card); padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:0.88rem;">
                <strong>${s.name}</strong> (${s.questions}문항) - <span style="color:var(--text-muted);">${s.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="background-color:var(--bg-main); padding:16px; border-radius:var(--radius-sm); border-left:4px solid var(--success);">
        <h4 style="font-size:1.05rem; margin-bottom:6px; color:var(--success);">${ps.title}</h4>
        <ul style="padding-left:18px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
          <li><strong>검정 방법:</strong> ${ps.method} (시험시간 ${ps.duration})</li>
          <li><strong>합격 기준:</strong> <span style="color:var(--success); font-weight:800;">${ps.passStandard}</span></li>
        </ul>
      </div>
    `;

    // 핵심 요약 노트
    dom.infoSummaryContainer.innerHTML = '';
    cert.summaries.forEach((sum, idx) => {
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
  // 2. 기출문제 메뉴 렌더링 및 시험 엔진
  // ============================================================
  function getCurrentExam(type) {
    if (type === 'past') {
      return APP_DATA.pastExams.find(e => e.certId === state.currentCertId) || APP_DATA.pastExams[0];
    } else {
      return APP_DATA.appliedExams.find(e => e.certId === state.currentCertId) || APP_DATA.appliedExams[0];
    }
  }

  function resetExamState(type, clearAnswers = true) {
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    s.currentIndex = 0;
    s.isSubmitted = false;
    s.filterWrongOnly = false;
    if (clearAnswers) {
      s.userAnswers = {};
      s.bookmarks.clear();
    }
    if (type === 'past') {
      stopPastTimer();
      const exam = getCurrentExam('past');
      s.timerSeconds = (exam.timeLimitMinutes || 20) * 60;
    }
  }

  function startPastTimer() {
    stopPastTimer();
    const exam = getCurrentExam('past');
    state.pastExam.timerSeconds = (exam.timeLimitMinutes || 20) * 60;
    dom.pastTimerBox.style.display = 'flex';
    updateTimerDisplay();

    state.pastExam.timerInterval = setInterval(() => {
      state.pastExam.timerSeconds--;
      updateTimerDisplay();
      if (state.pastExam.timerSeconds <= 0) {
        stopPastTimer();
        alert('시험 제한시간이 종료되었습니다! 작성하신 답안을 자동 제출합니다.');
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

  function updateTimerDisplay() {
    const mins = Math.floor(state.pastExam.timerSeconds / 60);
    const secs = state.pastExam.timerSeconds % 60;
    dom.pastTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderPastExam() {
    const exam = getCurrentExam('past');
    if (!exam) return;

    dom.pastRoundTitle.textContent = `${exam.certName} - ${exam.round}`;
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
    const exam = getCurrentExam(type);
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

      // 제출 후에는 맞춤/틀림 색상 표기
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
    const exam = getCurrentExam(type);
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

    // 북마크 토글 이벤트
    container.querySelector('#btnBookmark').addEventListener('click', () => {
      if (s.bookmarks.has(q.id)) {
        s.bookmarks.delete(q.id);
      } else {
        s.bookmarks.add(q.id);
      }
      renderQuestionCard(type);
      renderOmrGrid(type);
    });

    // 보기 클릭 이벤트
    const optionItems = container.querySelectorAll('.option-item');
    optionItems.forEach(el => {
      el.addEventListener('click', () => {
        if (s.isSubmitted) return; // 제출 후엔 변경 금지
        const optIdx = parseInt(el.dataset.optIdx, 10);
        s.userAnswers[q.id] = optIdx;
        renderQuestionCard(type);
        renderOmrGrid(type);
      });
    });

    // 이전 버튼
    const btnPrev = container.querySelector('#btnPrev');
    if (btnPrev && s.currentIndex > 0) {
      btnPrev.addEventListener('click', () => {
        s.currentIndex--;
        renderQuestionCard(type);
        renderOmrGrid(type);
      });
    }

    // 다음 버튼
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

    // 제출 버튼
    const btnSubmit = container.querySelector('#btnSubmit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const unansweredCount = exam.questions.filter(item => s.userAnswers[item.id] === undefined).length;
        if (unansweredCount > 0) {
          if (!confirm(`아직 풀지 않은 문제가 ${unansweredCount}문항 있습니다.\n정말 제출하시겠습니까?`)) {
            return;
          }
        }
        submitExam(type);
      });
    }
  }

  // 시험 제출 및 채점 로직
  function submitExam(type) {
    const exam = getCurrentExam(type);
    const s = type === 'past' ? state.pastExam : state.appliedExam;

    if (type === 'past') {
      stopPastTimer();
    }

    s.isSubmitted = true;
    s.currentIndex = 0;

    if (type === 'past') {
      renderPastExam();
    } else {
      renderAppliedExam();
    }
  }

  // 채점 결과 화면 렌더링
  function renderExamResult(type) {
    const exam = getCurrentExam(type);
    const s = type === 'past' ? state.pastExam : state.appliedExam;
    const container = type === 'past' ? dom.pastResultContainer : dom.appliedResultContainer;

    let correctCount = 0;
    const wrongQuestions = [];

    exam.questions.forEach(q => {
      const userAns = s.userAnswers[q.id];
      if (userAns === q.answer) {
        correctCount++;
      } else {
        wrongQuestions.push(q);
      }
    });

    const totalCount = exam.questions.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const isPassed = score >= 60; // 60점 이상 합격

    container.innerHTML = `
      <div class="card result-card">
        <div class="result-badge ${isPassed ? 'pass' : 'fail'}">
          ${isPassed ? '🎉 시험 합격 기준 통과!' : '⚠️ 과락 및 점수 미달 (불합격)'}
        </div>
        <div class="result-score">
          ${score}<span> / 100점</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">
          ${isPassed ? '축하합니다! 합격 기준인 60점을 달성하였습니다.' : '합격 기준(60점)에 미달하였습니다. 오답 노트를 반드시 복습하세요!'}
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

      <!-- 오답 노트 영역 -->
      ${wrongQuestions.length > 0 ? `
        <div class="card" style="margin-top:20px;">
          <h3 class="card-title" style="color:var(--danger);">🚨 오답 집중 복습 노트 (${wrongQuestions.length}문항)</h3>
          <p class="card-subtitle">틀린 문항의 기출 개념과 해설을 다시 점검하십시오.</p>
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${wrongQuestions.map((wq, wIdx) => `
              <div class="wrong-answer-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span class="question-tag">${wq.subject}</span>
                  <span style="font-size:0.85rem; color:var(--danger); font-weight:700;">내 선택: ${s.userAnswers[wq.id] !== undefined ? s.userAnswers[wq.id] + 1 : '미응답'}번 | 정답: ${wq.answer + 1}번</span>
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

    // 전체 문항 해설 보기
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

    // 새로 다시 풀기
    container.querySelector('#btnRestart').addEventListener('click', () => {
      resetExamState(type, true);
      if (type === 'past') {
        renderPastExam();
      } else {
        renderAppliedExam();
      }
    });
  }

  // ============================================================
  // 3. 기출변형 응용문제 메뉴 렌더링
  // ============================================================
  function renderAppliedExam() {
    const exam = getCurrentExam('applied');
    if (!exam) return;

    dom.appliedTitle.textContent = `${exam.certName} - ${exam.title}`;

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

  // XSS 방지 유틸
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 실행
  initApp();

})();
