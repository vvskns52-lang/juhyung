// ==========================================================================
// 1. Initial State, Default Data & Configuration
// ==========================================================================
const defaultAutonomousActivities = [
    "#학교생활안내(3/3)", "#학급자치회조직(3/12)", "#학교폭력예방교육(도박,사이버범죄)(3/16)",
    "#학생인권교육1(3/27)", "#아동학대및가정폭력예방교육1(3/27)", "#성폭력예방교육(3/31)",
    "#학급자치회의(4/10)", "#장애이해교육(4/20)", "#감사의날(5/6)",
    "#학급별특색활동(5/26)", "#학생인권교육(6/2)", "#방학식(7/21)"
];

const defaultSubjectActivities = [
    "#수학적모델링", "#과학적원리실험", "#진로연계심화발표", "#탐구보고서작성",
    "#비판적도서비평", "#시사이슈분석보고", "#마인드맵개념구조화", "#오답원인메타인지",
    "#배움나눔멘토링", "#대안적문제풀이", "#프로그램구현", "#실험설계및관찰",
    "#추가자료분석", "#질문중심배움일지", "#교과피드백수용", "#주제탐구포스터",
    "#원리시각화발표", "#오류교정워크북", "#교과어휘개념학습", "#심층주제토론"
];

const defaultBehaviorActivities = [
    "#솔선수범정화", "#갈등평화조율", "#학습멘토링배려", "#자치규칙준수",
    "#단합적극유도", "#예의바른경청", "#약속마감엄수", "#타인감정존중",
    "#플래너자기성찰", "#고민경청공감", "#지속적봉사", "#학급안정기여",
    "#정서적리더십", "#성실성인정", "#학습태도개선", "#비품선도관리",
    "#배움나눔실천", "#급우협동지원", "#자기조절우수", "#성실책임완수"
];

// Active Category State: 'autonomous' | 'subject' | 'behavior'
let activeCategory = 'autonomous';

// Lists for each category (retrieved from localStorage or defaulted, migrated to v10 single unified pool)
let autonomousList = JSON.parse(localStorage.getItem('ai_pool_autonomous_v10'));
if (!autonomousList) {
    // Force reset autonomous pool to the new real curriculum table data
    autonomousList = [...defaultAutonomousActivities];
    localStorage.setItem('ai_pool_autonomous_v10', JSON.stringify(autonomousList));
}

let subjectList = JSON.parse(localStorage.getItem('ai_pool_subject_v10'));
if (!subjectList) {
    // Inherit from v9 or fallback
    const v9List = JSON.parse(localStorage.getItem('ai_pool_subject_v9'));
    if (v9List) {
        subjectList = v9List;
    } else {
        const v8Custom = JSON.parse(localStorage.getItem('ai_custom_subject_activities_v8')) || [];
        subjectList = [...new Set([...v8Custom, ...defaultSubjectActivities])];
    }
    localStorage.setItem('ai_pool_subject_v10', JSON.stringify(subjectList));
}

let behaviorList = JSON.parse(localStorage.getItem('ai_pool_behavior_v10'));
if (!behaviorList) {
    // Inherit from v9 or fallback
    const v9List = JSON.parse(localStorage.getItem('ai_pool_behavior_v9'));
    if (v9List) {
        behaviorList = v9List;
    } else {
        const v8Custom = JSON.parse(localStorage.getItem('ai_custom_behavior_activities_v8')) || [];
        behaviorList = [...new Set([...v8Custom, ...defaultBehaviorActivities])];
    }
    localStorage.setItem('ai_pool_behavior_v10', JSON.stringify(behaviorList));
}

let globalResults = []; // { name, activities: [], record: "" }
let isGenerating = false;

// Global Views: 'generator' | 'dashboard'
let currentView = 'generator';

// ==========================================================================
// 2. DOM Elements Selection
// ==========================================================================
const apiKeyInput = document.getElementById('api-key');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const verifyApiBtn = document.getElementById('verify-api-btn');
const saveKeyChk = document.getElementById('save-key-chk');
const apiStatusMsg = document.getElementById('api-status-msg');

const modelSelect = document.getElementById('model-select');
const lengthSelect = document.getElementById('length-select');
const toneSelect = document.getElementById('tone-select');
const customPromptInput = document.getElementById('custom-prompt');

// 시스템 프롬프트 튜닝 요소
const tuneNeisChk = document.getElementById('tune-neis');
const tuneCareerChk = document.getElementById('tune-career');
const tuneGrowthChk = document.getElementById('tune-growth');

// Category Tabs & Dynamic Inputs
const tabButtons = document.querySelectorAll('.tab-btn');
const subjectNameGroup = document.getElementById('subject-name-group');
const subjectNameInput = document.getElementById('subject-name');
const activityPoolLabel = document.getElementById('activity-pool-label');
const poolNoticeMsg = document.getElementById('pool-notice-msg');
const tableResultHeader = document.getElementById('table-result-header');

const studentNamesInput = document.getElementById('student-names');
const studentCountText = document.getElementById('student-count');

const customActivityInput = document.getElementById('custom-activity');
const addActivityBtn = document.getElementById('add-activity-btn');
const checkboxGrid = document.getElementById('checkbox-grid');

const generateBtn = document.getElementById('generate-btn');
const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressStatus = document.getElementById('progress-status');
const progressPercent = document.getElementById('progress-percent');

const resultTable = document.getElementById('result-table');
const resultTbody = document.getElementById('result-tbody');
const copyAllBtn = document.getElementById('copy-all-btn');
const exportExcelBtn = document.getElementById('export-excel-btn');

const themeToggleBtn = document.getElementById('theme-toggle');

// 신규 추가 요소: 글로벌 내비게이션, 찾아바꾸기, 대시보드
const navGeneratorBtn = document.getElementById('nav-generator');
const navDashboardBtn = document.getElementById('nav-dashboard');
const generatorInputPanel = document.getElementById('generator-input-panel');
const generatorResultPanel = document.getElementById('generator-result-panel');
const dashboardView = document.getElementById('dashboard-view');

const findTxtInput = document.getElementById('find-txt');
const replaceTxtInput = document.getElementById('replace-txt');
const btnReplaceAll = document.getElementById('btn-replace-all');
const saveSessionBtn = document.getElementById('save-session-btn');
const historyCardGrid = document.getElementById('history-card-grid');

// ==========================================================================
// 3. Theme Toggle & Storage Sync
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
    const iconSpan = themeToggleBtn.querySelector('.toggle-icon');
    iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
});

// ==========================================================================
// 4. Initialization & Setup
// ==========================================================================
window.onload = function() {
    initTheme();
    restoreSettings();
    initTabHandlers();
    initGlobalNavHandlers(); // 글로벌 네비게이션 초기화
    switchCategory('autonomous'); // Start with autonomous category
    updateStudentCount();
    
    // Bind Realtime Count Listener
    studentNamesInput.addEventListener('input', updateStudentCount);
    
    // Bind Add Activity Triggers
    addActivityBtn.addEventListener('click', addCustomActivity);
    customActivityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCustomActivity();
    });
    
    // API Visibility toggle
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    
    // API verification trigger
    verifyApiBtn.addEventListener('click', testApiKey);
    
    // Generator trigger
    generateBtn.addEventListener('click', generateBatchRecords);
    
    // Action Buttons
    copyAllBtn.addEventListener('click', copyAllToClipboard);
    exportExcelBtn.addEventListener('click', exportToExcel);
    
    // 찾아바꾸기 및 대시보드 저장 바인딩
    btnReplaceAll.addEventListener('click', replaceAllTexts);
    saveSessionBtn.addEventListener('click', saveCurrentSessionToHistory);

    // API Help Modal Bindings
    const helpBtn = document.getElementById('api-help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.classList.add('hidden');
    });

    // 글로벌 윤문 팝오버 닫기 처리
    document.addEventListener('click', (e) => {
        const activePopover = document.querySelector('.rewrite-popover');
        if (activePopover && !e.target.closest('.action-wrapper')) {
            activePopover.remove();
        }
    });
};

// Toggle API key visibility
function togglePasswordVisibility() {
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        togglePasswordBtn.textContent = '🔒';
    } else {
        apiKeyInput.type = 'password';
        togglePasswordBtn.textContent = '👁️';
    }
}

// Restore saved settings from LocalStorage
function restoreSettings() {
    const savedKey = localStorage.getItem('gemini_api_key_v8');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
    
    const savedModel = localStorage.getItem('gemini_model_v8');
    if (savedModel) {
        modelSelect.value = savedModel;
    }

    const savedSubjectName = localStorage.getItem('subject_name_v8');
    if (savedSubjectName) {
        subjectNameInput.value = savedSubjectName;
    }
}

// Update students count badge dynamically
function updateStudentCount() {
    const text = studentNamesInput.value.trim();
    const count = text ? text.split('\n').map(n => n.trim()).filter(n => n !== '').length : 0;
    studentCountText.textContent = `학생 수: ${count}명`;
}

