import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyDig0LXShXvoUC-Q_jsB4fnt04ndT4AKMI",
  authDomain: "fucking-semantic.firebaseapp.com",
  projectId: "fucking-semantic",
  storageBucket: "fucking-semantic.firebasestorage.app",
  messagingSenderId: "121956643814",
  appId: "1:121956643814:web:8d3691d705b62321935c27",
  measurementId: "G-CNM3HH940R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const wordBank = {
  "動物": { high: ["非洲象", "班馬", "黃金獵犬", "老虎", "獅子"], low: ["駱駝", "狐狸", "鴨嘴獸", "驢子", "麻雀"] },
  "器官": { high: ["心臟", "小腸", "腎臟", "肝臟", "大腸"], low: ["肺臟", "胰臟", "子宮", "膀胱", "睪丸"] },
  "家具": { high: ["木桌", "化妝台", "沙發", "椅子", "茶几"], low: ["冷氣", "洗衣機", "鞋櫃", "馬桶", "冰箱"] },
  "文具": { high: ["自動筆", "鉛筆", "原子筆", "橡皮擦", "奇異筆"], low: ["膠水", "麥克筆", "直尺", "量角器", "三角板"] },
  "服飾": { high: ["裙子", "褲子", "內衣", "洋裝", "襯衫"], low: ["緊身衣", "吊帶背心", "睡衣", "短裙", "羽绒衣"] },
  "植物": { high: ["牡丹花", "波斯菊", "菊花", "牽牛花", "向日葵"], low: ["含羞草", "竹子", "松樹", "稻草", "楓樹"] },
  "樂器": { high: ["鋼琴", "提琴", "吉他", "長笛", "貝斯"], low: ["爵士鼓", "嗩吶", "陶笛", "木魚", "三角鐵"] },
  "武器": { high: ["手槍", "甩棍", "武士刀", "步槍", "雙節棍"], low: ["核彈", "火箭筒", "飛彈", "戰車", "坦克"] },
  "職業": { high: ["老師", "會計師", "教授", "校長", "公務員"], low: ["水電工", "祕書", "護士", "警衛", "農夫"] },
  "運動": { high: ["騎腳踏車", "跑步", "重訓", "籃球", "羽毛球"], low: ["空手道", "滑雪", "跨欄", "射箭", "標槍"] },
  "飲料": { high: ["紅茶", "七喜", "蘋果西打", "牛奶", "咖啡"], low: ["普洱茶", "抹茶", "燕麥奶", "香檳", "茉莉花茶"] }
};
const allCategories = Object.keys(wordBank);

// --- 全域變數 ---
let sub_id = "PLAYER_" + Math.random().toString(36).substring(2, 7).toUpperCase();
let userFeedbackData = {}; // 💡 安全儲存表單資料的全域變數

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateBlockTrials(coreCategory, correlationType) {
  let trials = [];
  let remainingCategories = shuffle(allCategories.filter(c => c !== coreCategory));

  let g1Targets = shuffle([...wordBank[coreCategory][correlationType]]);
  for (let i=0; i<5; i++) trials.push({ cue: coreCategory, target: g1Targets[i], match: true, condition: "重複_匹配" });
  for (let i=0; i<5; i++) trials.push({ cue: coreCategory, target: wordBank[remainingCategories[i]][correlationType][i], match: false, condition: "重複_不匹配" });
  for (let i=0; i<5; i++) trials.push({ cue: remainingCategories[i], target: wordBank[remainingCategories[i]][correlationType][0], match: true, condition: "不重複_匹配" });
  for (let i=5; i<10; i++) trials.push({ cue: remainingCategories[i], target: wordBank[remainingCategories[i-5]][correlationType][1], match: false, condition: "不重複_不匹配" });

  return shuffle(trials);
}

const selectedCategories = shuffle([...allCategories]).slice(0, 6);
const blockConditions = shuffle(['high', 'high', 'high', 'low', 'low', 'low']);
const experimentBlocks = selectedCategories.map((cat, i) => ({
    category: cat,
    correlation: blockConditions[i],
    blockNum: i + 1
}));

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  override_safe_mode: true
});

let timeline = [];

// 1. 高級毛玻璃首頁
timeline.push({
  type: jsPsychSurveyHtmlForm,
  html: `
    <div class="info-container">
      <h2 style="font-size: 2.5rem; margin-bottom: 5px;">語意認知挑戰</h2>
      <p style="color:var(--text-dim); font-size: 1.2rem; margin-bottom: 25px;">大腦反應極限測試</p>
      <div class="score-board">
        <p style="font-size: 1.3rem; margin-bottom: 15px; font-weight: bold;">請輸入代號或學號</p>
        <input type="text" name="username" placeholder="點此輸入" required autocomplete="off">
      </div>
    </div>
  `,
  button_label: "開始挑戰",
  on_finish: function(data){
    if(data.response.username) sub_id = data.response.username.trim();
  }
});

