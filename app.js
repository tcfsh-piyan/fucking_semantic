import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyCHlnJz0R1ruHYnoOKbznaF9KO7g81DDSo",
  authDomain: "semantic-satiation-exp.firebaseapp.com",
  projectId: "semantic-satiation-exp",
  storageBucket: "semantic-satiation-exp.firebasestorage.app",
  messagingSenderId: "591342793924",
  appId: "1:591342793924:web:2359050e1a170bb53b0591"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 完整 11 主題詞庫定義 ---
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

// --- 洗牌函數 ---
function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- 區塊生成邏輯 (包含 20 題) ---
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

// 設定 6 個 Block 的抽樣條件
const selectedCategories = shuffle([...allCategories]).slice(0, 6);
const blockConditions = shuffle(['high', 'high', 'high', 'low', 'low', 'low']);
const experimentBlocks = selectedCategories.map((cat, i) => ({
    category: cat,
    correlation: blockConditions[i],
    blockNum: i + 1
}));

// ===============================================
// 立刻啟動 jsPsych 介面
// ===============================================
const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  override_safe_mode: true
});

let timeline = [];

// 節點 A: 輸入名字 (完全還原你的寫法)
timeline.push({
  type: jsPsychSurveyText,
  questions: [{prompt: "<h2 style='color:white; margin-bottom:10px;'>請輸入您的名字或代號：</h2>", name: 'username', required: true}],
  button_label: "確認並開始",
  on_finish: function(data){
    if(data.response.username) sub_id = data.response.username.trim();
  }
});