// 글로벌 내비게이션 전환 핸들러
function initGlobalNavHandlers() {
    navGeneratorBtn.addEventListener('click', () => switchView('generator'));
    navDashboardBtn.addEventListener('click', () => switchView('dashboard'));
}

function switchView(view) {
    if (isGenerating) {
        alert("생기부 생성이 진행 중일 때는 화면을 전환할 수 없습니다.");
        return;
    }
    currentView = view;
    
    // 탭 버튼 active 클래스 제어
    if (view === 'generator') {
        navGeneratorBtn.classList.add('active');
        navDashboardBtn.classList.remove('active');
        generatorInputPanel.classList.remove('hidden');
        generatorResultPanel.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    } else {
        navGeneratorBtn.classList.remove('active');
        navDashboardBtn.classList.add('active');
        generatorInputPanel.classList.add('hidden');
        generatorResultPanel.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        
        // 대시보드 리스트 리렌더링
        renderHistoryDashboard();
    }
}

// ==========================================================================
// 5. Tab Handlers & View Controller
// ==========================================================================
function initTabHandlers() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isGenerating) {
                alert("생성이 진행 중일 때는 카테고리를 바꿀 수 없습니다.");
                return;
            }
            const targetCat = e.target.getAttribute('data-category');
            
            // Remove active from all tabs, add to clicked
            tabButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            switchCategory(targetCat);
        });
    });
}

function switchCategory(category) {
    activeCategory = category;
    
    // Reset view states
    progressContainer.classList.add('hidden');
    resultTbody.innerHTML = `
        <tr>
            <td colspan="2" class="empty-state">
                <div class="empty-icon">📊</div>
                <p>생성 버튼을 누르면 실시간으로 결과가 이곳에 채워집니다.</p>
            </td>
        </tr>
    `;
    globalResults = [];

    // Toggle specific inputs & texts
    if (category === 'subject') {
        subjectNameGroup.classList.remove('hidden');
        activityPoolLabel.innerHTML = `🧪 과목 수행/탐구 내용 풀(Pool) 선택 <span class="label-info">(학생별 랜덤 배정용)</span>`;
        poolNoticeMsg.innerHTML = `* 풍부한 내용 조합을 위해 수행평가 및 교과 활동을 4개 이상 등록해 주세요. <br><span style="color:var(--accent-blue); font-weight:700;">💡 각 태그를 더블클릭하면 텍스트를 즉시 수정할 수 있으며, 드래그하여 우선순위를 바꿀 수 있습니다.</span>`;
        customActivityInput.placeholder = "예: 수학 심화 발표 - 프랙탈 이론 탐구";
        tableResultHeader.textContent = "배정된 탐구 및 과목별 세부능력 특기사항 (클릭하여 직접 수정 가능)";
    } else if (category === 'behavior') {
        subjectNameGroup.classList.add('hidden');
        activityPoolLabel.innerHTML = `🌱 인성 요소 및 행동 관찰 풀(Pool) 선택 <span class="label-info">(학생별 랜덤 배정용)</span>`;
        poolNoticeMsg.innerHTML = `* 학생의 다양한 미덕 표현을 위해 인성 특성을 4개 이상 등록해 주세요. <br><span style="color:var(--accent-blue); font-weight:700;">💡 각 태그를 더블클릭하면 텍스트를 즉시 수정할 수 있으며, 드래그하여 우선순위를 바꿀 수 있습니다.</span>`;
        customActivityInput.placeholder = "예: 모범 학생 - 학급 환경 정화활동 솔선수범";
        tableResultHeader.textContent = "배정된 특성 및 행동특성 종합의견 (클릭하여 직접 수정 가능)";
    } else {
        // Autonomous
        subjectNameGroup.classList.add('hidden');
        activityPoolLabel.innerHTML = `✅ 활동 풀(Pool) 선택 <span class="label-info">(학생별 랜덤 배정용)</span>`;
        poolNoticeMsg.innerHTML = `* 다양한 조합을 위해 자율활동을 최소 4개 이상 체크해 두는 것을 권장합니다. <br><span style="color:var(--accent-blue); font-weight:700;">💡 각 태그를 더블클릭하면 텍스트를 즉시 수정할 수 있으며, 드래그하여 우선순위를 바꿀 수 있습니다.</span>`;
        customActivityInput.placeholder = "예: 체육대회 계주 및 학급 응원 단장 (5/15)";
        tableResultHeader.textContent = "배정된 활동 및 자율활동 특기사항 (클릭하여 직접 수정 가능)";
    }

    renderCheckboxes();
}

// ==========================================================================
// 6. Activity Pool Management
// ==========================================================================
function getActiveLists() {
    if (activeCategory === 'subject') {
        return {
            list: subjectList,
            storageKey: 'ai_pool_subject_v10'
        };
    } else if (activeCategory === 'behavior') {
        return {
            list: behaviorList,
            storageKey: 'ai_pool_behavior_v10'
        };
    } else {
        return {
            list: autonomousList,
            storageKey: 'ai_pool_autonomous_v10'
        };
    }
}

function renderCheckboxes() {
    checkboxGrid.innerHTML = ''; 
    const lists = getActiveLists();
    
    // Render Draggable Tags
    lists.list.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-tag';
        wrapper.setAttribute('draggable', 'true');
        wrapper.setAttribute('data-index', index);
        wrapper.setAttribute('data-text', item);
        
        wrapper.innerHTML = `
            <div class="tag-content-area">
                <span class="tag-drag-handle">☰</span>
                <span class="tag-index-badge">${index + 1}</span>
                <label class="checkbox-item" style="cursor: grab;">
                    <input type="checkbox" value="${item}" checked> 
                    <span class="tag-text" title="더블클릭하여 내용 수정 가능">${item}</span>
                </label>
            </div>
            <button class="btn-delete" title="완전 삭제">✖</button>
        `;

        // 삭제 이벤트 바인딩
        wrapper.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomActivity(index);
        });
        
        // 더블클릭 편집 이벤트 바인딩
        const tagTextSpan = wrapper.querySelector('.tag-text');
        tagTextSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startEditTag(tagTextSpan, index, lists, wrapper);
        });
        
        // 드래그 앤 드롭 네이티브 이벤트 바인딩
        wrapper.addEventListener('dragstart', handleDragStart);
        wrapper.addEventListener('dragover', handleDragOver);
        wrapper.addEventListener('drop', handleDrop);
        wrapper.addEventListener('dragend', handleDragEnd);

        checkboxGrid.appendChild(wrapper);
    });
}

// 태그 더블클릭 인라인 편집 핸들러
function startEditTag(element, index, lists, wrapper) {
    const originalText = lists.list[index];
    
    // 편집 중 드래그 방지
    wrapper.setAttribute('draggable', 'false');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-edit-input';
    input.value = originalText;
    
    element.replaceWith(input);
    input.focus();
    input.select();
    
    let isFinished = false;
    
    const saveEdit = () => {
        if (isFinished) return;
        isFinished = true;
        
        const newValue = input.value.trim();
        if (!newValue) {
            alert("수정할 내용을 입력해주세요!");
            renderCheckboxes();
            return;
        }
        
        if (newValue !== originalText && lists.list.includes(newValue)) {
            alert("이미 등록된 항목입니다!");
            renderCheckboxes();
            return;
        }
        
        // 데이터 갱신 및 로컬스토리지 동기화
        lists.list[index] = newValue;
        localStorage.setItem(lists.storageKey, JSON.stringify(lists.list));
        renderCheckboxes();
    };
    
    const cancelEdit = () => {
        if (isFinished) return;
        isFinished = true;
        renderCheckboxes();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}

// 네이티브 드래그 앤 드롭 핸들러 로직
let dragSrcEl = null;

function handleDragStart(e) {
    this.classList.add('dragging');
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-index'));
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); 
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    if (dragSrcEl !== this) {
        const fromIdx = parseInt(dragSrcEl.getAttribute('data-index'));
        const toIdx = parseInt(this.getAttribute('data-index'));
        
        reorderActivities(fromIdx, toIdx);
    }
    return false;
}

// 드래그 드롭 후 내부 배열 순서 갱신 및 로컬저장소 동기화
function reorderActivities(fromIdx, toIdx) {
    const lists = getActiveLists();
    
    // 요소 스왑
    const [movedItem] = lists.list.splice(fromIdx, 1);
    lists.list.splice(toIdx, 0, movedItem);
    
    // 순서 정보 localStorage 저장
    localStorage.setItem(lists.storageKey, JSON.stringify(lists.list));
    
    // 화면 재배치
    renderCheckboxes();
}