// 2. 說明頁面
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="info-container">
      <div class="score-board" style="text-align:left; padding: 25px;">
        <h3 style="color: var(--accent); margin-top:0; font-size: 1.6rem; text-align:center;">操作說明</h3>
        <p style="font-size: 1.2rem; margin-bottom: 10px;">1. 先看 <b style="color:var(--text-dim)">類別</b>，再看 <b>詞彙</b>。</p>
        <p style="font-size: 1.2rem;">2. 點擊螢幕下方的巨型按鍵：<br>
            <span style="display:inline-block; margin-top:8px;">✅ 符合 ➔ <b style="color:var(--success)">綠色按鍵</b></span><br>
            <span style="display:inline-block; margin-top:8px;">❌ 不符 ➔ <b style="color:var(--danger)">紅色按鍵</b></span>
        </p>
        <div style="background:rgba(241,196,15,0.1); border:1px solid #f1c40f; border-radius:15px; padding:15px; margin-top:20px;">
          <p style="color:#f1c40f; font-weight:bold; margin:0 0 10px 0; font-size:1.1rem;">⚠️ 特殊判定標準：</p>
          <ul style="margin:0; padding-left:20px; font-size:1rem; line-height: 1.6;">
            <li>家電屬於<b>家具</b></li>
            <li>僅包含人體<b>器官</b></li>
            <li>職業與動物<b>絕對不重疊</b><br><span style="color:#aaa">(例如：校長不屬動物)</span></li>
          </ul>
        </div>
        <p style="color: #e74c3c; font-weight: bold; font-size: 1.1rem; text-align:center; margin-top: 20px;">⚡ 每題限時 2.5 秒，逾時自動跳轉！</p>
      </div>
      <button id="start" class="jspsych-btn" style="width: 100%; max-width: 400px; padding: 20px 0;">我了解了，開始</button>
    </div>`,
  choices: [" "],
  on_load: () => { 
    document.getElementById('start').onclick = () => { jsPsych.finishTrial(); };
  },
  on_finish: () => {
    let dynamicTimeline = [];

    experimentBlocks.forEach((bData, idx) => {
      const trials = generateBlockTrials(bData.category, bData.correlation);
      
      trials.forEach(t => {
        dynamicTimeline.push({ type: jsPsychHtmlKeyboardResponse, stimulus: '', choices: "NO_KEYS", trial_duration: 800 });
        
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label"></div></div>`,
          choices: "NO_KEYS", trial_duration: 800
        });

        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: ["f", "j"],
          trial_duration: 2500,
          data: { phase: 'test', block_order: bData.blockNum, block_condition: bData.correlation, cue: t.cue, target: t.target, condition: t.condition, match: t.match },
          stimulus: `
            <div id="progress-container"><div id="progress-bar"></div></div>
            <div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label">${t.target}</div></div>
            <div class="control-panel">
              <button id="btn-f" class="mobile-btn btn-f">符合</button>
              <button id="btn-j" class="mobile-btn btn-j">不符</button>
            </div>`,
          on_load: () => {
            const startT = performance.now();
            requestAnimationFrame(() => {
              const pb = document.getElementById('progress-bar');
              if (pb) { pb.style.transition = 'width 2.5s linear'; pb.style.width = '0%'; }
            });
            const handleResp = (key) => { jsPsych.finishTrial({ response: key, rt: performance.now() - startT }); };
            document.getElementById('btn-f').addEventListener('touchstart', (e) => { e.preventDefault(); handleResp('f'); });
            document.getElementById('btn-j').addEventListener('touchstart', (e) => { e.preventDefault(); handleResp('j'); });
            document.getElementById('btn-f').onmousedown = () => handleResp('f');
            document.getElementById('btn-j').onmousedown = () => handleResp('j');
          },
          on_finish: (data) => {
            if (data.response === null) {
              data.correct = false; data.timeout = true;
            } else {
              const char = data.response;
              data.correct = (char === 'f' && t.match) || (char === 'j' && !t.match);
              data.timeout = false;
            }
          }
        });
      });

      if (idx < 5) {
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: "NO_KEYS", trial_duration: 4000,
          stimulus: () => {
            const data = jsPsych.data.get().filter({block_order: bData.blockNum, phase: 'test'});
            const acc = data.count() > 0 ? Math.round((data.filter({correct: true}).count() / data.count()) * 100) : 0;
            const validRTs = data.select('rt').values.filter(rt => rt !== null);
            const rt = validRTs.length > 0 ? Math.round(validRTs.reduce((a,b)=>a+b, 0) / validRTs.length) : 0;
            return `
              <div class="info-container"><h2>階段 ${idx+1} / 6 完成</h2>
              <div class="score-board">
                <div class="stat-row"><span class="stat-label">此階段正確率</span><span class="stat-value">${acc}%</span></div>
                <div class="stat-row" style="border:none;"><span class="stat-label">平均速度</span><span class="stat-value">${rt} ms</span></div>
              </div></div>`;
          }
        });
      }
    });

    // 3. 疑義覆核面板 (修復 2.5 秒倒數殘留 Bug)
    dynamicTimeline.push({
      type: jsPsychSurveyHtmlForm,
      button_label: '確認送出',
      html: () => {
        const allTest = jsPsych.data.get().filter({phase: 'test'});
        const validRTs = allTest.select('rt').values.filter(rt => rt !== null);
        const meanRT = validRTs.reduce((a,b)=>a+b, 0) / validRTs.length;
        const sdRT = Math.sqrt(validRTs.map(x => Math.pow(x - meanRT, 2)).reduce((a,b)=>a+b, 0) / validRTs.length);
        const threshold = meanRT + sdRT;

        // 💡 隱藏並中斷任何殘留的進度條
        let reviewHtml = `
          <style>#progress-container { display: none !important; width: 0 !important; transition: none !important; }</style>
          <div class="info-container" style="width: 95vw;">
          <h2 style="font-size: 2rem; color: var(--rank-gold); margin-bottom: 10px;">⚠️ 試次覆核</h2>
          <p style="font-size:1.1rem; color:var(--text-dim); margin-bottom: 20px;">以下為您的異常作答，若對題目有疑義請直接點擊勾選：</p>
          <div style="height: 40vh; overflow-y: auto; text-align: left; padding-right: 5px; margin-bottom: 20px;">`;
        
        allTest.values().forEach((t, i) => {
          let reason = ""; let rColor = "";
          if (t.timeout) { reason = "逾時未答"; rColor = "var(--danger)"; }
          else if (!t.correct) { reason = "答錯"; rColor = "#e67e22"; }
          else if (t.rt > threshold) { reason = `猶豫 (${Math.round(t.rt)}ms)`; rColor = "var(--rank-gold)"; }

          if (reason !== "") {
            reviewHtml += `
              <label class="review-item">
                <input type="checkbox" name="doubt_${i}">
                <div style="flex-grow: 1;">
                  <div style="font-size: 1.4rem; font-weight: bold;">${t.cue} <span style="color:#666;">➔</span> ${t.target}</div>
                  <div style="font-size: 1rem; color: ${rColor}; margin-top: 5px; font-weight: bold;">[${reason}]</div>
                </div>
              </label>`;
          }
        });
        
        reviewHtml += `</div>
          <p style="text-align: left; font-size:1.2rem; margin-bottom: 10px; font-weight: bold;">其他意見 (選填)：</p>
          <input type="text" name="feedback" placeholder="點此輸入" style="margin-top:0;">
        </div>`;
        return reviewHtml;
      },
      on_load: () => {
        // 💡 載入時強制移除 DOM 中的進度條
        const pb = document.getElementById('progress-container');
        if (pb) pb.remove();
      },
      on_finish: (data) => { 
        userFeedbackData = data.response; 
      }
    });

    // 4. 結算與上傳畫面
    dynamicTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      choices: "NO_KEYS",
      stimulus: () => {
        const allData = jsPsych.data.get().filter({phase: 'test'});
        const totalAcc = allData.filter({correct: true}).count() / allData.count(); 
        const validRTs = allData.select('rt').values.filter(rt => rt !== null);
        const totalRT = validRTs.length > 0 ? validRTs.reduce((a,b)=>a+b, 0) / validRTs.length : 0;
        let score = totalRT > 0 ? Math.round((Math.pow(totalAcc, 2) * 1000000) / totalRT) : 0;

        let title = "認知新手"; let beatPercent = 50;
        if (score > 1800) { title = "語意辨識之神"; beatPercent = 99; }
        else if (score > 1500) { title = "大腦超頻者"; beatPercent = 95; }
        else if (score > 1200) { title = "反應快手"; beatPercent = 85; }
        else if (score > 1000) { title = "潛力新星"; beatPercent = 70; }

        return `
          <div class="info-container" style="margin-top:5vh;">
            <h1 style="font-size:2.5rem;">測驗結束！</h1>
            <div class="score-board">
              <div class="rank-title" style="font-size:1.2rem; color:var(--text-dim);">獲得稱號</div>
              <div class="final-rank">${title}</div>
              <div class="stat-row"><span class="stat-label">綜合積分</span><span class="stat-value">${score}</span></div>
              <div class="stat-row"><span class="stat-label">正確率</span><span class="stat-value">${Math.round(totalAcc * 100)}%</span></div>
              <div class="stat-row" style="border:none;"><span class="stat-label">總平均反應</span><span class="stat-value">${Math.round(totalRT)} ms</span></div>
            </div>
            <p id="upload-status" style="font-size:1.2rem; color:var(--text-dim); margin-top:20px;">正在同步數據...</p>
          </div>`;
      },
      on_load: async () => {
        const finalData = jsPsych.data.get().filter({phase: 'test'}).values();
        const statusText = document.getElementById('upload-status');
        
        try {
          statusText.innerText = "📡 數據上傳中...";
          statusText.style.color = "#3498db";

          await setDoc(doc(db, "results", sub_id), { 
            subjectId: sub_id, 
            experimentBlocks: experimentBlocks,
            trialsData: finalData,
            feedback: userFeedbackData,
            completionTime: new Date().toLocaleString("zh-TW"),
            totalTrials: finalData.length,
            accuracy: Math.round((jsPsych.data.get().filter({phase: 'test', correct: true}).count() / 120) * 100),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });

          statusText.innerText = "✅ 數據已成功儲存！感謝參與！";
          statusText.style.color = "var(--success)";
          statusText.style.fontWeight = "bold";
        } catch(e) { 
          statusText.innerText = "❌ 上傳失敗: " + e.message;
          statusText.style.color = "var(--danger)";
        }
      }
    });

    jsPsych.addNodeToEndOfTimeline({ timeline: dynamicTimeline });
  }
});

