/**
 * Classroom Seat Manager (우리 반 자리 바꾸기)
 * Main Application Controller & UI Coordinator
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State & Managers
  const classroom = new ClassroomManager(5, 6);
  const studentMgr = new StudentManager();
  const conditionMgr = new ConditionManager();

  let currentSeating = null;
  let seatingDate = new Date().toISOString().slice(0, 10);
  let selectedSwapSlot = null; // { deskId, slotIndex, student, elem }
  let currentStep = 1;

  // Restore saved state from LocalStorage if available
  const savedState = StorageManager.loadActiveState();
  if (savedState) {
    if (savedState.layout) classroom.fromJSON(savedState.layout);
    if (savedState.students) studentMgr.fromJSON(savedState.students);
    if (savedState.conditions) conditionMgr.fromJSON(savedState.conditions);
    if (savedState.currentSeating) currentSeating = savedState.currentSeating;
  }

  // Set initial date in input
  const dateInput = document.getElementById('seating-date-input');
  if (dateInput) dateInput.value = seatingDate;

  // 2. DOM Elements Cache
  const stepTabs = document.querySelectorAll('.step-tab');
  const stepPanels = document.querySelectorAll('.step-panel');

  const statStudents = document.getElementById('stat-students-count');
  const statCapacity = document.getElementById('stat-capacity-count');
  const statSpare = document.getElementById('stat-spare-count');
  const statConditions = document.getElementById('stat-conditions-count');
  const spareBadge = document.getElementById('stat-spare-badge');

  // Step 1 Elements
  const rowsInput = document.getElementById('input-rows');
  const colsInput = document.getElementById('input-cols');
  const btnRowDec = document.getElementById('btn-row-dec');
  const btnRowInc = document.getElementById('btn-row-inc');
  const btnColDec = document.getElementById('btn-col-dec');
  const btnColInc = document.getElementById('btn-col-inc');
  const classroomLayoutGrid = document.getElementById('classroom-layout-grid');
  const layoutStatsInfo = document.getElementById('layout-stats-info');
  const podiumPositionSelect = document.getElementById('podium-position-select');

  // Step 2 Elements
  const excelDropzone = document.getElementById('excel-dropzone');
  const excelFileInput = document.getElementById('excel-file-input');
  const btnDownloadTemplate = document.getElementById('btn-download-template');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnClearStudents = document.getElementById('btn-clear-students');
  const studentTableBody = document.getElementById('student-table-body');
  const studentCountDisplay = document.getElementById('student-count-display');
  const studentSearchInput = document.getElementById('student-search-input');
  const formAddStudent = document.getElementById('form-add-student');
  const inputStudentNum = document.getElementById('add-student-num');
  const inputStudentName = document.getElementById('add-student-name');
  const selectStudentGender = document.getElementById('add-student-gender');

  // Step 3 Elements
  const selectPair1 = document.getElementById('select-pair-1');
  const selectPair2 = document.getElementById('select-pair-2');
  const btnAddPair = document.getElementById('btn-add-pair');
  const pairConditionsList = document.getElementById('pair-conditions-list');
  const selectAvoid1 = document.getElementById('select-avoid-1');
  const selectAvoid2 = document.getElementById('select-avoid-2');
  const btnAddAvoid = document.getElementById('btn-add-avoid');
  const avoidConditionsList = document.getElementById('avoid-conditions-list');
  const conflictAlertContainer = document.getElementById('conflict-alert-container');
  const btnClearConditions = document.getElementById('btn-clear-conditions');

  // Step 4 Elements
  const btnRunSeating = document.getElementById('btn-run-seating');
  const btnReshuffle = document.getElementById('btn-reshuffle');
  const btnOpenSaveModal = document.getElementById('btn-open-save-modal');
  const btnOpenPrintModal = document.getElementById('btn-open-print-modal');
  const classroomResultGrid = document.getElementById('classroom-result-grid');
  const seatingResultDateDisplay = document.getElementById('seating-result-date-display');

  // Step 5 Elements
  const historyTableBody = document.getElementById('history-table-body');
  const historyCountDisplay = document.getElementById('history-count-display');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Header Actions
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const importJsonInput = document.getElementById('import-json-input');
  const btnResetAll = document.getElementById('btn-reset-all');
  const btnOpenGuide = document.getElementById('btn-open-guide');

  // Modals
  const saveModal = document.getElementById('modal-save');
  const printModal = document.getElementById('modal-print');
  const guideModal = document.getElementById('modal-guide');
  const resetModal = document.getElementById('modal-reset');

  // 3. UI Helper Functions
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '🚨';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function openModal(modal) {
    if (modal) modal.classList.add('show');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('show');
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      closeModal(document.getElementById(targetId));
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  // 4. Update Header Stats Bar
  function updateGlobalStats() {
    const stats = classroom.getStats();
    const studentsCount = studentMgr.students.length;
    const spare = stats.totalCapacity - studentsCount;
    const conditionsCount = conditionMgr.pairConditions.length + conditionMgr.avoidConditions.length;

    if (statStudents) statStudents.textContent = `${studentsCount}명`;
    if (statCapacity) statCapacity.textContent = `${stats.totalCapacity}석`;
    if (statConditions) statConditions.textContent = `${conditionsCount}개`;

    if (statSpare && spareBadge) {
      if (spare < 0) {
        statSpare.textContent = `${Math.abs(spare)}석 부족!`;
        spareBadge.className = 'stat-item highlight-warning';
      } else {
        statSpare.textContent = `${spare}석 여유`;
        spareBadge.className = 'stat-item highlight-spare';
      }
    }
  }

  // 5. Step Navigation Controller
  function setStep(stepNumber) {
    currentStep = stepNumber;
    stepTabs.forEach(tab => {
      const tabStep = parseInt(tab.getAttribute('data-step'), 10);
      tab.classList.toggle('active', tabStep === stepNumber);
    });
    stepPanels.forEach(panel => {
      const panelStep = parseInt(panel.getAttribute('data-step'), 10);
      panel.classList.toggle('active', panelStep === stepNumber);
    });

    if (stepNumber === 1) renderLayoutEditor();
    if (stepNumber === 2) renderStudentTable();
    if (stepNumber === 3) {
      populateStudentDropdowns();
      renderConditionsList();
      checkAndRenderConflicts();
    }
    if (stepNumber === 4) {
      if (currentSeating && currentSeating.assignment) {
        renderSeatingResult(currentSeating.assignment);
      } else {
        runSeatingSolver();
      }
    }
    if (stepNumber === 5) renderHistoryTable();

    updateGlobalStats();
  }

  stepTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const step = parseInt(tab.getAttribute('data-step'), 10);
      setStep(step);
    });
  });

  document.querySelectorAll('[data-next-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.getAttribute('data-next-step'), 10);
      setStep(next);
      if (next === 4) {
        runSeatingSolver();
      }
    });
  });

  document.querySelectorAll('[data-prev-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prev = parseInt(btn.getAttribute('data-prev-step'), 10);
      setStep(prev);
    });
  });

  // 6. Step 1: Classroom Layout Logic & Render
  function renderLayoutEditor() {
    if (!classroomLayoutGrid) return;
    if (rowsInput) rowsInput.value = classroom.rows;
    if (colsInput) colsInput.value = classroom.cols;
    if (podiumPositionSelect) podiumPositionSelect.value = classroom.podiumPosition;

    // Update podium position on container
    const layoutContainers = document.querySelectorAll('.classroom-layout-container');
    layoutContainers.forEach(container => {
      container.classList.toggle('podium-bottom', classroom.podiumPosition === 'bottom');
    });

    classroomLayoutGrid.style.gridTemplateColumns = `repeat(${classroom.cols}, minmax(80px, 1fr))`;
    classroomLayoutGrid.innerHTML = '';

    for (let r = 0; r < classroom.rows; r++) {
      for (let c = 0; c < classroom.cols; c++) {
        const desk = classroom.grid[r][c];
        const deskElem = document.createElement('div');
        deskElem.className = `desk-box ${desk.type === 'empty' ? 'empty-corridor' : ''}`;
        deskElem.setAttribute('data-row', r);
        deskElem.setAttribute('data-col', c);

        let typeText = '2인석';
        if (desk.type === 'single') typeText = '1인석';
        if (desk.type === 'empty') typeText = '통로(비움)';

        let seatsHtml = '';
        if (desk.type === 'single') {
          seatsHtml = '<div class="seat-slot empty-seat"><span class="seat-student-name">1인석</span></div>';
        } else if (desk.type === 'double') {
          seatsHtml = `
            <div class="seat-slot empty-seat"><span class="seat-student-name">좌석 1</span></div>
            <div class="seat-slot empty-seat"><span class="seat-student-name">좌석 2</span></div>
          `;
        } else {
          seatsHtml = '<div class="seat-slot empty-seat" style="border:none;background:transparent;"><span class="seat-student-name" style="color:#cbd5e1;">통로</span></div>';
        }

        deskElem.innerHTML = `
          <div class="desk-header-info">
            <span>#${desk.deskNumber}</span>
            <span class="desk-type-badge">${typeText}</span>
          </div>
          <div class="desk-seats-container">${seatsHtml}</div>
        `;

        deskElem.addEventListener('click', () => {
          classroom.toggleDeskType(r, c);
          renderLayoutEditor();
          updateGlobalStats();
          saveState();
        });

        classroomLayoutGrid.appendChild(deskElem);
      }
    }

    const stats = classroom.getStats();
    if (layoutStatsInfo) {
      layoutStatsInfo.innerHTML = `
        <strong>${classroom.rows}행 × ${classroom.cols}열</strong> (총 책상: ${stats.totalDesks}개 / 2인석: ${stats.doubleDesks}개 / 1인석: ${stats.singleDesks}개 / <strong>총 ${stats.totalCapacity}석 수용</strong>)
      `;
    }
  }

  // Row / Col Stepper Buttons
  if (btnRowDec) btnRowDec.addEventListener('click', () => { classroom.resize(classroom.rows - 1, classroom.cols); renderLayoutEditor(); updateGlobalStats(); saveState(); });
  if (btnRowInc) btnRowInc.addEventListener('click', () => { classroom.resize(classroom.rows + 1, classroom.cols); renderLayoutEditor(); updateGlobalStats(); saveState(); });
  if (btnColDec) btnColDec.addEventListener('click', () => { classroom.resize(classroom.rows, classroom.cols - 1); renderLayoutEditor(); updateGlobalStats(); saveState(); });
  if (btnColInc) btnColInc.addEventListener('click', () => { classroom.resize(classroom.rows, classroom.cols + 1); renderLayoutEditor(); updateGlobalStats(); saveState(); });

  if (rowsInput) rowsInput.addEventListener('change', (e) => { classroom.resize(parseInt(e.target.value, 10), classroom.cols); renderLayoutEditor(); updateGlobalStats(); saveState(); });
  if (colsInput) colsInput.addEventListener('change', (e) => { classroom.resize(classroom.rows, parseInt(e.target.value, 10)); renderLayoutEditor(); updateGlobalStats(); saveState(); });

  // Presets
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      classroom.applyPreset(preset);
      renderLayoutEditor();
      updateGlobalStats();
      saveState();
      showToast(`'${btn.textContent.trim()}' 프리셋이 적용되었습니다.`, 'success');
    });
  });

  const btnAllSingle = document.getElementById('btn-all-single');
  const btnAllDouble = document.getElementById('btn-all-double');
  if (btnAllSingle) btnAllSingle.addEventListener('click', () => { classroom.setAllDeskTypes('single'); renderLayoutEditor(); updateGlobalStats(); saveState(); });
  if (btnAllDouble) btnAllDouble.addEventListener('click', () => { classroom.setAllDeskTypes('double'); renderLayoutEditor(); updateGlobalStats(); saveState(); });

  if (podiumPositionSelect) {
    podiumPositionSelect.addEventListener('change', (e) => {
      classroom.podiumPosition = e.target.value;
      renderLayoutEditor();
      saveState();
      showToast(`교탁 위치가 '${e.target.options[e.target.selectedIndex].text}'으로 변경되었습니다.`, 'info');
    });
  }

  // 7. Step 2: Student Management & Excel Upload
  function renderStudentTable(filterText = '') {
    if (!studentTableBody) return;
    studentTableBody.innerHTML = '';

    const students = studentMgr.students;
    const q = filterText.trim().toLowerCase();
    const filtered = q ? students.filter(s => s.name.toLowerCase().includes(q) || String(s.number).includes(q)) : students;

    if (inputStudentNum) { inputStudentNum.value = students.length + 1; }
    if (studentCountDisplay) {
      studentCountDisplay.innerHTML = `총 <strong>${students.length}명</strong>의 학생을 불러왔습니다. (남: ${students.filter(s => s.gender === '남').length}명 / 여: ${students.filter(s => s.gender === '여').length}명)`;
    }

    if (filtered.length === 0) {
      studentTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;padding:24px;color:#94a3b8;">
            ${q ? '검색된 학생이 없습니다.' : '등록된 학생이 없습니다. 엑셀을 업로드하거나 학생을 추가해주세요.'}
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(s => {
      const tr = document.createElement('tr');
      let badgeClass = 'none';
      if (s.gender === '남') badgeClass = 'male';
      if (s.gender === '여') badgeClass = 'female';

      tr.innerHTML = `
        <td style="font-weight:600;width:60px;">${s.number}번</td>
        <td style="font-weight:700;">${s.name}</td>
        <td style="width:90px;"><span class="gender-badge ${badgeClass}">${s.gender || '미지정'}</span></td>
        <td style="width:120px;text-align:right;">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${s.id}">수정</button>
          <button class="btn btn-danger btn-sm btn-del" data-id="${s.id}">삭제</button>
        </td>
      `;

      tr.querySelector('.btn-del').addEventListener('click', () => {
        studentMgr.deleteStudent(s.id);
        conditionMgr.cleanupOrphaned(new Set(studentMgr.students.map(st => st.id)));
        renderStudentTable(studentSearchInput ? studentSearchInput.value : '');
        updateGlobalStats();
        saveState();
        showToast(`${s.name} 학생을 삭제했습니다.`, 'info');
      });

      tr.querySelector('.btn-edit').addEventListener('click', () => {
        const newName = prompt('학생 이름을 입력하세요:', s.name);
        if (newName && newName.trim()) {
          const newNum = prompt('학생 번호를 입력하세요:', s.number);
          studentMgr.updateStudent(s.id, newNum, newName, s.gender);
          renderStudentTable(studentSearchInput ? studentSearchInput.value : '');
          saveState();
          showToast('학생 정보가 수정되었습니다.', 'success');
        }
      });

      studentTableBody.appendChild(tr);
    });
  }

  if (studentSearchInput) {
    studentSearchInput.addEventListener('input', (e) => {
      renderStudentTable(e.target.value);
    });
  }

  if (formAddStudent) {
    formAddStudent.addEventListener('submit', (e) => {
      e.preventDefault();
      const num = inputStudentNum.value;
      const name = inputStudentName.value;
      const gender = selectStudentGender.value;
      try {
        studentMgr.addStudent(num, name, gender);
        inputStudentName.value = '';
        inputStudentNum.value = studentMgr.students.length + 1;
        renderStudentTable();
        updateGlobalStats();
        saveState();
        showToast(`${name} 학생이 추가되었습니다.`, 'success');
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  }

  if (btnDownloadTemplate) {
    btnDownloadTemplate.addEventListener('click', () => {
      studentMgr.downloadTemplate();
      showToast('엑셀 업로드 양식을 다운로드했습니다.', 'success');
    });
  }

  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => {
      studentMgr.clearAll();
      conditionMgr.clearAll();
      renderStudentTable();
      updateGlobalStats();
      saveState();
      showToast('25명의 샘플 학생 명단을 불러왔습니다.', 'success');
    });
  }

  if (btnClearStudents) {
    btnClearStudents.addEventListener('click', () => {
      if (confirm('모든 학생 명단을 비우시겠습니까?')) {
        studentMgr.clearAll();
        conditionMgr.clearAll();
        renderStudentTable();
        updateGlobalStats();
        saveState();
        showToast('학생 명단이 초기화되었습니다.', 'info');
      }
    });
  }

  if (excelFileInput) {
    excelFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await studentMgr.parseExcelFile(file);
        conditionMgr.clearAll();
        renderStudentTable();
        updateGlobalStats();
        saveState();
        showToast(`총 ${studentMgr.students.length}명의 학생 명단을 불러왔습니다.`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
      excelFileInput.value = '';
    });
  }

  if (excelDropzone) {
    excelDropzone.addEventListener('click', () => excelFileInput && excelFileInput.click());
    excelDropzone.addEventListener('dragover', (e) => { e.preventDefault(); excelDropzone.classList.add('dragover'); });
    excelDropzone.addEventListener('dragleave', () => excelDropzone.classList.remove('dragover'));
    excelDropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      excelDropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      try {
        await studentMgr.parseExcelFile(file);
        conditionMgr.clearAll();
        renderStudentTable();
        updateGlobalStats();
        saveState();
        showToast(`총 ${studentMgr.students.length}명의 학생 명단을 불러왔습니다.`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 8. Step 3: Condition Management & Conflict Check
  function populateStudentDropdowns() {
    const students = studentMgr.students;
    const selects = [selectPair1, selectPair2, selectAvoid1, selectAvoid2];

    selects.forEach(sel => {
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = '<option value="">학생 선택 ▼</option>';
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.number}번. ${s.name} (${s.gender || '미지정'})`;
        sel.appendChild(opt);
      });
      sel.value = currentVal;
    });
  }

  function renderConditionsList() {
    if (pairConditionsList) {
      pairConditionsList.innerHTML = '';
      if (conditionMgr.pairConditions.length === 0) {
        pairConditionsList.innerHTML = '<div style="color:#94a3b8;font-size:0.84rem;text-align:center;padding:12px;">설정된 같이 앉기 조건이 없습니다.</div>';
      } else {
        conditionMgr.pairConditions.forEach(p => {
          const s1 = studentMgr.getById(p.student1Id);
          const s2 = studentMgr.getById(p.student2Id);
          const item = document.createElement('div');
          item.className = 'condition-item pair';
          item.innerHTML = `
            <span>🤝 ${s1 ? s1.name : '알수없음'} ↔ ${s2 ? s2.name : '알수없음'}</span>
            <button class="btn btn-sm btn-secondary" style="padding:2px 6px;">✕</button>
          `;
          item.querySelector('button').addEventListener('click', () => {
            conditionMgr.removePair(p.id);
            renderConditionsList();
            checkAndRenderConflicts();
            updateGlobalStats();
            saveState();
          });
          pairConditionsList.appendChild(item);
        });
      }
    }

    if (avoidConditionsList) {
      avoidConditionsList.innerHTML = '';
      if (conditionMgr.avoidConditions.length === 0) {
        avoidConditionsList.innerHTML = '<div style="color:#94a3b8;font-size:0.84rem;text-align:center;padding:12px;">설정된 같이 앉지 않기 조건이 없습니다.</div>';
      } else {
        conditionMgr.avoidConditions.forEach(a => {
          const s1 = studentMgr.getById(a.student1Id);
          const s2 = studentMgr.getById(a.student2Id);
          const item = document.createElement('div');
          item.className = 'condition-item avoid';
          item.innerHTML = `
            <span>🚫 ${s1 ? s1.name : '알수없음'} ✕ ${s2 ? s2.name : '알수없음'}</span>
            <button class="btn btn-sm btn-secondary" style="padding:2px 6px;">✕</button>
          `;
          item.querySelector('button').addEventListener('click', () => {
            conditionMgr.removeAvoid(a.id);
            renderConditionsList();
            checkAndRenderConflicts();
            updateGlobalStats();
            saveState();
          });
          avoidConditionsList.appendChild(item);
        });
      }
    }
  }

  function checkAndRenderConflicts() {
    if (!conflictAlertContainer) return;
    conflictAlertContainer.innerHTML = '';
    const diagnostics = conditionMgr.validateConflicts(studentMgr, classroom);

    if (diagnostics.length === 0) {
      conflictAlertContainer.innerHTML = `
        <div class="alert-box alert-info">
          <span>✨ 모든 자리 조건과 교실 좌석 수가 정상입니다. 자리 배치를 바로 실행할 수 있습니다.</span>
        </div>
      `;
      return;
    }

    diagnostics.forEach(d => {
      const box = document.createElement('div');
      box.className = `alert-box alert-${d.type}`;
      box.innerHTML = `<span>${d.message}</span>`;
      conflictAlertContainer.appendChild(box);
    });
  }

  if (btnAddPair) {
    btnAddPair.addEventListener('click', () => {
      const s1 = selectPair1.value;
      const s2 = selectPair2.value;
      try {
        conditionMgr.addPair(s1, s2);
        selectPair1.value = '';
        selectPair2.value = '';
        renderConditionsList();
        checkAndRenderConflicts();
        updateGlobalStats();
        saveState();
        showToast('같이 앉기 조건이 추가되었습니다.', 'success');
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  }

  if (btnAddAvoid) {
    btnAddAvoid.addEventListener('click', () => {
      const s1 = selectAvoid1.value;
      const s2 = selectAvoid2.value;
      try {
        conditionMgr.addAvoid(s1, s2);
        selectAvoid1.value = '';
        selectAvoid2.value = '';
        renderConditionsList();
        checkAndRenderConflicts();
        updateGlobalStats();
        saveState();
        showToast('같이 앉지 않기 조건이 추가되었습니다.', 'success');
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  }

  if (btnClearConditions) {
    btnClearConditions.addEventListener('click', () => {
      if (confirm('모든 자리 조건을 초기화하시겠습니까?')) {
        conditionMgr.clearAll();
        renderConditionsList();
        checkAndRenderConflicts();
        updateGlobalStats();
        saveState();
        showToast('자리 조건이 초기화되었습니다.', 'info');
      }
    });
  }

  // 9. Step 4: Seating Execution & Visualization
  function renderEmptySeatingResult() {
    if (!classroomResultGrid) return;
    const layoutContainers = document.querySelectorAll('.classroom-layout-container');
    layoutContainers.forEach(container => {
      container.classList.toggle('podium-bottom', classroom.podiumPosition === 'bottom');
    });

    classroomResultGrid.style.gridTemplateColumns = `repeat(${classroom.cols}, minmax(80px, 1fr))`;
    classroomResultGrid.innerHTML = '';

    for (let r = 0; r < classroom.rows; r++) {
      for (let c = 0; c < classroom.cols; c++) {
        const desk = classroom.grid[r][c];
        const deskElem = document.createElement('div');
        deskElem.className = `desk-box ${desk.type === 'empty' ? 'empty-corridor' : ''}`;

        let seatsHtml = '';
        if (desk.type === 'single') {
          seatsHtml = '<div class="seat-slot empty-seat"><span class="seat-student-name">빈 좌석</span></div>';
        } else if (desk.type === 'double') {
          seatsHtml = `
            <div class="seat-slot empty-seat"><span class="seat-student-name">빈 좌석</span></div>
            <div class="seat-slot empty-seat"><span class="seat-student-name">빈 좌석</span></div>
          `;
        } else {
          seatsHtml = '<div class="seat-slot empty-seat" style="border:none;background:transparent;"><span class="seat-student-name" style="color:#cbd5e1;">통로</span></div>';
        }

        deskElem.innerHTML = `
          <div class="desk-header-info">
            <span>#${desk.deskNumber}</span>
          </div>
          <div class="desk-seats-container">${seatsHtml}</div>
        `;
        classroomResultGrid.appendChild(deskElem);
      }
    }
  }

  function renderSeatingResult(assignment) {
    if (!classroomResultGrid) return;
    const layoutContainers = document.querySelectorAll('.classroom-layout-container');
    layoutContainers.forEach(container => {
      container.classList.toggle('podium-bottom', classroom.podiumPosition === 'bottom');
    });

    classroomResultGrid.style.gridTemplateColumns = `repeat(${classroom.cols}, minmax(80px, 1fr))`;
    classroomResultGrid.innerHTML = '';

    const formattedDate = formatKoreanDate(seatingDate);
    if (seatingResultDateDisplay) {
      seatingResultDateDisplay.textContent = `📅 자리 바꾸기 날짜: ${formattedDate}`;
    }

    for (let r = 0; r < classroom.rows; r++) {
      for (let c = 0; c < classroom.cols; c++) {
        const desk = classroom.grid[r][c];
        const deskElem = document.createElement('div');
        deskElem.className = `desk-box ${desk.type === 'empty' ? 'empty-corridor' : ''}`;

        const deskStudents = assignment[desk.id] || [];
        let seatsHtml = '';

        if (desk.type === 'single') {
          const s = deskStudents[0];
          seatsHtml = renderSingleSlotHtml(desk.id, 0, s);
        } else if (desk.type === 'double') {
          const s1 = deskStudents[0];
          const s2 = deskStudents[1];
          seatsHtml = renderSingleSlotHtml(desk.id, 0, s1) + renderSingleSlotHtml(desk.id, 1, s2);
        } else {
          seatsHtml = '<div class="seat-slot empty-seat" style="border:none;background:transparent;"><span class="seat-student-name" style="color:#cbd5e1;">통로</span></div>';
        }

        deskElem.innerHTML = `
          <div class="desk-header-info">
            <span>#${desk.deskNumber}</span>
          </div>
          <div class="desk-seats-container">${seatsHtml}</div>
        `;

        classroomResultGrid.appendChild(deskElem);
      }
    }

    attachSeatSwapListeners(assignment);
  }

  function renderSingleSlotHtml(deskId, slotIndex, student) {
    if (!student) {
      return `
        <div class="seat-slot empty-seat clickable card-reveal" data-desk="${deskId}" data-slot="${slotIndex}">
          <span class="seat-student-name" style="color:#94a3b8;font-size:0.8rem;">빈 좌석</span>
        </div>
      `;
    }

    const genderClass = student.gender === '남' ? 'gender-male' : (student.gender === '여' ? 'gender-female' : '');
    const genderDot = genderClass ? `<span class="seat-gender-dot ${genderClass}"></span>` : '';

    return `
      <div class="seat-slot occupied clickable card-reveal" data-desk="${deskId}" data-slot="${slotIndex}">
        <span class="seat-student-num">${student.number}번</span>
        <div style="display:flex;align-items:center;justify-content:center;">
          <span class="seat-student-name">${student.name}</span>
          ${genderDot}
        </div>
      </div>
    `;
  }

  function attachSeatSwapListeners(assignment) {
    document.querySelectorAll('.seat-slot.clickable').forEach(slotElem => {
      slotElem.addEventListener('click', () => {
        const deskId = slotElem.getAttribute('data-desk');
        const slotIndex = parseInt(slotElem.getAttribute('data-slot'), 10);
        const currentStudent = assignment[deskId] ? assignment[deskId][slotIndex] : null;

        if (!selectedSwapSlot) {
          selectedSwapSlot = { deskId, slotIndex, student: currentStudent, elem: slotElem };
          slotElem.classList.add('highlight-selected');
          showToast(`'${currentStudent ? currentStudent.name : '빈 좌석'}' 선택됨. 맞바꿀 다른 좌석을 클릭하세요.`, 'info');
        } else {
          const first = selectedSwapSlot;
          const second = { deskId, slotIndex, student: currentStudent, elem: slotElem };

          first.elem.classList.remove('highlight-selected');

          if (first.deskId === second.deskId && first.slotIndex === second.slotIndex) {
            selectedSwapSlot = null;
            showToast('자리 선택이 취소되었습니다.', 'info');
            return;
          }

          assignment[first.deskId][first.slotIndex] = second.student;
          assignment[second.deskId][second.slotIndex] = first.student;

          selectedSwapSlot = null;
          renderSeatingResult(assignment);
          saveState();

          const name1 = first.student ? first.student.name : '빈 좌석';
          const name2 = second.student ? second.student.name : '빈 좌석';
          showToast(`'${name1}'와(과) '${name2}'의 자리를 맞바꿨습니다!`, 'success');
        }
      });
    });
  }

  function formatKoreanDate(isoDateStr) {
    if (!isoDateStr) return '';
    try {
      const parts = isoDateStr.split('-');
      if (parts.length === 3) {
        return `${parts[0]}년 ${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
      }
    } catch (e) {}
    return isoDateStr;
  }

  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  function runSeatingSolver() {
    try {
      if (studentMgr.students.length === 0) {
        showToast('학생 명단이 비어 있습니다. 2단계에서 학생을 등록해주세요.', 'warning');
        setStep(2);
        return;
      }

      const result = SeatingSolver.solve(classroom, studentMgr, conditionMgr, 1000);
      if (result.success) {
        currentSeating = {
          assignment: result.assignment,
          seatingDate: seatingDate,
          timestamp: Date.now()
        };
        renderSeatingResult(result.assignment);
        triggerConfetti();
        saveState();
        showToast(`🎉 자리 배치가 완료되었습니다! (${result.attempts}회 시도 성공)`, 'success');
      } else {
        if (result.assignment) {
          currentSeating = {
            assignment: result.assignment,
            seatingDate: seatingDate,
            timestamp: Date.now()
          };
          renderSeatingResult(result.assignment);
          saveState();
        }
        showToast(result.message || '일부 조건을 만족하지 못했습니다.', 'warning');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (btnRunSeating) btnRunSeating.addEventListener('click', runSeatingSolver);
  if (btnReshuffle) btnReshuffle.addEventListener('click', runSeatingSolver);

  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      seatingDate = e.target.value;
      if (currentSeating) currentSeating.seatingDate = seatingDate;
      const formatted = formatKoreanDate(seatingDate);
      if (seatingResultDateDisplay) seatingResultDateDisplay.textContent = `📅 자리 바꾸기 날짜: ${formatted}`;
      saveState();
    });
  }

  // 10. Step 5: Seating History & Save Snapshots
  function renderHistoryTable() {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = '';
    const history = StorageManager.getHistory();

    if (historyCountDisplay) {
      historyCountDisplay.innerHTML = `총 <strong>${history.length}개</strong>의 저장된 자리배치가 있습니다.`;
    }

    if (history.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:24px;color:#94a3b8;">
            저장된 자리배치 기록이 없습니다. 자리 배치 후 '현재 자리 저장'을 눌러보세요.
          </td>
        </tr>
      `;
      return;
    }

    history.forEach(item => {
      const tr = document.createElement('tr');
      const timeStr = new Date(item.timestamp).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

      tr.innerHTML = `
        <td style="font-weight:600;">${item.date}</td>
        <td style="font-weight:700;">${item.title}</td>
        <td>${item.studentCount}명</td>
        <td style="color:#64748b;font-size:0.8rem;">${timeStr}</td>
        <td style="text-align:right;">
          <button class="btn btn-primary btn-sm btn-hist-load" data-id="${item.id}">불러오기</button>
          <button class="btn btn-secondary btn-sm btn-hist-print" data-id="${item.id}">인쇄</button>
          <button class="btn btn-danger btn-sm btn-hist-del" data-id="${item.id}">삭제</button>
        </td>
      `;

      tr.querySelector('.btn-hist-load').addEventListener('click', () => {
        if (confirm(`'${item.title}' 자리 배치를 불러오시겠습니까?`)) {
          if (item.layout) classroom.fromJSON(item.layout);
          if (item.students) studentMgr.fromJSON(item.students);
          if (item.conditions) conditionMgr.fromJSON(item.conditions);
          if (item.seating) currentSeating = item.seating;
          seatingDate = item.date || seatingDate;
          if (dateInput) dateInput.value = seatingDate;

          saveState();
          setStep(4);
          showToast(`'${item.title}' 기록을 성공적으로 불러왔습니다.`, 'success');
        }
      });

      tr.querySelector('.btn-hist-print').addEventListener('click', () => {
        if (item.seating && item.seating.assignment) {
          renderSeatingResult(item.seating.assignment);
          PrintHelper.prepareAndPrint(item.title, item.date, item.studentCount, '');
        }
      });

      tr.querySelector('.btn-hist-del').addEventListener('click', () => {
        if (confirm(`'${item.title}' 기록을 삭제하시겠습니까?`)) {
          StorageManager.deleteHistoryRecord(item.id);
          renderHistoryTable();
          showToast('기록이 삭제되었습니다.', 'info');
        }
      });

      historyTableBody.appendChild(tr);
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('모든 자리 배치 기록을 삭제하시겠습니까?')) {
        localStorage.removeItem(StorageManager.KEYS.HISTORY);
        renderHistoryTable();
        showToast('모든 기록이 삭제되었습니다.', 'info');
      }
    });
  }

  // 11. Modal Logic (Save, Print, Guide, Reset, Backup)
  const inputSaveTitle = document.getElementById('save-seating-title');
  const btnConfirmSave = document.getElementById('btn-confirm-save');

  if (btnOpenSaveModal) {
    btnOpenSaveModal.addEventListener('click', () => {
      if (!currentSeating || !currentSeating.assignment) {
        showToast('먼저 [🎲 자리 바꾸기]를 실행해주세요.', 'warning');
        return;
      }
      const count = StorageManager.getHistory().length + 1;
      if (inputSaveTitle) {
        inputSaveTitle.value = `${new Date().toLocaleDateString('ko-KR')} ${count}차 자리배치`;
      }
      openModal(saveModal);
    });
  }

  if (btnConfirmSave) {
    btnConfirmSave.addEventListener('click', () => {
      const title = inputSaveTitle ? inputSaveTitle.value.trim() : '';
      if (!title) {
        showToast('저장 이름을 입력해주세요.', 'warning');
        return;
      }
      StorageManager.saveToHistory({
        title,
        date: seatingDate,
        studentCount: studentMgr.students.length,
        layout: classroom.toJSON(),
        students: studentMgr.toJSON(),
        conditions: conditionMgr.toJSON(),
        seating: currentSeating
      });
      closeModal(saveModal);
      showToast('자리 배치가 기록에 저장되었습니다.', 'success');
    });
  }

  const inputPrintClass = document.getElementById('print-class-name');
  const inputPrintTeacher = document.getElementById('print-teacher-name');
  const btnConfirmPrint = document.getElementById('btn-confirm-print');

  if (btnOpenPrintModal) {
    btnOpenPrintModal.addEventListener('click', () => {
      if (!currentSeating || !currentSeating.assignment) {
        showToast('먼저 [🎲 자리 바꾸기]를 실행해주세요.', 'warning');
        return;
      }
      openModal(printModal);
    });
  }

  if (btnConfirmPrint) {
    btnConfirmPrint.addEventListener('click', () => {
      const className = inputPrintClass ? inputPrintClass.value.trim() : '';
      const teacherName = inputPrintTeacher ? inputPrintTeacher.value.trim() : '';
      closeModal(printModal);
      PrintHelper.prepareAndPrint(className, formatKoreanDate(seatingDate), studentMgr.students.length, teacherName);
    });
  }

  if (btnOpenGuide) btnOpenGuide.addEventListener('click', () => openModal(guideModal));
  if (btnResetAll) btnResetAll.addEventListener('click', () => openModal(resetModal));

  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', () => {
      StorageManager.clearAll();
      classroom.initGrid();
      studentMgr.clearAll();
      conditionMgr.clearAll();
      currentSeating = null;
      closeModal(resetModal);
      setStep(1);
      showToast('모든 설정과 명단이 초기화되었습니다.', 'info');
    });
  }

  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      StorageManager.exportJSON();
      showToast('자리 배치 백업 파일(.json)이 다운로드되었습니다.', 'success');
    });
  }

  if (btnImportJson && importJsonInput) {
    btnImportJson.addEventListener('click', () => importJsonInput.click());
    importJsonInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await StorageManager.importJSON(file);
        const reloaded = StorageManager.loadActiveState();
        if (reloaded.layout) classroom.fromJSON(reloaded.layout);
        if (reloaded.students) studentMgr.fromJSON(reloaded.students);
        if (reloaded.conditions) conditionMgr.fromJSON(reloaded.conditions);
        if (reloaded.currentSeating) currentSeating = reloaded.currentSeating;

        setStep(1);
        showToast('백업 파일에서 데이터를 복원했습니다.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
      importJsonInput.value = '';
    });
  }

  function saveState() {
    StorageManager.saveActiveState(classroom, studentMgr, conditionMgr, currentSeating, {
      seatingDate
    });
  }

  // Initial Boot
  setStep(1);
});