function addCustomActivity() {
    const activityText = customActivityInput.value.trim();
    if (!activityText) { 
        alert("추가할 내용을 입력해주세요!"); 
        return; 
    }

    const lists = getActiveLists();
    if (lists.list.includes(activityText)) { 
        alert("이미 등록된 항목입니다!"); 
        return; 
    }

    lists.list.unshift(activityText); 
    localStorage.setItem(lists.storageKey, JSON.stringify(lists.list));
    customActivityInput.value = ''; 
    renderCheckboxes(); 
}

function deleteCustomActivity(index) {
    if (confirm("이 항목을 완전히 삭제하시겠습니까?")) {
        const lists = getActiveLists();
        lists.list.splice(index, 1);
        localStorage.setItem(lists.storageKey, JSON.stringify(lists.list));
        renderCheckboxes();
    }
}

// 실제 NEIS 기준 바이트 계산 알고리즘
function getNeisBytes(text) {
    if (!text) return 0;
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        if (char === 10) { // 줄바꿈
            bytes += 2;
        } else if (char <= 127) { // 반각 영문/숫자/스페이스 등
            bytes += 1;
        } else { // 전각 한글/한자 등
            bytes += 3;
        }
    }
    return bytes;
}

// NEIS 기재 금지어 실시간 필터 검출기
function checkForbiddenWords(text) {
    if (!text) return [];
    
    // 생활기록부 대표 기재 금지어 목록
    const forbiddenList = [
        "TOEIC", "토익", "TOEFL", "토플", "TEPS", "텝스", "HSK", "JLPT", "PELT", 
        "경시대회", "올림피아드", "대회", "수상", "상장", "1등", "2등", "3등", "우수상", 
        "부모", "아버지", "어머니", "아빠", "엄마", "친척", "할아버지", "할머니",
        "교수", "의사", "검사", "판사", "변호사", "회장님", "사장님", "기업대표",
        "학원", "과외", "모의고사", "셀프생기부", "셀프 작성", "논문", "저서", "특허", "학회지"
    ];
    
    const found = [];
    forbiddenList.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        if (regex.test(text)) {
            found.push(word);
        }
    });
    return found;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================================================
// 7. Gemini API Connection & Helpers
// ==========================================================================
async function testApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        setApiStatus("API Key를 입력해주세요.", "error");
        return;
    }
    
    verifyApiBtn.disabled = true;
    setApiStatus("API 연결 테스트 중...", "");
    
    const testModel = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, 1 word." }] }]
            })
        });
        
        if (response.ok) {
            setApiStatus("API 연결 성공! 사용 가능한 키입니다.", "success");
            if (saveKeyChk.checked) {
                localStorage.setItem('gemini_api_key_v8', apiKey);
            } else {
                localStorage.removeItem('gemini_api_key_v8');
            }
        } else {
            throw new Error(`오류 코드: ${response.status}`);
        }
    } catch (error) {
        setApiStatus(`API 연결 실패: ${error.message} (키 확인 요망)`, "error");
    } finally {
        verifyApiBtn.disabled = false;
    }
}

function setApiStatus(msg, type) {
    apiStatusMsg.textContent = msg;
    apiStatusMsg.className = "status-msg " + type;
}