jsPsych.run(timeline);import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyDig0LXShXvoUC-Q_jsB4fnt04ndT4AKMI",
  authDomain: "fucking-semantic.firebaseapp.com",
  projectId: "fucking-semantic",
  storageBucket: "fucking-semantic.firebasestorage.app",
  messagingSenderId: "121956643814",
  appId: "1:121956643814:web:8d3691d705b62321935c27",
  measurementId: "G-CNM3HH940R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const wordBank = {
  "動物": { high: ["非洲象", "班馬", "黃金獵犬", "老虎", "獅子"], low: ["駱駝", "狐狸", "鴨嘴獸", "驢子", "麻雀"] },
  "器官": { high: ["心臟", "小腸", "腎臟", "肝臟", "大腸"], low: ["肺臟", "胰臟", "子宮", "膀胱", "睪丸"] },
  "家具": { high: ["木桌", "化妝台", "沙發", "椅子", "茶几"], low: ["冷氣", "洗衣機", "鞋櫃", "馬桶", "冰箱"] },
  "文具": { high: ["自動筆", "鉛筆", "原子筆", "橡皮擦", "奇異筆"], low: ["膠水", "麥克筆", "直尺", "量角器", "三角板"] },
  "服飾": { high: ["裙子", "褲子", "內衣", "洋裝", "襯衫"], low: ["緊身衣", "吊帶背心", "睡衣", "短裙", "羽绒衣"] },
  "植物": { high: ["牡丹花", "波斯菊", "菊花", "牽牛花", "向日葵"], low: ["含羞草", "竹子", "松樹", "稻草", "楓樹"] },
  "樂器": { high: ["鋼琴", "提琴", "吉他", "長笛", "貝斯"], low: ["爵士鼓", "嗩吶", "陶笛", "木魚", "三角鐵"] },
  "武器": { high: ["手槍", "甩棍", "武士刀", "步槍", "雙節棍"], low: ["核彈", "火箭筒", "飛彈", "戰車", "坦克"] },
  "職業": { high: ["老師", "會計師", "教授", "校長", "公務員"], low: ["水電工", "祕書", "護士", "警衛", "農夫"] },
  "運動": { high: ["騎腳踏車", "跑步", "重訓", "籃球", "羽毛球"], low: ["空手道", "滑雪", "跨欄", "射箭", "標槍"] },
  "飲料": { high: ["紅茶", "七喜", "蘋果西打", "牛奶", "咖啡"], low: ["普洱茶", "抹茶", "燕麥奶", "香檳", "茉莉花茶"] }
};
const allCategories = Object.keys(wordBank);

