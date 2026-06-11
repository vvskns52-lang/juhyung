// ==========================================================================
// 1. Initial State, Default Data & Configuration
// ==========================================================================
const defaultAutonomousActivities = [
    "학급 임원 활동 (1학기)",
    "학교폭력예방교육 (3/16)",
    "장애이해교육 (4/20)",
    "감사의 날 (5/6)",
    "학급별 특색활동 (5/26)",
    "학급자치회의 (4/10)"
];

const defaultSubjectActivities = [
    "교과 수행평가 연계 주제 발표 및 질의응답",
    "수업 내용 관련 심화 탐구 보고서 작성 및 제출",
    "실생활 속 수학/과학적 원리 발견 및 사례 분석",
    "자기주도적인 오답 원인 분석 및 피드백 노트 작성",
    "교과 연계 독서 활동 및 도서 비평문 작성",
    "모둠 협력 프로젝트에서의 아이디어 제시 및 조율",
    "어려운 개념을 시각화한 학습용 개념 맵 제작",
    "교과 학습 멘토로서 배움이 느린 급우 지원",
    "창의적이고 대안적인 문제 풀이 방식 발표",
    "교과 연계 시사 이슈 분석 및 비판적 논평 작성",
    "수업 시간 중 적극적인 질문 및 배움 일지 작성",
    "실험 설계 및 관찰 일지 중심 보고서 작성"
];

const defaultBehaviorActivities = [
    "학급 교실 환경 정화 및 비품 관리 솔선수범",
    "모둠 및 조별 활동 시 갈등 조율 및 조력자 역할 수행",
    "어려움을 겪는 급우를 돕는 학습 멘토링 활동",
    "학급 자치 규칙의 철저한 준수 및 성실한 생활 태도",
    "체육대회 및 축제 등 학급 공동 행사 적극 지원 및 단합 유도",
    "바르고 예의 있는 자세로 교사 및 학급원과 소통",
    "소외된 친구에게 먼저 다가가는 친화력과 배려심 발휘",
    "시간 약속 및 약속 준수를 바탕으로 한 높은 신뢰감 형성",
    "학급 자치 회의 시 타인의 의견 경청 및 민주적 조율 기여",
    "끈기 있는 성품으로 자신의 학습 태도 개선 노력",
    "친구의 고민을 차분히 듣고 공감해 주는 뛰어난 리더십",
    "학급 내 크고 작은 궂은일에 앞장서는 책임감 발휘"
];

// Active Category State: 'autonomous' | 'subject' | 'behavior'
let activeCategory = 'autonomous';

// Lists for each category (retrieved from localStorage or defaulted)
let autonomousList = JSON.parse(localStorage.getItem('ai_custom_activities_v8')) || [];
let subjectList = JSON.parse(localStorage.getItem('ai_custom_subject_activities_v8')) || [];
let behaviorList = JSON.parse(localStorage.getItem('ai_custom_behavior_activities_v8')) || [];

let globalResults = []; // { name, activities: [], record: "" }
let isGenerating = false;

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
        poolNoticeMsg.textContent = `* 풍부한 내용 조합을 위해 수행평가 및 교과 활동을 4개 이상 등록해 주세요.`;
        customActivityInput.placeholder = "예: 수학 심화 발표 - 프랙탈 이론 탐구";
        tableResultHeader.textContent = "배정된 탐구 및 과목별 세부능력 특기사항 (더블클릭하여 직접 수정 가능)";
    } else if (category === 'behavior') {
        subjectNameGroup.classList.add('hidden');
        activityPoolLabel.innerHTML = `🌱 인성 요소 및 행동 관찰 풀(Pool) 선택 <span class="label-info">(학생별 랜덤 배정용)</span>`;
        poolNoticeMsg.textContent = `* 학생의 다양한 미덕 표현을 위해 인성 특성을 4개 이상 등록해 주세요.`;
        customActivityInput.placeholder = "예: 모범 학생 - 학급 환경 정화활동 솔선수범";
        tableResultHeader.textContent = "배정된 특성 및 행동특성 종합의견 (더블클릭하여 직접 수정 가능)";
    } else {
        // Autonomous
        subjectNameGroup.classList.add('hidden');
        activityPoolLabel.innerHTML = `✅ 활동 풀(Pool) 선택 <span class="label-info">(학생별 랜덤 배정용)</span>`;
        poolNoticeMsg.textContent = `* 다양한 조합을 위해 자율활동을 최소 4개 이상 체크해 두는 것을 권장합니다.`;
        customActivityInput.placeholder = "예: 체육대회 계주 및 학급 응원 단장 (5/15)";
        tableResultHeader.textContent = "배정된 활동 및 자율활동 특기사항 (더블클릭하여 직접 수정 가능)";
    }

    renderCheckboxes();
}