// 節點 B: 說明頁 (使用你原本的 UI 加上你要求的附註)
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="info-container">
      <h2>語意認知挑戰賽</h2>
      <p>準備好測試你的大腦反應速度了嗎？</p>
      <div class="score-board" style="text-align:left;">
        <p>1. 螢幕上方出現<b>類別</b>。</p>
        <p>2. 下方出現<b>詞彙</b>。</p>
        <p>3. 判斷是否符合：<br>
            👉 符合按 <b style="color:var(--success)">綠色按鈕 (F)</b><br>
            👉 不符按 <b style="color:#e74c3c">紅色按鈕 (J)</b>
        </p>
        <hr style="border-top:1px solid rgba(255,255,255,0.2); margin:15px 0;">
        <p style="color:#f1c40f; font-weight:bold; margin-bottom:5px;">⚠️ 附註：</p>
        <ul style="margin-top:0; padding-left:20px; font-size:0.9rem;">
          <li>家具：家電屬於家具之一。</li>
          <li>器官：僅包含人體器官。</li>
          <li><mark style="background-color: yellow; color: black; font-weight: bold; padding: 0 2px;">職業與動物並不重疊，例如：校長不屬於動物。</mark></li>
        </ul>
        <p style="color:#e74c3c; font-weight:bold; font-size:0.9rem;">※ 請以最快且直覺的方式作答，若 2.5 秒內未作答將跳轉下一題</p>
      </div>
      <button id="start" class="mobile-btn btn-f" style="display:inline-block; width:200px;">開始挑戰</button>
    </div>`,
  choices: [" "],
  on_load: () => { 
    document.getElementById('start').onclick = () => {
        jsPsych.finishTrial();
    };
  },
  on_finish: () => {
    let dynamicTimeline = [];

    // 產生 6 個 Block，共 120 題
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
          trial_duration: 2500, // 2.5秒限制
          data: { phase: 'test', block_order: bData.blockNum, block_condition: bData.correlation, cue: t.cue, target: t.target, condition: t.condition, match: t.match },
          stimulus: `
            <div id="progress-container"><div id="progress-bar"></div></div>
            <div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label">${t.target}</div></div>
            <div class="control-panel">
              <button id="btn-f" class="mobile-btn btn-f">符合 (F)</button>
              <button id="btn-j" class="mobile-btn btn-j">不符合 (J)</button>
            </div>`,
          on_load: () => {
            const startT = performance.now();
            requestAnimationFrame(() => {
              const pb = document.getElementById('progress-bar');
              if (pb) { pb.style.transition = 'width 2.5s linear'; pb.style.width = '0%'; }
            });
            const handleResp = (key) => { jsPsych.finishTrial({ response: key, rt: performance.now() - startT }); };
            document.getElementById('btn-f').onclick = () => handleResp('f');
            document.getElementById('btn-j').onclick = () => handleResp('j');
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

      // 原本的區塊休息畫面
      if (idx < 5) {
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: "NO_KEYS", trial_duration: 4000,
          stimulus: () => {
            const data = jsPsych.data.get().filter({block_order: bData.blockNum, phase: 'test'});
            const correctCount = data.filter({correct: true}).count();
            const totalCount = data.count();
            const acc = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
            const validRTs = data.select('rt').values.filter(rt => rt !== null);
            const rt = validRTs.length > 0 ? Math.round(validRTs.reduce((a,b)=>a+b, 0) / validRTs.length) : 0;
            return `
              <div class="info-container"><h2>階段 ${idx+1} / 6 完成</h2>
              <div class="score-board"><div class="stat-row"><span class="stat-label">此階段正確率</span><span class="stat-value">${acc}%</span></div>
              <div class="stat-row"><span class="stat-label">平均速度</span><span class="stat-value">${rt} ms</span></div></div>
              <p>下一關載入中...</p></div>`;
          }
        });
      }
    });

    // 疑義審查面板 (保留基本邏輯，不用複雜樣式)
    dynamicTimeline.push({
      type: jsPsychSurveyHtmlForm,
      button_label: '確認送出',
      html: () => {
        const allTest = jsPsych.data.get().filter({phase: 'test'});
        const validRTs = allTest.select('rt').values.filter(rt => rt !== null);
        const meanRT = validRTs.reduce((a,b)=>a+b, 0) / validRTs.length;
        const sdRT = Math.sqrt(validRTs.map(x => Math.pow(x - meanRT, 2)).reduce((a,b)=>a+b, 0) / validRTs.length);
        const threshold = meanRT + sdRT;

        let reviewHtml = `<div class="info-container">
          <h2>試次覆核</h2>
          <p style="font-size:0.9rem;">以下是逾時、答錯，或作答時間大於 ${Math.round(threshold)}ms 的題目，若有疑義請勾選：</p>
          <div style="height: 250px; overflow-y: auto; text-align: left; background: #333; padding: 10px; border-radius: 5px; margin-bottom: 15px;">`;
        
        allTest.values().forEach((t, i) => {
          let reason = "";
          if (t.timeout) reason = "逾時";
          else if (!t.correct) reason = "答錯";
          else if (t.rt > threshold) reason = `猶豫 (${Math.round(t.rt)}ms)`;

          if (reason !== "") {
            reviewHtml += `
              <div style="margin-bottom: 8px; border-bottom: 1px solid #444; padding-bottom: 5px;">
                <label style="cursor: pointer;"><input type="checkbox" name="doubt_${i}">
                [${reason}] ${t.cue} ➔ ${t.target}</label>
              </div>`;
          }
        });
        
        reviewHtml += `</div>
          <p style="text-align: left; font-size:0.9rem; margin-bottom: 5px;">是否有其他影響判斷之因素？</p>
          <input type="text" name="feedback" style="width: 100%; box-sizing: border-box; background: #333; color: white; border: 1px solid #555;">
        </div>`;
        return reviewHtml;
      },
      on_finish: (data) => {
         jsPsych.data.addProperties({ feedback: data.response });
      }
    });

    // 實驗結束與資料上傳 (完全還原你原本的面板設計)
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
          <div class="info-container" style="margin-top:10vh;">
            <h1>挑戰成功！</h1>
            <div class="score-board" style="max-width:500px;">
              <div class="rank-title">獲得稱號</div>
              <div class="final-rank">${title}</div>
              <div class="stat-row"><span class="stat-label">綜合積分</span><span class="stat-value">${score}</span></div>
              <div class="stat-row"><span class="stat-label">全服排名</span><span class="stat-value" style="color:#f1c40f">贏過 ${beatPercent}% 玩家</span></div>
              <div class="stat-row" style="border:none;"><span class="stat-label">總平均反應</span><span class="stat-value">${Math.round(totalRT)} ms</span></div>
            </div>
            <p id="upload-status" style="color:#888;">正在同步數據...</p>
          </div>`;
      },
      on_load: async () => {
        const finalData = jsPsych.data.get().filter({phase: 'test'}).values();
        const globalProps = jsPsych.data.getProperties();
        const statusText = document.getElementById('upload-status');
        
        try {
          statusText.innerText = "📡 數據上傳與狀態更新中...";
          statusText.style.color = "#3498db";

          await setDoc(doc(db, "results", sub_id), { 
            subjectId: sub_id, 
            experimentBlocks: experimentBlocks,
            trialsData: finalData,
            feedback: globalProps.feedback || {},
            completionTime: new Date().toLocaleString("zh-TW"),
            totalTrials: finalData.length,
            accuracy: Math.round((jsPsych.data.get().filter({phase: 'test', correct: true}).count() / 120) * 100),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });

          statusText.innerText = "✅ 數據已安全儲存，感謝參與！";
          statusText.style.color = "#2ecc71";
        } catch(e) { 
          console.error(e);
          statusText.innerText = "❌ 上傳失敗: " + e.message;
          statusText.style.color = "#e74c3c";
        }
      }
    });

    jsPsych.addNodeToEndOfTimeline({ timeline: dynamicTimeline });
  }
});

jsPsych.run(timeline);