// --- 全域變數 ---
let sub_id = "PLAYER_" + Math.random().toString(36).substring(2, 7).toUpperCase();
let userFeedbackData = {}; // 💡 安全儲存表單資料的全域變數

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateBlockTrials(coreCategory, correlationType) {
  let trials = [];
  let remainingCategories = shuffle(allCategories.filter(c => c !== coreCategory));

  let g1Targets = shuffle([...wordBank[coreCategory][correlationType]]);
  for (let i=0; i<5; i++) trials.push({ cue: coreCategory, target: g1Targets[i], match: true, condition: "重複_匹配" });
  for (let i=0; i<5; i++) trials.push({ cue: coreCategory, target: wordBank[remainingCategories[i]][correlationType][i], match: false, condition: "重複_不匹配" });
  for (let i=0; i<5; i++) trials.push({ cue: remainingCategories[i], target: wordBank[remainingCategories[i]][correlationType][0], match: true, condition: "不重複_匹配" });
  for (let i=5; i<10; i++) trials.push({ cue: remainingCategories[i], target: wordBank[remainingCategories[i-5]][correlationType][1], match: false, condition: "不重複_不匹配" });

  return shuffle(trials);
}

const selectedCategories = shuffle([...allCategories]).slice(0, 6);
const blockConditions = shuffle(['high', 'high', 'high', 'low', 'low', 'low']);
const experimentBlocks = selectedCategories.map((cat, i) => ({
    category: cat,
    correlation: blockConditions[i],
    blockNum: i + 1
}));

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  override_safe_mode: true
});

let timeline = [];

// 1. 高級毛玻璃首頁
timeline.push({
  type: jsPsychSurveyHtmlForm,
  html: `
    <div class="info-container">
      <h2 style="font-size: 2.5rem; margin-bottom: 5px;">語意認知挑戰</h2>
      <p style="color:var(--text-dim); font-size: 1.2rem; margin-bottom: 25px;">大腦反應極限測試</p>
      <div class="score-board">
        <p style="font-size: 1.3rem; margin-bottom: 15px; font-weight: bold;">請輸入代號或學號</p>
        <input type="text" name="username" placeholder="點此輸入" required autocomplete="off">
      </div>
    </div>
  `,
  button_label: "開始挑戰",
  on_finish: function(data){
    if(data.response.username) sub_id = data.response.username.trim();
  }
});