// ==========================================================================
// 6. Activity Pool Management
// ==========================================================================
function getActiveLists() {
    if (activeCategory === 'subject') {
        return {
            custom: subjectList,
            defaults: defaultSubjectActivities,
            storageKey: 'ai_custom_subject_activities_v8'
        };
    } else if (activeCategory === 'behavior') {
        return {
            custom: behaviorList,
            defaults: defaultBehaviorActivities,
            storageKey: 'ai_custom_behavior_activities_v8'
        };
    } else {
        return {
            custom: autonomousList,
            defaults: defaultAutonomousActivities,
            storageKey: 'ai_custom_activities_v8'
        };
    }
}

function renderCheckboxes() {
    checkboxGrid.innerHTML = ''; 
    const lists = getActiveLists();

    // Render Custom Activities
    lists.custom.forEach((act, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper custom-added';
        wrapper.innerHTML = `
            <label class="checkbox-item">
                <input type="checkbox" value="${act}" checked> 
                <span title="${act}">${act}</span>
            </label>
            <button class="btn-delete" data-index="${index}" title="완전 삭제">✖</button>
        `;
        wrapper.querySelector('.btn-delete').addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-index');
            deleteCustomActivity(parseInt(idx));
        });
        checkboxGrid.appendChild(wrapper);
    });

    // Render Default Activities
    lists.defaults.forEach((act) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';
        wrapper.innerHTML = `
            <label class="checkbox-item">
                <input type="checkbox" value="${act}" checked> 
                <span title="${act}">${act}</span>
            </label>
        `;
        checkboxGrid.appendChild(wrapper);
    });
}

function addCustomActivity() {
    const activityText = customActivityInput.value.trim();
    if (!activityText) { 
        alert("추가할 내용을 입력해주세요!"); 
        return; 
    }

    const lists = getActiveLists();
    if (lists.custom.includes(activityText) || lists.defaults.includes(activityText)) { 
        alert("이미 등록된 항목입니다!"); 
        return; 
    }

    lists.custom.unshift(activityText); 
    localStorage.setItem(lists.storageKey, JSON.stringify(lists.custom));
    customActivityInput.value = ''; 
    renderCheckboxes(); 
}