// Build standard structured instructions for Korean NEIS records (Autonomous, Subject, Behavior)
function buildPrompt(studentName, activities, tone, length, customPrompt) {
    let categoryGoal = "";
    let systemInstruction = "";
    let dateRule = "";
    
    // Tone mapping (8 ?댁“ 吏??
    let toneGuide = "";
    switch(tone) {
        case "active":
            toneGuide = "?숈깮??二쇰룄?? ?곴레??諛??ㅼ쭏??臾몄젣 ?닿껐 ?됰룞???⑺듃 湲곕컲?쇰줈 ?쒕윭?섎룄濡??섎ŉ, ?됰룞 吏?μ쟻???쒖닠(~??湲곗뿬?? ?욎옣?쒖꽌 ?ㅼ쿇?? ?먭린二쇰룄?곸쑝濡??먭뎄?섏뿬 ?깃낵瑜???????諛섏쁺??寃?";
            break;
        case "reflective":
            toneGuide = "?쒕룞 怨쇱젙?먯꽌 蹂댁뿬以 吏묒쨷?? ?먭뎄???깊뼢 諛?李⑤텇?섍쾶 ?댁떎??湲고븯???숈뒿 ?쒕룄媛 ?쒕윭?섎룄濡???寃?~??媛쒕뀗??遺꾩꽍?섏뿬 湲곕줉?? ?ㅻ쪟 ?먯씤??遺꾩꽍???쇰뱶諛깆쓣 ?ㅼ쿇????.";
            break;
        case "cooperative":
            toneGuide = "湲됱슦?ㅺ낵 ?뚰넻?섍퀬 議곕젰??援ъ껜???곹솴??臾섏궗??寃?~??怨쇱젙?먯꽌 ?섍껄??議곗쑉?섏뿬 ?꾩꽦?? 紐⑤몺 ?쒕룞 ????븷???몃텇?뷀븯???묐젰????.";
            break;
        case "literary":
            toneGuide = "?덇꺽 ?믪? 臾몄뼱泥?臾몄껜濡??쒖닠?섎ŉ, ?숇Ц??源딆씠? ?숈뒿??????먭뎄?? ?몄????멸린?ъ씠 援ъ껜??臾몄옣?쇰줈 ?섑??섍쾶 ??寃?";
            break;
        case "hybrid":
            toneGuide = "遺?쒕읇怨??좎뿰??媛쒖“??臾몄뼱泥?諛??됰룞 愿李??쒖닠???쇱슜?섏뿬 臾몃㎘???곗냽?깃낵 遺?쒕윭???洹밸??뷀빐 ?쒖닠??寃?";
            break;
        case "evidence":
            toneGuide = "?숈깮??吏꾪뻾???꾨줈?앺듃 二쇱젣, 諛쒗몴紐? ?낆꽌 ?쒕챸 ???ㅼ쭏?곸씠怨?援ъ껜?곸씤 ?⑺듃 ?щ?? ?깆랬 ?댁슜???곸꽭??湲곗옱??寃?";
            break;
        case "character":
            toneGuide = "怨듬룞泥???웾, 由щ뜑?? ?뚰넻 諛?媛덈벑 議곗쑉 ???숈깮???몄꽦???μ젏怨??꾨뜒?? ?섎닎??媛移섎? 以묒젏?곸쑝濡?湲곗닠??寃?";
            break;
        default:
            toneGuide = "?됰룞 諛??숈뒿 ?ъ떎 ?꾩＜濡?嫄댁“?섍퀬 媛앷??곸씤 ???먯쟻 愿李곗옄 ?섏븰?ㅻ줈 ?묒꽦??寃?";
    }

    // Length guide mapping
    let lengthGuide = "";
    switch(length) {
        case "short":
            lengthGuide = "怨듬갚 ?ы븿 150??~ 200???댁쇅濡?留ㅼ슦 吏㏐퀬 媛꾧껐?섍쾶 ?듭떖 ?⑺듃 ?꾩＜濡??묒꽦??寃?";
            break;
        case "long":
            lengthGuide = "怨듬갚 ?ы븿 400??~ 480???댁쇅濡??몃????쒕룞 ?댁슜怨?愿李곕맂 蹂?붿긽源뚯? ?띾??섍쾶 ?묒꽦??寃?";
            break;
        default:
            lengthGuide = "怨듬갚 ?ы븿 250??~ 300???댁쇅濡??ъ떎怨??쒕룄??洹좏삎??留욎떠 ?쒖??곸쑝濡??묒꽦??寃?";
    }

    let customGuide = customPrompt ? `[異붽? 吏?쒖궗?? ?뱁엳 ?ㅼ쓬 臾멸뎄瑜?諛섏쁺?섍굅???섏븰?ㅻ? ?뱀뿬以? "${customPrompt}"` : "";

    // ?쒖뒪???꾨＼?꾪듃 誘몄꽭 議곗젙 (Tuning) 媛?대뱶 諛섏쁺
    let tuningGuide = "";
    if (tuneNeisChk && tuneNeisChk.checked) {
        tuningGuide += "\n- **[NEIS 以??洹밸???**: 蹂몃Ц ?댁뿉 ?숈깮 ?대쫫, 二쇱뼱(?? '???숈깮?', '洹몃뒗')瑜??꾩쟾???쒖쇅?섍퀬 諛붾줈 ?됱쐞 ?ъ떎濡??쒖옉?섎ŉ, '?곗닔??, '李쎌쓽?곸엫' ?깆쓽 異붿긽???뺤슜?ъ쟻 ?됯?瑜?泥좎????앸왂?섏떗?쒖삤.";
    }
    if (tuneCareerChk && tuneCareerChk.checked) {
        tuningGuide += "\n- **[吏꾨줈 ??웾 媛뺥솕]**: ?쒕룞 ?댁슜???숈깮???숈뾽 吏꾨줈 ?щ쭩 諛?愿??援먭낵 ??웾怨??낆껜?곸쑝濡??곌퀎?섏뿬 ?숇Ц???깆옣 ?섏?媛 ?쒕윭?섎룄濡?媛以묒튂瑜??먯떗?쒖삤.";
    }
    if (tuneGrowthChk && tuneGrowthChk.checked) {
        tuningGuide += "\n- **[?숈뒿 ?깆옣 怨쇱젙 湲곗닠]**: ?숈깮??吏곷㈃?덈뜕 臾몄젣 ?곹솴?대굹 ?먭뎄 ?쇰뱶諛깆쓣 ?듯빐 ?대뼚???몃젰???듯빐 ?깆옣 諛?媛쒖꽑???대（?덈뒗吏 ?멸낵 愿怨?援ъ“濡??곸꽭??湲곗닠?섏떗?쒖삤.";
    }

    // Category specific builder
    if (activeCategory === 'subject') {
        const subjectName = subjectNameInput.value.trim() || "?대떦 怨쇰ぉ";
        categoryGoal = `?숆탳?앺솢湲곕줉遺??'怨쇰ぉ蹂??몃??λ젰 諛??밴린?ы빆(怨쇱꽭??'`;
        systemInstruction = `
        - 援먭낵紐? ${subjectName}
        - ?숈깮???섏뾽 李몄뿬 ?쒕룄, ?대떦 援먭낵???숈뾽???λ? 諛??깆랬, ?섑뻾?됯????먭뎄 蹂닿퀬???깆뿉??蹂댁뿬以 援ъ껜??臾몄젣?닿껐?κ낵 ?숈뒿???깆옣??珥덉젏??留욎텧 寃?
        - 援먭낵 ?쒕룞?먯꽌 ?쒖떆??媛쒕뀗???묒슜 ?λ젰?대굹 ?숇Ц??二쇰룄?깆쓣 援ъ껜?곸씤 ?ъ떎濡??쒖닠??寃?
        `;
        dateRule = "怨쇱꽭?뱀? ?좎쭨媛 ?녿뒗 ?쒕룞?대?濡? 湲 ?띿뿉 ?덈? ?좎쭨瑜??ｌ? 留?寃?";
    } else if (activeCategory === 'behavior') {
        categoryGoal = `?숆탳?앺솢湲곕줉遺??'?됰룞?뱀꽦 諛?醫낇빀?섍껄(?됰컻)'`;
        systemInstruction = `
        - ???숆린 ?먮뒗 ?????숈븞 愿李곕맂 ?숈깮???몄꽦(?묐룞, 諛곕젮, ?깆떎?? 媛덈벑 議곗쑉 ??, 由щ뜑?? ?앺솢 ?쒕룄 諛?愿怨꾩꽦 ?깆쓣 醫낇빀?곸쑝濡??꾩슦瑜?寃?
        - ?⑥닚 ?섏뿴???꾨땲???숈깮???몄꽦???μ젏怨??깆옣 怨쇱젙??援먯궗 異붿쿇?쒖쿂???곕쑜?섍퀬 ?좊ː???덇쾶 ?뱀븘?ㅻ룄濡???寃?
        `;
    } else {
        // Autonomous
        categoryGoal = `?숆탳?앺솢湲곕줉遺??'?먯쑉?쒕룞 ?밴린?ы빆'`;
        systemInstruction = `
        - ?숆툒 ?꾩썝 ?쒕룞, ?숆탳/?숆툒 ?뱀깋 ?됱궗, ?먯튂 ?좊줎??諛??덉쟾/?댄빐 援먯쑁 ?깆쓽 ?⑥껜 ?쒕룞 ?댁뿭???곴레 李몄뿬???쒕룄瑜?湲곕컲?쇰줈 ??
        - ?쒕룞???깆떎?섍쾶 李몄뿬???댁슜怨?洹멸쾬???숈깮???먯쑉??諛??묐룞?ъ뿉 湲곗뿬???ъ떎???좉린?곸쑝濡??곌껐??寃?
        - **?쒕룞蹂??쒖감 ?쒖닠 洹쒖튃 (?섏뿴 湲덉?)**: 臾몄옣 ?쒖옉 遺遺꾩뿉 諛곗젙??紐⑤뱺 ?쒕룞???? '?깊룺?μ삁諛⑷탳??3/31), ?꾨룞?숇?諛뤾??뺥룺?μ삁諛⑷탳??3/27), ?μ븷?댄빐援먯쑁(4/20)??李몄뿬?섏뿬...')???쇳몴濡??섏뿴?섍퀬 ?ㅼ뿉 ?ш큵?곸씤 ?쒖닠???곕뒗 諛⑹떇??**?덈? 湲덉?**?⑸땲??
        - 諛섎뱶??**[?쒕룞1(?좎쭨) + ?댁뿉 ???援ъ껜?곸씤 ?됰룞 ?댁슜 ?쒖닠 ???댁뼱???쒕룞2(?좎쭨) + ?댁뿉 ???援ъ껜?곸씤 ?됰룞 ?댁슜 ?쒖닠]** ???뺥깭濡?媛쒕퀎 ?쒕룞怨?洹몄뿉 留ㅼ묶?섎뒗 援ъ껜?곸씤 ?섑뻾 ?댁슜???쒖감?곸쑝濡??곌껐?섍쾶 ?묒꽦?섏떗?쒖삤.
        `;
        dateRule = "**?좎쭨 怨좎젙 洹쒖튃**: 諛곗젙???쒕룞 ?댁뿭???좎쭨(?? '(3/16)', '(5/15)')媛 議댁옱??寃쎌슦, 諛섎뱶??臾몄옣 ?댁뿉???대떦 ?쒕룞 紐낆묶 諛붾줈 ?ㅼ뿉 愿꾪샇 ?좎쭨瑜?洹몃?濡?遺숈뿬???묒꽦?섏떗?쒖삤 (?? '?숆탳??젰?덈갑援먯쑁(3/16)??李몄뿬?섏뿬', '?숆툒?먯튂?뚯쓽(4/10)??李몄뿬?섏뿬'). ?좎쭨瑜??덈? ??댁꽌 ?곌굅??'3??16?? ??, ?쒕룞 紐낆묶怨?遺꾨━?섍굅?? ?앸왂?섏? 留덉떗?쒖삤.";
    }

    // ?쒕룞 ?쒓렇 紐낆묶?먯꽌 '#' 湲고샇媛 ?덉쓣 寃쎌슦 ?꾨＼?꾪듃 ?꾨떖??諛곗뿴?먯꽌???쒓굅
    const cleanActivities = activities.map(act => act.replace(/^#/, ''));

    return `
    ?덈뒗 ??쒕?援?以묓븰援?怨좊벑?숆탳???꾨Ц?곸씠怨??듭같???덈뒗 ?댁엫 援먯궗 諛?援먭낵 ?대떦 援먯궗??
    ?꾨옒 二쇱뼱吏??뺣낫? 諛곗젙??援ъ껜???됰룞 諛??쒕룞 湲곕줉??醫낇빀?섏뿬, ?앺솢湲곕줉遺??湲곗옱?????덈뒗 踰뺤쟻 湲곗???留욌뒗 ${categoryGoal}????臾몃떒?쇰줈 ?묒꽦?댁쨾.

    [?묒꽦 ????뺣낫]
    - 諛곗젙???쒕룞/愿李??댁뿭: ${cleanActivities.join(", ")}
    ${systemInstruction}

    [?꾩닔 洹쒖튃 議곌굔]
    1. 二쇱뼱 諛??숈깮 ?대쫫 ?꾩쟾 諛곗젣:
       - **以묒슂**: 臾몄옣 蹂몃Ц ?띿뿉 ?숈깮???대쫫(?? "${studentName}", "?대쫫", "?숈깮" ????????踰덈룄 ?ъ슜?섏? 留?寃? 
       - 臾몄옣???쒖옉?????대쫫???앸왂?섍퀬, 諛붾줈 援ъ껜?곸씤 ?됰룞 ?ъ떎(?? '~??李몄뿬?섏뿬', '~瑜??ㅼ뒪濡??먭뎄?섏뿬')濡??먯뿰?ㅻ읇寃??쒖옉??寃?
    2. 泥좎????⑺듃 以묒떖 諛?異붿긽???댄쐶 諛곗젣:
       - '?곗닔??, '?곗뼱??, '湲곕???, '諛쒗쐶??, '李쎌쓽?곸엫', '?좎옱??, '?곗뼱??由щ뜑??, '?뚮??? ?깆쓽 二쇨??곸씠怨?異붿긽?곸씤 李ъ궗??六뷀븳 誘몄궗?ш뎄??泥좎???諛곗젣??寃?
       - ?ㅼ쭅 ?숈깮???쒕룞?먯꽌 ?섑뻾??援ъ껜?곸씤 ?됱쐞 ?⑺듃(?? ?섑뻾?됯? 二쇱젣濡?臾댁뾿??諛쒗몴?? ?대뼡 蹂닿퀬?쒕? ?묒꽦?? 移쒓뎄?ㅼ쓽 ?섍껄???대뼸寃?議곗쑉????? 洹몄뿉 ?곕Ⅸ 援ъ껜??蹂???묒긽留뚯쓣 嫄댁“?섍퀬 媛앷??곸쑝濡??쒖닠??寃?
    3. 臾몃㎘怨??댁“:
       - ${toneGuide}
       - ?대? 醫낃껐? 諛섎뱶????쒕?援?NEIS 湲곗옱 洹쒓꺽??留욎떠 媛쒖“??醫낃껐?대???'~??', '~蹂댁엫.', '~?ㅼ쭚??', '~?몃젰??', '~湲곗뿬??' ?깆쑝濡??듭씪??寃?(議대뙎留먯씠???먯꽭?댁껜 ?덈? 湲덉?).
    4. 遺꾨웾 諛?媛?낆꽦:
       - ${lengthGuide}
    5. ?몃? 洹쒓꺽:
       - ${dateRule}
       - ${customGuide}
       ${tuningGuide}
    6. **?쒕룞 諛??몃??댁슜 ?쒖감???꾧컻 (?⑥닚 ?섏뿴 湲덉?)**:
       - ?낅젰??諛곗젙 ?쒕룞???? ?쒕룞A, ?쒕룞B)??臾몄옣 泥섏쓬???쇳몴(,)濡?臾띠뼱 ?쇨큵 ?섏뿴?섏? 留덉떗?쒖삤. (?? "?쒕룞A, ?쒕룞B???곴레 李몄뿬?? -> ?덈? 湲덉?)
       - **諛섎뱶??[?쒕룞A + ?쒕룞A??援ъ껜???댁슜 ???댁뼱???쒕룞B + ?쒕룞B??援ъ껜???댁슜]**??援ъ“濡? 媛??쒕룞???멸툒???뚮쭏??洹몄뿉 ?곌퀎???숈깮??援ъ껜?곸씤 ?됰룞 ?⑺듃? ?몃젰 怨쇱젙???곕떖???묒꽦?섍쾶 ?섏떗?쒖삤.
       - **# 湲고샇 湲덉?**: 臾몄옣 ?쒖닠 怨쇱젙?먯꽌 ?쒕룞 紐낆묶???몄슜?섍굅???멸툒???? ?댁떆?쒓렇 湲고샇 '#'???덈?濡??곸? 留덉떗?쒖삤. (?? '#?숆탳??젰?덈갑援먯쑁' -> '?숆탳??젰?덈갑援먯쑁')
    7. 異쒕젰 ?뺤떇 諛???웾 ?댁떆?쒓렇 異붿텧:
       - ?대뼚???몄궗留먯씠???쒕줎, 遺?곗꽕紐낅룄 ?덈? ?ы븿?섏? 留덉떗?쒖삤.
       - **以묒슂**: 臾몃떒 蹂몃Ц ?묒꽦???꾩쟾??留덉튇 ?? 留?留덉?留?以꾩뿉 ??踰?媛쒗뻾(\n)???섍퀬 ?ㅼ쓬 ?뺤떇???꾧꺽??以?섑븯???숈깮?먭쾶 媛??遺?⑺븯???듭떖??웾 ?댁떆?쒓렇 3媛쒕? 愿꾪샇 ?뺥깭濡?諛섎뱶??異쒕젰?섏떗?쒖삤: [??웾?ㅼ썙?? #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??] (?? [??웾?ㅼ썙?? #?섑븰?곷え?몃쭅, #二쇰룄?? #諛곗??섎닎]). ???몄쓽 ?ㅻ챸湲? ?덈? ?㏓텤?댁? 留덉떗?쒖삤.
    `;
}

async function fetchGeminiRecord(apiKey, model, prompt, attempt = 1) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const maxRetries = 3;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (response.status === 429) {
            if (attempt <= maxRetries) {
                const waitTime = attempt * 5; 
                progressStatus.textContent = `⚠️ 서버 혼잡(429). ${waitTime}초 후 재시도합니다... (시도 ${attempt}/${maxRetries})`;
                await delay(waitTime * 1000);
                return await fetchGeminiRecord(apiKey, model, prompt, attempt + 1);
            } else {
                throw new Error("서버 과부하가 지속되어 재시도 횟수를 초과했습니다.");
            }
        }

        if (!response.ok) {
            throw new Error(`API 오류 (응답 코드: ${response.status})`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        if (attempt <= maxRetries) {
            await delay(2000);
            return await fetchGeminiRecord(apiKey, model, prompt, attempt + 1);
        }
        throw error;
    }
}

// ==========================================================================
// 8. Batch Generation Engine (Run)
// ==========================================================================
async function generateBatchRecords() {
    if (isGenerating) return;

    const apiKey = apiKeyInput.value.trim();
    const namesText = studentNamesInput.value.trim();
    const selectedModel = modelSelect.value;
    const selectedLength = lengthSelect.value;
    const selectedTone = toneSelect.value;
    const customPrompt = customPromptInput.value.trim();

    // 1. Validations
    if (!apiKey) { alert("Gemini API Key를 입력해주세요!"); return; }
    if (!namesText) { alert("학생 명단을 입력해주세요!"); return; }
    
    if (activeCategory === 'subject') {
        const subjectName = subjectNameInput.value.trim();
        if (!subjectName) {
            alert("과세특 작성을 위해 '대상 교과/과목명'을 입력해주세요!");
            subjectNameInput.focus();
            return;
        }
        localStorage.setItem('subject_name_v8', subjectName);
    }

    const names = namesText.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) { alert("유효한 학생 이름이 없습니다."); return; }

    let baseActivities = [];
    const checkedBoxes = document.querySelectorAll('#checkbox-grid input[type="checkbox"]:checked');
    checkedBoxes.forEach(cb => baseActivities.push(cb.value));

    if (baseActivities.length < 2) {
        alert("랜덤 배정을 위해 활동 목록 중 최소 2개 이상을 체크해 주세요!");
        return;
    }

    // Save common configurations
    if (saveKeyChk.checked) {
        localStorage.setItem('gemini_api_key_v8', apiKey);
    } else {
        localStorage.removeItem('gemini_api_key_v8');
    }
    localStorage.setItem('gemini_model_v8', selectedModel);

    // 2. UI Setup for Progress
    isGenerating = true;
    generateBtn.disabled = true;
    progressContainer.classList.remove('hidden');
    resultTbody.innerHTML = '';
    globalResults = [];

    // 3. Batch Process Loop
    for (let i = 0; i < names.length; i++) {
        const studentName = names[i];
        
        // Random pick 2 or 3 activities (cap to pool length if small)
        let numToPick = Math.floor(Math.random() * 2) + 2; 
        if (baseActivities.length <= 2) {
            numToPick = baseActivities.length;
        }
        let shuffled = [...baseActivities].sort(() => 0.5 - Math.random());
        let studentActivities = shuffled.slice(0, numToPick);

        // Update progress status
        const progressVal = Math.round((i / names.length) * 100);
        progressBarFill.style.width = `${progressVal}%`;
        progressPercent.textContent = `${progressVal}% 완료`;
        progressStatus.textContent = `⏳ [${i + 1}/${names.length}] ${studentName} 학생 생기부 생성 중...`;
        generateBtn.innerText = `⏳ 작성 중... [${i + 1} / ${names.length}]`;

        const promptText = buildPrompt(studentName, studentActivities, selectedTone, selectedLength, customPrompt);
        
        let recordText = "";
        let isSuccess = false;

        try {
            recordText = await fetchGeminiRecord(apiKey, selectedModel, promptText);
            isSuccess = true;
        } catch (error) {
            console.error(error);
            recordText = `생성 실패: ${error.message}`;
        }

        // Add to result arrays
        globalResults.push({
            name: studentName,
            activities: studentActivities,
            record: recordText
        });

        // Insert row to UI
        appendResultRow(studentName, studentActivities, recordText, globalResults.length - 1, isSuccess);

        // Throttle 3 seconds between requests to maintain stability
        if (i < names.length - 1) {
            await delay(3000);
        }
    }

    // 4. Finalize UI
    progressBarFill.style.width = '100%';
    progressPercent.textContent = '100% 완료';
    progressStatus.textContent = '🎉 모든 학생의 특기사항 생성이 완료되었습니다!';
    
    generateBtn.innerText = "🤖 명단 일괄 생성 시작";
    generateBtn.disabled = false;
    isGenerating = false;
    
    alert("일괄 생성이 완료되었습니다! 저장 및 복사 기능을 활용해 주세요.");
}

// ==========================================================================
// 9. Result Table Row Builders & Event Bindings
// ==========================================================================
function appendResultRow(name, activities, recordText, rowIndex, isSuccess) {
    // If it is the first row, clear empty placeholder
    const firstRow = resultTbody.querySelector('.empty-state');
    if (firstRow) {
        resultTbody.innerHTML = '';
    }

    // AI 결과 텍스트에서 [역량키워드/핵심역량/핵심 역량: ...] 부분 파싱 및 추출 (다양한 변종 대응)
    let extractedKeywords = [];
    let cleanRecordText = recordText;
    const keywordRegex = /\[(?:역량키워드|핵심역량|핵심\s*역량|역량\s*키워드):\s*([^\]]+)\]/i;
    const match = recordText.match(keywordRegex);
    if (match) {
        extractedKeywords = match[1].split(',')
            .map(k => k.trim())
            .filter(k => k !== '')
            .map(k => k.startsWith('#') ? k : '#' + k);
        cleanRecordText = recordText.replace(keywordRegex, '').trim();
    }
    
    // 본문용 텍스트 동기화
    globalResults[rowIndex].record = cleanRecordText;

    const tr = document.createElement('tr');
    tr.id = `row-${rowIndex}`;

    const tagsHTML = activities.map(act => `<span class="tag">${act}</span>`).join('');
    
    // 파싱된 키워드 해시태그 HTML 빌드
    const keywordsHTML = extractedKeywords.map(k => `<span class="extracted-keyword-badge">${k}</span>`).join('');

    tr.innerHTML = `
        <td class="col-name">${name}</td>
        <td>
            <div class="tags-wrapper">${tagsHTML}</div>
            <div class="extracted-keywords-wrapper" id="keywords-wrapper-${rowIndex}">
                ${keywordsHTML || '<span style="color:var(--text-muted); font-size:0.72rem; font-style:italic;">💡 AI가 추출한 핵심 역량이 여기에 표시됩니다.</span>'}
            </div>
            <div class="record-editor-grid" contenteditable="${isSuccess}" id="editor-${rowIndex}">${cleanRecordText}</div>
            
            <!-- 실시간 기재 금지어 경고 배지 -->
            <div class="forbidden-warning-badge hidden" id="forbidden-badge-${rowIndex}">
                ⚠️ NEIS 기재 금지어 검출: <span id="forbidden-words-${rowIndex}" style="text-decoration:underline;"></span>
            </div>
            
            <div class="row-action-bar">
                <!-- 바이트 게이지바 UI -->
                <div class="byte-counter-wrapper">
                    <span class="byte-text" id="byte-txt-${rowIndex}">0 / 1500 Byte</span>
                    <div class="byte-gauge-container">
                        <div class="byte-gauge-fill" id="byte-fill-${rowIndex}"></div>
                    </div>
                </div>
                <div class="row-actions">
                    <button class="btn-inline-action btn-row-copy" data-index="${rowIndex}">📋 복사</button>
                    <div class="action-wrapper">
                        <button class="btn-inline-action btn-row-spell" data-index="${rowIndex}">🔍 AI 윤문</button>
                    </div>
                    <button class="btn-inline-action btn-row-regen" data-index="${rowIndex}" ${!isSuccess ? 'style="border-color:var(--accent-red); color:var(--accent-red);"' : ''}>🔄 재생성</button>
                </div>
            </div>
        </td>
    `;

    const editor = tr.querySelector('.record-editor-grid');
    
    // 실시간 바이트 및 금지어 피드백 갱신 바인딩
    editor.addEventListener('input', () => {
        const text = editor.innerText;
        globalResults[rowIndex].record = text; // sync text changes
        updateRecordFeedback(rowIndex, text);
    });

    // Bind Inline Actions (Copy / Spell Check / Regenerate)
    tr.querySelector('.btn-row-copy').addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        copyIndividualRecord(idx, e.target);
    });

    tr.querySelector('.btn-row-spell').addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = e.target.getAttribute('data-index');
        showRewritePopover(idx, e.target);
    });

    tr.querySelector('.btn-row-regen').addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        regenerateOneRecord(idx);
    });

    resultTbody.appendChild(tr);
    
    // 초기 피드백 렌더링 호출
    updateRecordFeedback(rowIndex, cleanRecordText);
}