// 2. 說明頁面
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="info-container">
      <div class="score-board" style="text-align:left; padding: 25px;">
        <h3 style="color: var(--accent); margin-top:0; font-size: 1.6rem; text-align:center;">操作說明</h3>
        <p style="font-size: 1.2rem; margin-bottom: 10px;">1. 先看 <b style="color:var(--text-dim)">類別</b>，再看 <b>詞彙</b>。</p>
        <p style="font-size: 1.2rem;">2. 點擊螢幕下方的巨型按鍵：<br>
            <span style="display:inline-block; margin-top:8px;">✅ 符合 ➔ <b style="color:var(--success)">綠色按鍵</b></span><br>
            <span style="display:inline-block; margin-top:8px;">❌ 不符 ➔ <b style="color:var(--danger)">紅色按鍵</b></span>
        </p>
        <div style="background:rgba(241,196,15,0.1); border:1px solid #f1c40f; border-radius:15px; padding:15px; margin-top:20px;">
          <p style="color:#f1c40f; font-weight:bold; margin:0 0 10px 0; font-size:1.1rem;">⚠️ 特殊判定標準：</p>
          <ul style="margin:0; padding-left:20px; font-size:1rem; line-height: 1.6;">
            <li>家電屬於<b>家具</b></li>
            <li>僅包含人體<b>器官</b></li>
            <li>職業與動物<b>絕對不重疊</b><br><span style="color:#aaa">(例如：校長不屬動物)</span></li>
          </ul>
        </div>
        <p style="color: #e74c3c; font-weight: bold; font-size: 1.1rem; text-align:center; margin-top: 20px;">⚡ 每題限時 2.5 秒，逾時自動跳轉！</p>
      </div>
      <button id="start" class="jspsych-btn" style="width: 100%; max-width: 400px; padding: 20px 0;">我了解了，開始</button>
    </div>`,
  choices: [" "],
  on_load: () => { 
    document.getElementById('start').onclick = () => { jsPsych.finishTrial(); };
  },
  on_finish: () => {
    let dynamicTimeline = [];

    experimentBlocks.forEach((bData, idx) => {
      const trials = generateBlockTrials(bData.category, bData.correlation);
      
      trials.forEach(t => {
        dynamicTimeline.push({ type: jsPsychHtmlKeyboardResponse, stimulus: '', choices: "NO_KEYS", trial_duration: 800 });
        
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label"></div></div>`,
          choices: "NO_KEYS", trial_duration: 800
        });

        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: ["f", "j"],
          trial_duration: 2500,
          data: { phase: 'test', block_order: bData.blockNum, block_condition: bData.correlation, cue: t.cue, target: t.target, condition: t.condition, match: t.match },
          stimulus: `
            <div id="progress-container"><div id="progress-bar"></div></div>
            <div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label">${t.target}</div></div>
            <div class="control-panel">
              <button id="btn-f" class="mobile-btn btn-f">符合</button>
              <button id="btn-j" class="mobile-btn btn-j">不符</button>
            </div>`,
          on_load: () => {
            const startT = performance.now();
            requestAnimationFrame(() => {
              const pb = document.getElementById('progress-bar');
              if (pb) { pb.style.transition = 'width 2.5s linear'; pb.style.width = '0%'; }
            });
            const handleResp = (key) => { jsPsych.finishTrial({ response: key, rt: performance.now() - startT }); };
            document.getElementById('btn-f').addEventListener('touchstart', (e) => { e.preventDefault(); handleResp('f'); });
            document.getElementById('btn-j').addEventListener('touchstart', (e) => { e.preventDefault(); handleResp('j'); });
            document.getElementById('btn-f').onmousedown = () => handleResp('f');
            document.getElementById('btn-j').onmousedown = () => handleResp('j');
          },
          on_finish: (data) => {
            if (data.response === null) {
              data.correct = false; data.timeout = true;
            } else {
              const char = data.response;
              data.correct = (char === 'f' && t.match) || (char === 'j' && !t.match);
              data.timeout = false;
            }
          }
        });
      });

      if (idx < 5) {
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: "NO_KEYS", trial_duration: 4000,
          stimulus: () => {
            const data = jsPsych.data.get().filter({block_order: bData.blockNum, phase: 'test'});
            const acc = data.count() > 0 ? Math.round((data.filter({correct: true}).count() / data.count()) * 100) : 0;
            const validRTs = data.select('rt').values.filter(rt => rt !== null);
            const rt = validRTs.length > 0 ? Math.round(validRTs.reduce((a,b)=>a+b, 0) / validRTs.length) : 0;
            return `
              <div class="info-container"><h2>階段 ${idx+1} / 6 完成</h2>
              <div class="score-board">
                <div class="stat-row"><span class="stat-label">此階段正確率</span><span class="stat-value">${acc}%</span></div>
                <div class="stat-row" style="border:none;"><span class="stat-label">平均速度</span><span class="stat-value">${rt} ms</span></div>
              </div></div>`;
          }
        });
      }
    });

    // 3. 疑義覆核面板 (修復 2.5 秒倒數殘留 Bug)
    dynamicTimeline.push({
      type: jsPsychSurveyHtmlForm,
      button_label: '確認送出',
      html: () => {
        const allTest = jsPsych.data.get().filter({phase: 'test'});
        const validRTs = allTest.select('rt').values.filter(rt => rt !== null);
        const meanRT = validRTs.reduce((a,b)=>a+b, 0) / validRTs.length;
        const sdRT = Math.sqrt(validRTs.map(x => Math.pow(x - meanRT, 2)).reduce((a,b)=>a+b, 0) / validRTs.length);
        const threshold = meanRT + sdRT;

        // 💡 隱藏並中斷任何殘留的進度條
        let reviewHtml = `
          <style>#progress-container { display: none !important; width: 0 !important; transition: none !important; }</style>
          <div class="info-container" style="width: 95vw;">
          <h2 style="font-size: 2rem; color: var(--rank-gold); margin-bottom: 10px;">⚠️ 試次覆核</h2>
          <p style="font-size:1.1rem; color:var(--text-dim); margin-bottom: 20px;">以下為您的異常作答，若對題目有疑義請直接點擊勾選：</p>
          <div style="height: 40vh; overflow-y: auto; text-align: left; padding-right: 5px; margin-bottom: 20px;">`;
        
        allTest.values().forEach((t, i) => {
          let reason = ""; let rColor = "";
          if (t.timeout) { reason = "逾時未答"; rColor = "var(--danger)"; }
          else if (!t.correct) { reason = "答錯"; rColor = "#e67e22"; }
          else if (t.rt > threshold) { reason = `猶豫 (${Math.round(t.rt)}ms)`; rColor = "var(--rank-gold)"; }

          if (reason !== "") {
            reviewHtml += `
              <label class="review-item">
                <input type="checkbox" name="doubt_${i}">
                <div style="flex-grow: 1;">
                  <div style="font-size: 1.4rem; font-weight: bold;">${t.cue} <span style="color:#666;">➔</span> ${t.target}</div>
                  <div style="font-size: 1rem; color: ${rColor}; margin-top: 5px; font-weight: bold;">[${reason}]</div>
                </div>
              </label>`;
          }
        });
        
        reviewHtml += `</div>
          <p style="text-align: left; font-size:1.2rem; margin-bottom: 10px; font-weight: bold;">其他意見 (選填)：</p>
          <input type="text" name="feedback" placeholder="點此輸入" style="margin-top:0;">
        </div>`;
        return reviewHtml;
      },
      on_load: () => {
        // 💡 載入時強制移除 DOM 中的進度條
        const pb = document.getElementById('progress-container');
        if (pb) pb.remove();
      },
      on_finish: (data) => { 
        userFeedbackData = data.response; 
      }
    });

    // 4. 結算與上傳畫面
    dynamicTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      choices: "NO_KEYS",
      stimulus: () => {
        const allData = jsPsych.data.get().filter({phase: 'test'});
        const totalAcc = allData.filter({correct: true}).count() / allData.count(); 
        const validRTs = allData.select('rt').values.filter(rt => rt !== null);
        const totalRT = validRTs.length > 0 ? validRTs.reduce((a,b)=>a+b, 0) / validRTs.length : 0;
        let score = totalRT > 0 ? Math.round((Math.pow(totalAcc, 2) * 1000000) / totalRT) : 0;

        let title = "認知新手"; let beatPercent = 50;
        if (score > 1800) { title = "語意辨識之神"; beatPercent = 99; }
        else if (score > 1500) { title = "大腦超頻者"; beatPercent = 95; }
        else if (score > 1200) { title = "反應快手"; beatPercent = 85; }
        else if (score > 1000) { title = "潛力新星"; beatPercent = 70; }

        return `
          <div class="info-container" style="margin-top:5vh;">
            <h1 style="font-size:2.5rem;">測驗結束！</h1>
            <div class="score-board">
              <div class="rank-title" style="font-size:1.2rem; color:var(--text-dim);">獲得稱號</div>
              <div class="final-rank">${title}</div>
              <div class="stat-row"><span class="stat-label">綜合積分</span><span class="stat-value">${score}</span></div>
              <div class="stat-row"><span class="stat-label">正確率</span><span class="stat-value">${Math.round(totalAcc * 100)}%</span></div>
              <div class="stat-row" style="border:none;"><span class="stat-label">總平均反應</span><span class="stat-value">${Math.round(totalRT)} ms</span></div>
            </div>
            <p id="upload-status" style="font-size:1.2rem; color:var(--text-dim); margin-top:20px;">正在同步數據...</p>
          </div>`;
      },
      on_load: async () => {
        const finalData = jsPsych.data.get().filter({phase: 'test'}).values();
        const statusText = document.getElementById('upload-status');
        
        try {
          statusText.innerText = "📡 數據上傳中...";
          statusText.style.color = "#3498db";

          await setDoc(doc(db, "results", sub_id), { 
            subjectId: sub_id, 
            experimentBlocks: experimentBlocks,
            trialsData: finalData,
            feedback: userFeedbackData,
            completionTime: new Date().toLocaleString("zh-TW"),
            totalTrials: finalData.length,
            accuracy: Math.round((jsPsych.data.get().filter({phase: 'test', correct: true}).count() / 120) * 100),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });

          statusText.innerText = "✅ 數據已成功儲存！感謝參與！";
          statusText.style.color = "var(--success)";
          statusText.style.fontWeight = "bold";
        } catch(e) { 
          statusText.innerText = "❌ 上傳失敗: " + e.message;
          statusText.style.color = "var(--danger)";
        }
      }
    });

    jsPsych.addNodeToEndOfTimeline({ timeline: dynamicTimeline });
  }
});