function deleteCustomActivity(index) {
    if (confirm("이 항목을 완전히 삭제하시겠습니까?")) {
        const lists = getActiveLists();
        lists.custom.splice(index, 1);
        localStorage.setItem(lists.storageKey, JSON.stringify(lists.custom));
        renderCheckboxes();
    }
}

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
    
    // Tone mapping
    let toneGuide = "";
    switch(tone) {
        case "active":
            toneGuide = "학생의 주도성, 적극성 및 문제 해결 의지가 확실히 드러나도록 하며 행동 지향적인 서술(~에 기여함, 앞장서서 실천함, 자기주도적으로 학습함 등)을 반영할 것.";
            break;
        case "reflective":
            toneGuide = "활동을 배우고 분석하며 자신을 성찰하는 내면의 학구적/인성적 태도가 드러나도록 할 것(~의 가치를 깨달음, 스스로의 한계를 극복함, 성찰을 통해 성장함 등).";
            break;
        case "cooperative":
            toneGuide = "협동심, 의사소통, 배려 및 학급 공동체 기여를 중점적으로 묘사할 것(~에 적극 협조하여 반 분위기를 주도함, 타인의 의견을 경청하고 조율함, 협동하여 난관을 극복함 등).";
            break;
        default:
            toneGuide = "학생 행동 사실 위주로 담담하고 객관적인 제3자적 관찰자 뉘앙스로 작성할 것.";
    }

    // Length guide mapping
    let lengthGuide = "";
    switch(length) {
        case "short":
            lengthGuide = "공백 포함 150자 ~ 200자 내외로 매우 짧고 간결하게 핵심 팩트 위주로 작성할 것.";
            break;
        case "long":
            lengthGuide = "공백 포함 400자 ~ 480자 내외로 세밀한 정황 묘사와 관찰 내용, 향후 성장 가능성까지 풍부하게 작성할 것.";
            break;
        default:
            lengthGuide = "공백 포함 250자 ~ 300자 내외로 팩트와 태도의 균형을 맞춰 표준적으로 작성할 것.";
    }

    let customGuide = customPrompt ? `[추가 지시사항] 특히 다음 문구를 반영하거나 뉘앙스를 녹여줘: "${customPrompt}"` : "";

    // Category specific builder
    if (activeCategory === 'subject') {
        const subjectName = subjectNameInput.value.trim() || "해당 과목";
        categoryGoal = `학교생활기록부의 '과목별 세부능력 및 특기사항(과세특)'`;
        systemInstruction = `
        - 교과명: ${subjectName}
        - 학생의 수업 참여 태도, 해당 교과의 학업적 흥미 및 성취, 수행평가나 탐구 보고서 등에서 보여준 구체적 문제해결력과 학습적 성장에 초점을 맞출 것.
        - 교과 활동에서 제시된 개념의 응용 능력이나 학문적 주도성을 구체적인 사실로 서술할 것.
        `;
        dateRule = "과세특은 날짜가 없는 활동이므로, 글 속에 절대 날짜를 넣지 말 것.";
    } else if (activeCategory === 'behavior') {
        categoryGoal = `학교생활기록부의 '행동특성 및 종합의견(행발)'`;
        systemInstruction = `
        - 한 학기 또는 일 년 동안 관찰된 학생의 인성(협동, 배려, 성실성, 갈동 조율 등), 리더십, 생활 태도 및 관계성 등을 종합적으로 아우를 것.
        - 단순 나열이 아니라 학생의 인성적 장점과 성장 과정이 교사 추천서처럼 따뜻하고 신뢰성 있게 녹아들도록 할 것.
        `;
    } else {
        // Autonomous
        categoryGoal = `학교생활기록부의 '자율활동 특기사항'`;
        systemInstruction = `
        - 학급 임원 활동, 학교/학급 특색 행사, 자치 토론회 및 안전/이해 교육 등의 단체 활동 내역에 적극 참여한 태도를 기반으로 함.
        - 활동에 성실하게 참여한 내용과 그것이 학생의 자율성 및 협동심에 기여한 사실을 유기적으로 연결할 것.
        `;
    }

    return `
    너는 대한민국 중학교/고등학교의 전문적이고 통찰력 있는 담임 교사 및 교과 담당 교사야.
    아래 주어진 학생의 이름과 배정된 구체적 행동 및 활동 기록을 종합하여, 생활기록부에 기재할 수 있는 법적 기준에 맞는 ${categoryGoal}을 한 문단으로 작성해줘.

    [작성 대상 정보]
    - 학생 이름: ${studentName}
    - 배정된 활동/관찰 내역: ${activities.join(", ")}
    ${systemInstruction}

    [필수 규칙 조건]
    1. 문맥과 어조:
       - ${toneGuide}
       - 어미 종결은 반드시 대한민국 NEIS 기재 규격에 맞춰 개조식 종결어미인 '~함.', '~보임.', '~다짐함.', '~노력함.', '~기여함.' 등으로 통일할 것 (존댓말이나 에세이체 절대 금지).
    2. 분량 및 가독성:
       - ${lengthGuide}
    3. 세부 규격:
       - 글 속에서 각 활동을 직접적으로 언급할 때는 제공된 원본 날짜를 그대로 괄호 안에 병기할 것 (예: "결과 보고서 작성(4/18)", 단 날짜가 없는 활동은 날짜 병기 생략).
       - 학생의 이름을 글에 자연스럽게 1~2회 언급하되, 문장의 주어를 다듬어 가독성을 높일 것.
       - 지나치게 감정적이거나 주관적인 찬사('매우 우수함', '세계적 리더가 될 것임')는 지양하고 관찰 사실과 학생의 태도 및 성장 내용을 심플하고 공정하게 결합할 것.
       - ${customGuide}
    4. 출력 형식:
       - 어떠한 인사말이나 서론, 부연설명도 절대 포함하지 말고, 오직 바로 생기부에 복사하여 붙여넣을 수 있는 완성된 텍스트 결과만 출력할 것.
    `;
}