// 실시간 바이트 수, 게이지바 및 금지어 검증 피드백 갱신 로직
function updateRecordFeedback(rowIndex, text) {
    const byteTxt = document.getElementById(`byte-txt-${rowIndex}`);
    const byteFill = document.getElementById(`byte-fill-${rowIndex}`);
    const forbiddenBadge = document.getElementById(`forbidden-badge-${rowIndex}`);
    const forbiddenWordsSpan = document.getElementById(`forbidden-words-${rowIndex}`);
    
    if (!byteTxt || !byteFill) return;
    
    // 1. NEIS 기준 바이트 계산 및 표시
    const currentBytes = getNeisBytes(text);
    const maxBytes = 1500; // NEIS 입력 한도 기준값
    byteTxt.textContent = `글자 수: ${text.length}자 (${currentBytes} / ${maxBytes} Byte)`;
    
    // 게이지 비율 계산
    const percent = Math.min((currentBytes / maxBytes) * 100, 100);
    byteFill.style.width = `${percent}%`;
    
    // 바이트 용량에 따른 게이지바 색상 등급 설정
    byteFill.classList.remove('warning', 'danger');
    byteTxt.style.color = "var(--text-secondary)";
    
    if (currentBytes >= maxBytes) {
        byteFill.classList.add('danger');
        byteTxt.style.color = "var(--accent-red)";
        byteTxt.textContent += " ⚠️ NEIS 한도 초과!";
    } else if (currentBytes >= maxBytes * 0.85) {
        byteFill.classList.add('warning');
        byteTxt.style.color = "#f59e0b";
        byteTxt.textContent += " ⚠️ NEIS 마감 임박";
    }
    
    // 2. 기재 금지어 실시간 필터 검증
    const forbiddenList = checkForbiddenWords(text);
    if (forbiddenList.length > 0) {
        forbiddenWordsSpan.textContent = forbiddenList.join(', ');
        forbiddenBadge.classList.remove('hidden');
    } else {
        forbiddenBadge.classList.add('hidden');
    }
}