jsPsych.run(timeline);import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyDig0LXShXvoUC-Q_jsB4fnt04ndT4AKMI",
  authDomain: "fucking-semantic.firebaseapp.com",
  projectId: "fucking-semantic",
  storageBucket: "fucking-semantic.firebasestorage.app",
  messagingSenderId: "121956643814",
  appId: "1:121956643814:web:8d3691d705b62321935c27",
  measurementId: "G-CNM3HH940R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const wordBank = {
  "動物": { high: ["非洲象", "班馬", "黃金獵犬", "老虎", "獅子"], low: ["駱駝", "狐狸", "鴨嘴獸", "驢子", "麻雀"] },
  "器官": { high: ["心臟", "小腸", "腎臟", "肝臟", "大腸"], low: ["肺臟", "胰臟", "子宮", "膀胱", "睪丸"] },
  "家具": { high: ["木桌", "化妝台", "沙發", "椅子", "茶几"], low: ["冷氣", "洗衣機", "鞋櫃", "馬桶", "冰箱"] },
  "文具": { high: ["自動筆", "鉛筆", "原子筆", "橡皮擦", "奇異筆"], low: ["膠水", "麥克筆", "直尺", "量角器", "三角板"] },
  "服飾": { high: ["裙子", "褲子", "內衣", "洋裝", "襯衫"], low: ["緊身衣", "吊帶背心", "睡衣", "短裙", "羽绒衣"] },
  "植物": { high: ["牡丹花", "波斯菊", "菊花", "牽牛花", "向日葵"], low: ["含羞草", "竹子", "松樹", "稻草", "楓樹"] },
  "樂器": { high: ["鋼琴", "提琴", "吉他", "長笛", "貝斯"], low: ["爵士鼓", "嗩吶", "陶笛", "木魚", "三角鐵"] },
  "武器": { high: ["手槍", "甩棍", "武士刀", "步槍", "雙節棍"], low: ["核彈", "火箭筒", "飛彈", "戰車", "坦克"] },
  "職業": { high: ["老師", "會計師", "教授", "校長", "公務員"], low: ["水電工", "祕書", "護士", "警衛", "農夫"] },
  "運動": { high: ["騎腳踏車", "跑步", "重訓", "籃球", "羽毛球"], low: ["空手道", "滑雪", "跨欄", "射箭", "標槍"] },
  "飲料": { high: ["紅茶", "七喜", "蘋果西打", "牛奶", "咖啡"], low: ["普洱茶", "抹茶", "燕麥奶", "香檳", "茉莉花茶"] }
};
const allCategories = Object.keys(wordBank);

// --- 全域變數 ---
let sub_id = "PLAYER_" + Math.random().toString(36).substring(2, 7).toUpperCase();
let userFeedbackData = {}; // 💡 安全儲存表單資料的全域變數

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateBlockTrials(coreCategory, correlationType) {
  let trials = [];
  let remainingCategories = shuffle(allCategories.filter(c => c !== coreCategory));

  let g1Targets = shuffle([...wordBank[coreCategory][correlationType]]);
  for (let i=0; i<5; i++) trials.push({ cue: coreCategory, target: g1Targets[i], match: true, condition: "重複_匹配" });
  for (let i=0; i<5; i++) trials.push({ cue: coreCategory, target: wordBank[remainingCategories[i]][correlationType][i], match: false, condition: "重複_不匹配" });
  for (let i=0; i<5; i++) trials.push({ cue: remainingCategories[i], target: wordBank[remainingCategories[i]][correlationType][0], match: true, condition: "不重複_匹配" });
  for (let i=5; i<10; i++) trials.push({ cue: remainingCategories[i], target: wordBank[remainingCategories[i-5]][correlationType][1], match: false, condition: "不重複_不匹配" });

  return shuffle(trials);
}

const selectedCategories = shuffle([...allCategories]).slice(0, 6);
const blockConditions = shuffle(['high', 'high', 'high', 'low', 'low', 'low']);
const experimentBlocks = selectedCategories.map((cat, i) => ({
    category: cat,
    correlation: blockConditions[i],
    blockNum: i + 1
}));

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  override_safe_mode: true
});