// Call API with backoff recovery on 429
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
function appendResultRow(name, activities, record, rowIndex, isSuccess) {
    // If it is the first row, clear empty placeholder
    const firstRow = resultTbody.querySelector('.empty-state');
    if (firstRow) {
        resultTbody.innerHTML = '';
    }

    const tr = document.createElement('tr');
    tr.id = `row-${rowIndex}`;

    const tagsHTML = activities.map(act => `<span class="tag">${act}</span>`).join('');
    
    tr.innerHTML = `
        <td class="col-name">${name}</td>
        <td>
            <div class="tags-wrapper">${tagsHTML}</div>
            <div class="record-editor" contenteditable="${isSuccess}" id="editor-${rowIndex}">${record}</div>
            <div class="row-action-bar">
                <span class="char-counter" id="counter-${rowIndex}">글자 수: ${record.length}자 (공백포함)</span>
                <div class="row-actions">
                    <button class="btn-inline-action btn-row-copy" data-index="${rowIndex}">📋 복사</button>
                    <button class="btn-inline-action btn-row-regen" data-index="${rowIndex}" ${!isSuccess ? 'style="border-color:var(--accent-red); color:var(--accent-red);"' : ''}>🔄 재생성</button>
                </div>
            </div>
        </td>
    `;

    // Bind Character counter listener
    const editor = tr.querySelector('.record-editor');
    const counter = tr.querySelector('.char-counter');
    
    editor.addEventListener('input', () => {
        const text = editor.innerText;
        globalResults[rowIndex].record = text; // sync text changes
        counter.textContent = `글자 수: ${text.length}자 (공백포함)`;
        if (text.length > 500) {
            counter.classList.add('warning');
            counter.textContent += ` ⚠️ NEIS 한도 초과 위험`;
        } else {
            counter.classList.remove('warning');
        }
    });

    // Bind Inline Actions (Copy / Regenerate)
    tr.querySelector('.btn-row-copy').addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        copyIndividualRecord(idx, e.target);
    });

    tr.querySelector('.btn-row-regen').addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        regenerateOneRecord(idx);
    });

    resultTbody.appendChild(tr);
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
    const counter = document.getElementById(`counter-${index}`);
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
        
        // Update states and view
        student.record = recordText;
        editor.innerText = recordText;
        editor.setAttribute('contenteditable', 'true');
        counter.textContent = `글자 수: ${recordText.length}자 (공백포함)`;
        counter.classList.remove('warning');
        
    } catch (error) {
        alert(`재생성 실패: ${error.message}`);
        editor.innerText = originalText;
        editor.setAttribute('contenteditable', 'true');
    } finally {
        regenBtn.disabled = false;
        regenBtn.textContent = "🔄 재생성";
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

    // Prefix with BOM to avoid Korean broken characters in MS Excel
    let csvContent = "\uFEFF이름,배정활동,특기사항 내용\n";

    globalResults.forEach(row => {
        // Escape quotes
        let activitiesText = row.activities.join(" / ").replace(/"/g, '""');
        let record = row.record.replace(/"/g, '""'); 
        csvContent += `${row.name},"${activitiesText}","${record}"\n`;
    });

    let filename = "생기부_일괄생성.csv";
    if (activeCategory === 'subject') {
        const subj = subjectNameInput.value.trim() || "교과";
        filename = `과세특_${subj}_일괄생성.csv`;
    } else if (activeCategory === 'behavior') {
        filename = "행동특성_종합의견_일괄생성.csv";
    } else {
        filename = "자율활동_특기사항_일괄생성.csv";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