// AI 윤문 선택 팝오버 메뉴 생성 및 띄우기
function showRewritePopover(index, btnElement) {
    // 기존에 활성화된 팝오버 제거
    const oldPopover = document.querySelector('.rewrite-popover');
    if (oldPopover) oldPopover.remove();

    const popover = document.createElement('div');
    popover.className = 'rewrite-popover';
    popover.innerHTML = `
        <button class="rewrite-option" data-mode="spell">🔍 맞춤법 및 문장 교정</button>
        <button class="rewrite-option" data-mode="shorten">📏 문장 길이 축소 (약 20%)</button>
        <button class="rewrite-option" data-mode="expand">➕ 활동 구체화 (글자 수 확장)</button>
        <button class="rewrite-option" data-mode="professional">🎓 전문 학업 어휘로 변환</button>
    `;

    // 팝오버를 버튼 감싸는 래퍼에 추가
    btnElement.parentElement.appendChild(popover);

    // 각 메뉴 항목 클릭 이벤트 바인딩
    popover.querySelectorAll('.rewrite-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            const mode = e.target.getAttribute('data-mode');
            popover.remove();
            rewriteSentence(index, mode, btnElement);
        });
    });
}

// ==========================================================================
// 10. Single Row Operations (Copy & Regenerate)
// ==========================================================================
async function copyIndividualRecord(index, btnElement) {
    const text = globalResults[index].record;
    try {
        await navigator.clipboard.writeText(text);
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = "✓ 완료";
        btnElement.style.color = "var(--accent-emerald)";
        btnElement.style.borderColor = "var(--accent-emerald)";
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.color = "";
            btnElement.style.borderColor = "";
        }, 1500);
    } catch (err) {
        alert("클립보드 복사에 실패했습니다. 수동으로 복사해 주세요.");
    }
}