let timeline = [];

// 1. 高級毛玻璃首頁
timeline.push({
  type: jsPsychSurveyHtmlForm,
  html: `
    <div class="info-container">
      <h2 style="font-size: 2.5rem; margin-bottom: 5px;">語意認知挑戰</h2>
      <p style="color:var(--text-dim); font-size: 1.2rem; margin-bottom: 25px;">大腦反應極限測試</p>
      <div class="score-board">
        <p style="font-size: 1.3rem; margin-bottom: 15px; font-weight: bold;">請輸入代號或學號</p>
        <input type="text" name="username" placeholder="點此輸入" required autocomplete="off">
      </div>
    </div>
  `,
  button_label: "開始挑戰",
  on_finish: function(data){
    if(data.response.username) sub_id = data.response.username.trim();
  }
});

// 2. 說明頁面
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="info-container">
      <div class="score-board" style="text-align:left; padding: 25px;">
        <h3 style="color: var(--accent); margin-top:0; font-size: 1.6rem; text-align:center;">操作說明</h3>
        <p style="font-size: 1.2rem; margin-bottom: 10px;">1. 先看 <b style="color:var(--text-dim)">類別</b>，再看 <b>詞彙</b>。</p>
        <p style="font-size: 1.2rem;">2. 點擊螢幕下方的巨型按鍵：<br>
            <span style="display:inline-block; margin-top:8px;">✅ 符合 ➔ <b style="color:var(--success)">綠色按鍵</b></span><br>
            <span style="display:inline-block; margin-top:8px;">❌ 不符 ➔ <b style="color:var(--danger)">紅色按鍵</b></span>
        </p>
        <div style="background:rgba(241,196,15,0.1); border:1px solid #f1c40f; border-radius:15px; padding:15px; margin-top:20px;">
          <p style="color:#f1c40f; font-weight:bold; margin:0 0 10px 0; font-size:1.1rem;">⚠️ 特殊判定標準：</p>
          <ul style="margin:0; padding-left:20px; font-size:1rem; line-height: 1.6;">
            <li>家電屬於<b>家具</b></li>
            <li>僅包含人體<b>器官</b></li>
            <li>職業與動物<b>絕對不重疊</b><br><span style="color:#aaa">(例如：校長不屬動物)</span></li>
          </ul>
        </div>
        <p style="color: #e74c3c; font-weight: bold; font-size: 1.1rem; text-align:center; margin-top: 20px;">⚡ 每題限時 2.5 秒，逾時自動跳轉！</p>
      </div>
      <button id="start" class="jspsych-btn" style="width: 100%; max-width: 400px; padding: 20px 0;">我了解了，開始</button>
    </div>`,
  choices: [" "],
  on_load: () => { 
    document.getElementById('start').onclick = () => { jsPsych.finishTrial(); };
  },
  on_finish: () => {
    let dynamicTimeline = [];

    experimentBlocks.forEach((bData, idx) => {
      const trials = generateBlockTrials(bData.category, bData.correlation);
      
      trials.forEach(t => {
        dynamicTimeline.push({ type: jsPsychHtmlKeyboardResponse, stimulus: '', choices: "NO_KEYS", trial_duration: 800 });
        
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label"></div></div>`,
          choices: "NO_KEYS", trial_duration: 800
        });

        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: ["f", "j"],
          trial_duration: 2500,
          data: { phase: 'test', block_order: bData.blockNum, block_condition: bData.correlation, cue: t.cue, target: t.target, condition: t.condition, match: t.match },
          stimulus: `
            <div id="progress-container"><div id="progress-bar"></div></div>
            <div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label">${t.target}</div></div>
            <div class="control-panel">
              <button id="btn-f" class="mobile-btn btn-f">符合</button>
              <button id="btn-j" class="mobile-btn btn-j">不符</button>
            </div>`,
          on_load: () => {
            const startT = performance.now();
            requestAnimationFrame(() => {
              const pb = document.getElementById('progress-bar');
              if (pb) { pb.style.transition = 'width 2.5s linear'; pb.style.width = '0%'; }
            });
            const handleResp = (key) => { jsPsych.finishTrial({ response: key, rt: performance.now() - startT }); };
            document.getElementById('btn-f').addEventListener('touchstart', (e) => { e.preventDefault(); handleResp('f'); });
            document.getElementById('btn-j').addEventListener('touchstart', (e) => { e.preventDefault(); handleResp('j'); });
            document.getElementById('btn-f').onmousedown = () => handleResp('f');
            document.getElementById('btn-j').onmousedown = () => handleResp('j');
          },
          on_finish: (data) => {
            if (data.response === null) {
              data.correct = false; data.timeout = true;
            } else {
              const char = data.response;
              data.correct = (char === 'f' && t.match) || (char === 'j' && !t.match);
              data.timeout = false;
            }
          }
        });
      });

      if (idx < 5) {
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: "NO_KEYS", trial_duration: 4000,
          stimulus: () => {
            const data = jsPsych.data.get().filter({block_order: bData.blockNum, phase: 'test'});
            const acc = data.count() > 0 ? Math.round((data.filter({correct: true}).count() / data.count()) * 100) : 0;
            const validRTs = data.select('rt').values.filter(rt => rt !== null);
            const rt = validRTs.length > 0 ? Math.round(validRTs.reduce((a,b)=>a+b, 0) / validRTs.length) : 0;
            return `
              <div class="info-container"><h2>階段 ${idx+1} / 6 完成</h2>
              <div class="score-board">
                <div class="stat-row"><span class="stat-label">此階段正確率</span><span class="stat-value">${acc}%</span></div>
                <div class="stat-row" style="border:none;"><span class="stat-label">平均速度</span><span class="stat-value">${rt} ms</span></div>
              </div></div>`;
          }
        });
      }
    });

    // 3. 疑義覆核面板 (修復 2.5 秒倒數殘留 Bug)
    dynamicTimeline.push({
      type: jsPsychSurveyHtmlForm,
      button_label: '確認送出',
      html: () => {
        const allTest = jsPsych.data.get().filter({phase: 'test'});
        const validRTs = allTest.select('rt').values.filter(rt => rt !== null);
        const meanRT = validRTs.reduce((a,b)=>a+b, 0) / validRTs.length;
        const sdRT = Math.sqrt(validRTs.map(x => Math.pow(x - meanRT, 2)).reduce((a,b)=>a+b, 0) / validRTs.length);
        const threshold = meanRT + sdRT;

        // 💡 隱藏並中斷任何殘留的進度條
        let reviewHtml = `
          <style>#progress-container { display: none !important; width: 0 !important; transition: none !important; }</style>
          <div class="info-container" style="width: 95vw;">
          <h2 style="font-size: 2rem; color: var(--rank-gold); margin-bottom: 10px;">⚠️ 試次覆核</h2>
          <p style="font-size:1.1rem; color:var(--text-dim); margin-bottom: 20px;">以下為您的異常作答，若對題目有疑義請直接點擊勾選：</p>
          <div style="height: 40vh; overflow-y: auto; text-align: left; padding-right: 5px; margin-bottom: 20px;">`;
        
        allTest.values().forEach((t, i) => {
          let reason = ""; let rColor = "";
          if (t.timeout) { reason = "逾時未答"; rColor = "var(--danger)"; }
          else if (!t.correct) { reason = "答錯"; rColor = "#e67e22"; }
          else if (t.rt > threshold) { reason = `猶豫 (${Math.round(t.rt)}ms)`; rColor = "var(--rank-gold)"; }

          if (reason !== "") {
            reviewHtml += `
              <label class="review-item">
                <input type="checkbox" name="doubt_${i}">
                <div style="flex-grow: 1;">
                  <div style="font-size: 1.4rem; font-weight: bold;">${t.cue} <span style="color:#666;">➔</span> ${t.target}</div>
                  <div style="font-size: 1rem; color: ${rColor}; margin-top: 5px; font-weight: bold;">[${reason}]</div>
                </div>
              </label>`;
          }
        });
        
        reviewHtml += `</div>
          <p style="text-align: left; font-size:1.2rem; margin-bottom: 10px; font-weight: bold;">其他意見 (選填)：</p>
          <input type="text" name="feedback" placeholder="點此輸入" style="margin-top:0;">
        </div>`;
        return reviewHtml;
      },
      on_load: () => {
        // 💡 載入時強制移除 DOM 中的進度條
        const pb = document.getElementById('progress-container');
        if (pb) pb.remove();
      },
      on_finish: (data) => { 
        userFeedbackData = data.response; 
      }
    });

    // 4. 結算與上傳畫面
    dynamicTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      choices: "NO_KEYS",
      stimulus: () => {
        const allData = jsPsych.data.get().filter({phase: 'test'});
        const totalAcc = allData.filter({correct: true}).count() / allData.count(); 
        const validRTs = allData.select('rt').values.filter(rt => rt !== null);
        const totalRT = validRTs.length > 0 ? validRTs.reduce((a,b)=>a+b, 0) / validRTs.length : 0;
        let score = totalRT > 0 ? Math.round((Math.pow(totalAcc, 2) * 1000000) / totalRT) : 0;

        let title = "認知新手"; let beatPercent = 50;
        if (score > 1800) { title = "語意辨識之神"; beatPercent = 99; }
        else if (score > 1500) { title = "大腦超頻者"; beatPercent = 95; }
        else if (score > 1200) { title = "反應快手"; beatPercent = 85; }
        else if (score > 1000) { title = "潛力新星"; beatPercent = 70; }

        return `
          <div class="info-container" style="margin-top:5vh;">
            <h1 style="font-size:2.5rem;">測驗結束！</h1>
            <div class="score-board">
              <div class="rank-title" style="font-size:1.2rem; color:var(--text-dim);">獲得稱號</div>
              <div class="final-rank">${title}</div>
              <div class="stat-row"><span class="stat-label">綜合積分</span><span class="stat-value">${score}</span></div>
              <div class="stat-row"><span class="stat-label">正確率</span><span class="stat-value">${Math.round(totalAcc * 100)}%</span></div>
              <div class="stat-row" style="border:none;"><span class="stat-label">總平均反應</span><span class="stat-value">${Math.round(totalRT)} ms</span></div>
            </div>
            <p id="upload-status" style="font-size:1.2rem; color:var(--text-dim); margin-top:20px;">正在同步數據...</p>
          </div>`;
      },
      on_load: async () => {
        const finalData = jsPsych.data.get().filter({phase: 'test'}).values();
        const statusText = document.getElementById('upload-status');
        
        try {
          statusText.innerText = "📡 數據上傳中...";
          statusText.style.color = "#3498db";

          await setDoc(doc(db, "results", sub_id), { 
            subjectId: sub_id, 
            experimentBlocks: experimentBlocks,
            trialsData: finalData,
            feedback: userFeedbackData,
            completionTime: new Date().toLocaleString("zh-TW"),
            totalTrials: finalData.length,
            accuracy: Math.round((jsPsych.data.get().filter({phase: 'test', correct: true}).count() / 120) * 100),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });

          statusText.innerText = "✅ 數據已成功儲存！感謝參與！";
          statusText.style.color = "var(--success)";
          statusText.style.fontWeight = "bold";
        } catch(e) { 
          statusText.innerText = "❌ 上傳失敗: " + e.message;
          statusText.style.color = "var(--danger)";
        }
      }
    });

    jsPsych.addNodeToEndOfTimeline({ timeline: dynamicTimeline });
  }
});

jsPsych.run(timeline);