async function regenerateOneRecord(index) {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;
    const selectedLength = lengthSelect.value;
    const selectedTone = toneSelect.value;
    const customPrompt = customPromptInput.value.trim();

    if (!apiKey) { alert("Gemini API Key가 누락되었습니다!"); return; }
    
    const student = globalResults[index];
    const editor = document.getElementById(`editor-${index}`);
    const regenBtn = document.querySelector(`#row-${index} .btn-row-regen`);
    
    if (editor.getAttribute('contenteditable') === 'false' && isGenerating) return;

    // UI Feedback for single reload
    editor.setAttribute('contenteditable', 'false');
    const originalText = editor.innerText;
    editor.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">⏳ 새로운 내용을 불러오는 중...</span>`;
    regenBtn.disabled = true;
    regenBtn.textContent = "⏳ 진행중";

    const promptText = buildPrompt(student.name, student.activities, selectedTone, selectedLength, customPrompt);
    
    try {
        const recordText = await fetchGeminiRecord(apiKey, selectedModel, promptText);
        
        // AI 결과 텍스트에서 [역량키워드/핵심역량/핵심 역량: ...] 부분 파싱 및 추출 (다양한 변종 대응)
        let extractedKeywords = [];
        let cleanRecordText = recordText;
        const keywordRegex = /\[(?:역량키워드|핵심역량|핵심\s*역량|역량\s*키워드):\s*([^\]]+)\]/i;
        const match = recordText.match(keywordRegex);
        if (match) {
            extractedKeywords = match[1].split(',')
                .map(k => k.trim())
                .filter(k => k !== '')
                .map(k => k.startsWith('#') ? k : '#' + k);
            cleanRecordText = recordText.replace(keywordRegex, '').trim();
        }
        
        // Update states and view
        student.record = cleanRecordText;
        editor.innerText = cleanRecordText;
        editor.setAttribute('contenteditable', 'true');
        
        // 키워드 배지 영역 업데이트
        const kwWrapper = document.getElementById(`keywords-wrapper-${index}`);
        if (kwWrapper) {
            kwWrapper.innerHTML = extractedKeywords.map(k => `<span class="extracted-keyword-badge">${k}</span>`).join('') || 
                '<span style="color:var(--text-muted); font-size:0.72rem; font-style:italic;">💡 AI가 추출한 핵심 역량이 여기에 표시됩니다.</span>';
        }
        
        updateRecordFeedback(index, cleanRecordText);
        
    } catch (error) {
        alert(`재생성 실패: ${error.message}`);
        editor.innerText = originalText;
        editor.setAttribute('contenteditable', 'true');
        updateRecordFeedback(index, originalText);
    } finally {
        regenBtn.disabled = false;
        regenBtn.textContent = "🔄 재생성";
    }
}

async function rewriteSentence(index, mode, btnElement) {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!apiKey) { alert("Gemini API Key가 누락되었습니다!"); return; }

    const student = globalResults[index];
    const editor = document.getElementById(`editor-${index}`);
    
    if (editor.getAttribute('contenteditable') === 'false' && isGenerating) return;

    editor.setAttribute('contenteditable', 'false');
    const originalText = editor.innerText.trim();
    
    if (!originalText || originalText.startsWith("생성 실패:")) {
        alert("윤문할 문장이 올바르지 않습니다.");
        editor.setAttribute('contenteditable', 'true');
        return;
    }

    btnElement.disabled = true;
    const originalBtnText = btnElement.textContent;
    btnElement.textContent = "⏳ 처리중";

    let modePrompt = "";
    switch(mode) {
        case "shorten":
            modePrompt = "제시된 문맥의 핵심 행위 팩트는 그대로 유지하되, 군더더기 서술을 압축하여 원본 대비 분량을 약 20% 축소해서 깔끔하게 다듬어줘.";
            break;
        case "expand":
            modePrompt = "제시된 문맥의 팩트 골격을 훼손하지 않으면서, 학생의 행동 역량 및 관찰된 태도 묘사를 훨씬 다채롭고 구체적으로 확장하여 풍성하게 채워줘.";
            break;
        case "professional":
            modePrompt = "교육부 학교생활기록부 기재 가이드에 맞게 격조 높은 교육용 표준 학술 용어와 교과 전문 어휘를 적절히 반영하여 매우 신뢰감 있고 기품 있는 문장으로 변환해줘.";
            break;
        default:
            modePrompt = "문장의 오탈자, 맞춤법, 띄어쓰기 오류를 정확히 바로잡고 자연스럽게 윤문해줘.";
    }

    const promptText = `
    너는 대한민국 학교생활기록부 기재 요령과 한국어 문장 교정에 정통한 최고 권위의 교육 전문 윤문가야.
    아래 지시 조건에 맞춰 입력된 생기부 문장을 완벽하게 교정 및 변경해줘.

    [작성 및 교정 조건]
    1. 지침: ${modePrompt}
    2. 어미 종결 보존: 대한민국 NEIS 규격에 부합하도록 개조식 종결어미인 '~함.', '~보임.', '~노력함.', '~기여함.' 등으로 완벽히 문맥을 마쳐줘. (에세이체 절대 금지).
    3. 날짜 및 형식 보존: 문장 속 괄호 날짜(예: '(5/15)') 및 팩트 항목은 절대 생략하거나 임의로 다른 날짜로 바꾸지 말 것.
    4. 이름 제외 보존: 문장 본문 내에 학생의 이름이나 주어(예: '이 학생은', '그는')가 노출되지 않아야 함.
    5. 출력 형식: 윤문된 최종 텍스트 결과물만 출력해야 하며, 설명이나 앞뒤 인사는 절대 포함하지 마십시오.
       **매우 중요**: 문단 작성 완료 후, 반드시 맨 끝에 개행을 하고 핵심역량 해시태그 3개를 괄호 형태로 첨부해주십시오: [역량키워드: #키워드1, #키워드2, #키워드3]

    [대상 문장]
    "${originalText}"
    `;

    try {
        const correctedText = await fetchGeminiRecord(apiKey, selectedModel, promptText);
        
        // AI 결과 텍스트에서 [역량키워드/핵심역량/핵심 역량: ...] 부분 파싱 및 추출 (다양한 변종 대응)
        let extractedKeywords = [];
        let cleanCorrectedText = correctedText;
        const keywordRegex = /\[(?:역량키워드|핵심역량|핵심\s*역량|역량\s*키워드):\s*([^\]]+)\]/i;
        const match = correctedText.match(keywordRegex);
        if (match) {
            extractedKeywords = match[1].split(',')
                .map(k => k.trim())
                .filter(k => k !== '')
                .map(k => k.startsWith('#') ? k : '#' + k);
            cleanCorrectedText = correctedText.replace(keywordRegex, '').trim();
        }
        
        // Update states and view
        student.record = cleanCorrectedText;
        editor.innerText = cleanCorrectedText;
        
        // 키워드 배지 영역 업데이트
        const kwWrapper = document.getElementById(`keywords-wrapper-${index}`);
        if (kwWrapper) {
            kwWrapper.innerHTML = extractedKeywords.map(k => `<span class="extracted-keyword-badge">${k}</span>`).join('') || 
                '<span style="color:var(--text-muted); font-size:0.72rem; font-style:italic;">💡 AI가 추출한 핵심 역량이 여기에 표시됩니다.</span>';
        }
        
        updateRecordFeedback(index, cleanCorrectedText);

        // Success Feedback
        btnElement.textContent = "✓ 완료";
        setTimeout(() => {
            btnElement.textContent = originalBtnText;
        }, 1500);

    } catch (error) {
        alert(`AI 윤문 가동 실패: ${error.message}`);
        editor.innerText = originalText;
        btnElement.textContent = originalBtnText;
        updateRecordFeedback(index, originalText);
    } finally {
        btnElement.disabled = false;
        editor.setAttribute('contenteditable', 'true');
    }
}

// ==========================================================================
// 11. Global Action Functions (Export Excel & Copy All)
// ==========================================================================
async function copyAllToClipboard() {
    if (globalResults.length === 0) {
        alert("복사할 결과물이 없습니다. 먼저 생성 버튼을 눌러주세요.");
        return;
    }

    let allText = "";
    globalResults.forEach(item => {
        allText += `[${item.name}]\n${item.record}\n\n`;
    });

    try {
        await navigator.clipboard.writeText(allText.trim());
        const originalText = copyAllBtn.textContent;
        copyAllBtn.textContent = "✓ 전체 클립보드 복사 완료!";
        copyAllBtn.style.backgroundColor = "var(--accent-emerald)";
        copyAllBtn.style.color = "#ffffff";
        setTimeout(() => {
            copyAllBtn.textContent = originalText;
            copyAllBtn.style.backgroundColor = "";
            copyAllBtn.style.color = "";
        }, 2000);
    } catch (err) {
        alert("전체 복사에 실패했습니다. 수동으로 복사해 주세요.");
    }
}

function exportToExcel() {
    if (globalResults.length === 0) {
        alert("다운로드할 결과물이 없습니다.");
        return;
    }

    let filename = "생기부_일괄생성.xls";
    if (activeCategory === 'subject') {
        const subj = subjectNameInput.value.trim() || "교과";
        filename = `과세특_${subj}_일괄생성.xls`;
    } else if (activeCategory === 'behavior') {
        filename = "행동특성_종합의견_일괄생성.xls";
    } else {
        filename = "자율활동_특기사항_일괄생성.xls";
    }

    // HTML Table template for Excel with width and wrap styling
    let excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta charset="utf-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>생기부 결과</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      table { border-collapse: collapse; table-layout: fixed; width: 1050px; }
      td, th { border: 0.5pt solid #cccccc; padding: 6px; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 10pt; vertical-align: top; }
      th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
      .col-name { width: 80px; }
      .col-activities { width: 270px; }
      .col-record { width: 700px; }
      .text-wrap { white-space: normal; word-wrap: break-word; mso-number-format: "\\@"; }
    </style>
    </head>
    <body>
    <table>
      <thead>
        <tr>
          <th class="col-name">이름</th>
          <th class="col-activities">배정활동</th>
          <th class="col-record">특기사항 내용</th>
        </tr>
      </thead>
      <tbody>
    `;

    globalResults.forEach(row => {
        // Replace newlines with same-cell break for Excel line breaks
        let activitiesHtml = row.activities.join("<br style='mso-data-placement:same-cell;'/>");
        let recordHtml = row.record.replace(/\n/g, "<br style='mso-data-placement:same-cell;'/>");
        
        excelHtml += `
          <tr>
            <td class="text-wrap">${row.name}</td>
            <td class="text-wrap">${activitiesHtml}</td>
            <td class="text-wrap">${recordHtml}</td>
          </tr>
        `;
    });

    excelHtml += `
      </tbody>
    </table>
    </body>
    </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================================================
// 12. Premium Extended Functions (Find/Replace & History Dashboard)
// ==========================================================================

// 일괄 찾아바꾸기 (Find & Replace)
function replaceAllTexts() {
    if (globalResults.length === 0) {
        alert("치환할 결과가 없습니다. 먼저 생기부를 생성해 주세요.");
        return;
    }
    
    const findText = findTxtInput.value;
    const replaceText = replaceTxtInput.value;
    
    if (!findText) {
        alert("찾을 단어를 입력해주세요!");
        findTxtInput.focus();
        return;
    }
    
    if (!confirm(`전체 학생 결과물에서 "${findText}"을(를) "${replaceText}"(으)로 일괄 변경하시겠습니까?`)) {
        return;
    }
    
    let replaceCount = 0;
    
    globalResults.forEach((student, index) => {
        const regex = new RegExp(escapeRegExp(findText), 'g');
        if (student.record.includes(findText)) {
            const updatedRecord = student.record.replace(regex, replaceText);
            student.record = updatedRecord;
            replaceCount++;
            
            // UI 에디터 및 카운터 반영
            const editor = document.getElementById(`editor-${index}`);
            if (editor) {
                editor.innerText = updatedRecord;
                updateRecordFeedback(index, updatedRecord);
            }
        }
    });
    
    alert(`총 ${replaceCount}명의 학생 결과물이 치환되었습니다.`);
    findTxtInput.value = '';
    replaceTxtInput.value = '';
}

// 정규식 특수문자 이스케이프 유틸리티
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 현재 세션 이력을 기록 보관소에 저장
function saveCurrentSessionToHistory() {
    if (globalResults.length === 0) {
        alert("보관할 데이터가 없습니다. 먼저 생기부를 일괄 생성해주세요!");
        return;
    }
    
    const sessionName = activeCategory === 'subject' 
        ? `${subjectNameInput.value.trim() || '미지정 교과'} 과세특` 
        : (activeCategory === 'behavior' ? '행동특성 및 종합의견' : '자율활동 특기사항');
        
    const timestamp = new Date().toLocaleString('ko-KR');
    
    const newSession = {
        id: Date.now(),
        date: timestamp,
        category: activeCategory,
        subjectName: subjectNameInput.value.trim(),
        sessionName: sessionName,
        studentCount: globalResults.length,
        studentNames: studentNamesInput.value,
        options: {
            model: modelSelect.value,
            length: lengthSelect.value,
            tone: toneSelect.value,
            customPrompt: customPromptInput.value,
            tuneNeis: tuneNeisChk ? tuneNeisChk.checked : false,
            tuneCareer: tuneCareerChk ? tuneCareerChk.checked : false,
            tuneGrowth: tuneGrowthChk ? tuneGrowthChk.checked : false
        },
        results: globalResults
    };
    
    let history = JSON.parse(localStorage.getItem('eduwrite_history_v8')) || [];
    history.unshift(newSession); // 최신 보관 내역이 제일 먼저 오도록
    localStorage.setItem('eduwrite_history_v8', JSON.stringify(history));
    
    alert("💾 현재 생성 세션이 로컬 기록 보관소에 안전하게 저장되었습니다!");
}

// 보관소 대시보드 카드 렌더링
function renderHistoryDashboard() {
    historyCardGrid.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('eduwrite_history_v8')) || [];
    
    if (history.length === 0) {
        historyCardGrid.innerHTML = `
            <div class="empty-dashboard">
                <p>아직 보관된 기록이 없습니다. 생기부를 생성한 후 보관소에 저장해 보세요!</p>
            </div>
        `;
        return;
    }
    
    history.forEach((session, index) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        let catText = "자율활동";
        let catClass = "autonomous";
        if (session.category === 'subject') {
            catText = "과세특";
            catClass = "subject";
        } else if (session.category === 'behavior') {
            catText = "행발";
            catClass = "behavior";
        }
        
        // 대표 학생 일부 프리뷰
        const sampleStudents = session.results.slice(0, 3).map(r => r.name).join(', ');
        const suffix = session.results.length > 3 ? ' 외' : '';
        
        card.innerHTML = `
            <div class="card-meta">
                <span class="card-date">${session.date}</span>
                <span class="card-category-badge ${catClass}">${catText}</span>
            </div>
            <h3 class="card-title">${session.sessionName}</h3>
            <div class="card-info-row">
                <div class="card-info-item">👤 ${session.studentCount}명</div>
                <div class="card-info-item">⚙️ ${session.options.model.replace('gemini-', '')}</div>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 4px;">
                <strong>학생:</strong> ${sampleStudents}${suffix}
            </p>
            <div class="card-footer-actions">
                <button class="btn-card-load" data-index="${index}">📂 불러오기</button>
                <button class="btn-card-delete" data-index="${index}">🗑️ 삭제</button>
            </div>
        `;
        
        // 카드 내 액션 바인딩
        card.querySelector('.btn-card-load').addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            loadSessionFromHistory(idx);
        });
        
        card.querySelector('.btn-card-delete').addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            deleteSessionFromHistory(idx);
        });
        
        historyCardGrid.appendChild(card);
    });
}

// 보관소 히스토리에서 데이터 가져와 현재 상태 복구
function loadSessionFromHistory(index) {
    const history = JSON.parse(localStorage.getItem('eduwrite_history_v8')) || [];
    const session = history[index];
    
    if (!session) return;
    
    if (!confirm("⚠️ 기록을 불러오면 현재 작성 중인 설정 및 결과물이 모두 유실됩니다. 그래도 진행하시겠습니까?")) {
        return;
    }
    
    // 1. 카테고리 전환 및 탭 액티브 제어
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-category') === session.category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 2. 카테고리 상태 설정
    activeCategory = session.category;
    if (activeCategory === 'subject') {
        subjectNameGroup.classList.remove('hidden');
        subjectNameInput.value = session.subjectName || '';
    } else {
        subjectNameGroup.classList.add('hidden');
    }
    
    // 3. 인풋 값 복구
    studentNamesInput.value = session.studentNames || '';
    updateStudentCount();
    
    modelSelect.value = session.options.model || 'gemini-2.5-flash';
    lengthSelect.value = session.options.length || 'medium';
    toneSelect.value = session.options.tone || 'default';
    customPromptInput.value = session.options.customPrompt || '';
    
    if (tuneNeisChk) tuneNeisChk.checked = session.options.tuneNeis || false;
    if (tuneCareerChk) tuneCareerChk.checked = session.options.tuneCareer || false;
    if (tuneGrowthChk) tuneGrowthChk.checked = session.options.tuneGrowth || false;
    
    // 4. 결과 테이블 복구
    globalResults = session.results || [];
    resultTbody.innerHTML = '';
    
    if (globalResults.length > 0) {
        globalResults.forEach((student, rIdx) => {
            appendResultRow(student.name, student.activities, student.record, rIdx, true);
        });
        
        // 완료율 배지 업데이트
        progressContainer.classList.add('hidden');
        progressBarFill.style.width = '100%';
        progressPercent.textContent = '100% 완료';
    } else {
        resultTbody.innerHTML = `
            <tr>
                <td colspan="2" class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>생성 버튼을 누르면 실시간으로 결과가 이곳에 채워집니다.</p>
                </td>
            </tr>
        `;
    }
    
    // 5. 체크박스(태그) UI 렌더링
    renderCheckboxes();
    
    // 6. 생성기 뷰로 자동 탭 전환
    switchView('generator');
    alert("📂 보관 기록이 성공적으로 로드되었습니다!");
}

// 보관소 히스토리에서 이력 개별 삭제
function deleteSessionFromHistory(index) {
    let history = JSON.parse(localStorage.getItem('eduwrite_history_v8')) || [];
    
    if (!confirm("🗑️ 이 보관 기록을 영구히 삭제하시겠습니까?")) {
        return;
    }
    
    history.splice(index, 1);
    localStorage.setItem('eduwrite_history_v8', JSON.stringify(history));
    
    renderHistoryDashboard();
}
