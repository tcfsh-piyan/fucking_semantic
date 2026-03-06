import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// 依照數據集精準分類的 11 個主題 (取前五高與後五低)
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

let sub_id = "PLAYER_" + Math.random().toString(36).substring(2, 7).toUpperCase();

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 產生單一 Block 內的 20 題 (此區塊只會是純高相關 或 純低相關)
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

// 核心設定：隨機抽選 6 個主題，並分配 3個高相關、3個低相關，順序打散
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

timeline.push({
  type: jsPsychSurveyText,
  questions: [{
    prompt: "<h2 style='color:white; margin-bottom:10px;'>請輸入您的名字或學號：</h2>", 
    name: 'username', 
    placeholder: "例如：20927 陳小明",
    required: true
  }],
  button_label: "確認",
  on_finish: function(data){
    if(data.response.username) sub_id = data.response.username.trim();
  }
});

// 說明頁：明確標示規則與 2.5 秒限制
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="info-container" style="text-align: left; padding: 20px;">
      <h2 style="text-align: center; color: var(--accent);">語意認知挑戰賽</h2>
      <p>本次測驗包含以下 11 個主題：<br>
      <span style="color:var(--text-dim)">動物、器官、家具、文具、服飾、植物、樂器、武器、職業、運動、飲料</span></p>
      
      <div class="score-board" style="max-width: 600px; margin: 15px auto;">
        <h3 style="margin-top:0;">⚠️ 判斷特別附註：</h3>
        <ul>
          <li><b>家具：</b> 家電屬於家具之一。</li>
          <li><b>器官：</b> 僅包含人體器官。</li>
          <li><mark style="background-color: yellow; color: black; font-weight: bold; padding: 0 5px;">職業與動物並不重疊，例如：校長不屬於動物。</mark></li>
        </ul>
      </div>

      <div class="score-board" style="max-width: 600px; margin: 15px auto;">
        <p>1. 畫面會先出現<b>類別</b>，接著出現<b>詞彙</b>。</p>
        <p>2. 請以<b>最快且直覺</b>的方式判斷是否相符：<br>
            👉 符合按 <b style="color:var(--success)">綠色按鈕 (F)</b><br>
            👉 不符按 <b style="color:#e74c3c">紅色按鈕 (J)</b>
        </p>
        <p style="color: #e74c3c; font-weight: bold;">⚡ 注意：每題只有 2.5 秒，逾時將自動跳轉下一題！請將手指放在鍵盤上準備。</p>
      </div>
      <div style="text-align:center;">
        <button id="start" class="jspsych-btn">我了解了，開始挑戰</button>
      </div>
    </div>`,
  choices: [" "],
  on_load: () => { 
    document.getElementById('start').onclick = () => jsPsych.finishTrial();
  },
  on_finish: () => {
    let dynamicTimeline = [];

    experimentBlocks.forEach((bData, idx) => {
      const trials = generateBlockTrials(bData.category, bData.correlation);
      
      trials.forEach(t => {
        // 提示詞
        dynamicTimeline.push({ 
          type: jsPsychHtmlKeyboardResponse, 
          stimulus: `<div class="trial-box"><div class="cue-label">${t.cue}</div><div class="target-label"></div></div>`, 
          choices: "NO_KEYS", 
          trial_duration: 800 
        });

        // 目標詞 (含視覺進度條與 2.5 秒限制)
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: ["f", "j"],
          trial_duration: 2500, 
          data: { 
            phase: 'test', 
            block_order: bData.blockNum, 
            block_condition: bData.correlation, 
            cue: t.cue, 
            target: t.target, 
            condition: t.condition, 
            match: t.match 
          },
          stimulus: `
            <div id="progress-container"><div id="progress-bar"></div></div>
            <div class="trial-box">
              <div class="cue-label">${t.cue}</div>
              <div class="target-label">${t.target}</div>
            </div>
            <div class="control-panel">
              <button id="btn-f" class="mobile-btn btn-f">符合 (F)</button>
              <button id="btn-j" class="mobile-btn btn-j">不符合 (J)</button>
            </div>`,
          on_load: () => {
            const startT = performance.now();
            
            // 觸發進度條動畫
            requestAnimationFrame(() => {
              const pb = document.getElementById('progress-bar');
              if (pb) {
                pb.style.transition = 'width 2.5s linear';
                pb.style.width = '0%';
              }
            });

            const handleResp = (key) => { jsPsych.finishTrial({ response: key, rt: performance.now() - startT }); };
            document.getElementById('btn-f').onclick = () => handleResp('f');
            document.getElementById('btn-j').onclick = () => handleResp('j');
          },
          on_finish: (data) => {
            if (data.response === null) {
              data.correct = false; 
              data.timeout = true;
            } else {
              const char = data.response;
              data.correct = (char === 'f' && t.match) || (char === 'j' && !t.match);
              data.timeout = false;
            }
          }
        });
      });

      // 每個 Block 的中場休息
      if (idx < 5) {
        dynamicTimeline.push({
          type: jsPsychHtmlKeyboardResponse,
          choices: "NO_KEYS", trial_duration: 3000,
          stimulus: `
            <div class="info-container">
              <h2>區塊 ${idx+1} / 6 完成</h2>
              <p>請稍微休息，下一區塊即將開始...</p>
            </div>`
        });
      }
    });

    // 疑義審查面板 (計算 Mean RT + 1SD)
    dynamicTimeline.push({
      type: jsPsychSurveyHtmlForm,
      button_label: '送出回饋並查看成績',
      html: () => {
        const allTest = jsPsych.data.get().filter({phase: 'test'});
        const validRTs = allTest.select('rt').values.filter(rt => rt !== null);
        const meanRT = validRTs.reduce((a,b)=>a+b, 0) / validRTs.length;
        const sdRT = Math.sqrt(validRTs.map(x => Math.pow(x - meanRT, 2)).reduce((a,b)=>a+b, 0) / validRTs.length);
        const hesitationThreshold = meanRT + sdRT;

        let reviewHtml = `<div class="info-container" style="max-width: 800px;">
          <h2>試次覆核</h2>
          <p style="color:var(--text-dim); font-size: 0.9rem;">以下是您未作答、答錯，或作答時間較長(大於 ${Math.round(hesitationThreshold)}ms) 的題目。若您認為該詞彙的歸類有疑義，請勾選。</p>
          <div style="max-height: 300px; overflow-y: auto; text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border: 1px solid #444; margin-bottom: 20px;">`;
        
        let counter = 0;
        allTest.values().forEach((t, i) => {
          let reason = "";
          if (t.timeout) reason = `<span style="color:#e74c3c">逾時未答</span>`;
          else if (!t.correct) reason = `<span style="color:#e67e22">答錯</span>`;
          else if (t.rt > hesitationThreshold) reason = `<span style="color:#f1c40f">猶豫 (${Math.round(t.rt)}ms)</span>`;

          if (reason !== "") {
            reviewHtml += `<div style="margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #333;">
              <label style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" name="doubt_trial_${i}" style="width:20px; height:20px;">
                <span style="flex-grow:1;">類別：<b>${t.cue}</b> ➔ 詞彙：<b>${t.target}</b></span>
                <span>${reason}</span>
              </label>
            </div>`;
            counter++;
          }
        });

        if (counter === 0) reviewHtml += `<p style="text-align:center; color: var(--success);">完美！沒有需要覆核的題目。</p>`;
        
        reviewHtml += `</div>
          <p style="text-align: left; margin-bottom: 5px;">是否有其他未列在上方，但您認為會影響判斷的試次或原因？</p>
          <textarea name="extra_feedback" style="width: 100%; height: 80px; background: #222; color: #fff; border: 1px solid #555; border-radius: 5px; padding: 10px; font-family: inherit;"></textarea>
        </div>`;

        return reviewHtml;
      },
      on_finish: (data) => {
         // 將受試者填寫的回饋單存入 jsPsych 的全域數據中
         jsPsych.data.addProperties({ feedback: data.response });
      }
    });

    // 結算與上傳
    dynamicTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      choices: "NO_KEYS",
      stimulus: () => {
        const allData = jsPsych.data.get().filter({phase: 'test'});
        const totalAcc = allData.filter({correct: true}).count() / allData.count(); 
        const validRTs = allData.select('rt').values.filter(rt => rt !== null);
        const totalRT = validRTs.length > 0 ? validRTs.reduce((a,b)=>a+b, 0) / validRTs.length : 0;
        let score = totalRT > 0 ? Math.round((Math.pow(totalAcc, 2) * 1000000) / totalRT) : 0;

        return `
          <div class="info-container" style="margin-top:10vh;">
            <h1>挑戰結束</h1>
            <div class="score-board" style="max-width:500px;">
              <div class="stat-row"><span class="stat-label">正確率</span><span class="stat-value">${Math.round(totalAcc * 100)}%</span></div>
              <div class="stat-row" style="border:none;"><span class="stat-label">平均反應</span><span class="stat-value">${Math.round(totalRT)} ms</span></div>
            </div>
            <p id="upload-status" style="color:#888;">正在上傳完整數據...</p>
          </div>`;
      },
      on_load: async () => {
        const finalData = jsPsych.data.get().filter({phase: 'test'}).values();
        const globalProps = jsPsych.data.getProperties();
        const statusText = document.getElementById('upload-status');
        
        try {
          statusText.innerText = "📡 數據上傳中...";
          statusText.style.color = "#3498db";

          await setDoc(doc(db, "results", sub_id), { 
            subjectId: sub_id, 
            experimentBlocks: experimentBlocks, // 紀錄當次抽取的 Block 狀態
            trialsData: finalData,
            feedback: globalProps.feedback || {},
            completionTime: new Date().toLocaleString("zh-TW"),
            totalTrials: finalData.length,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });

          statusText.innerText = "✅ 數據已安全儲存，感謝您的參與！";
          statusText.style.color = "#2ecc71";
        } catch(e) { 
          statusText.innerText = "❌ 上傳失敗: " + e.message;
          statusText.style.color = "#e74c3c";
        }
      }
    });

    jsPsych.addNodeToEndOfTimeline({ timeline: dynamicTimeline });
  }
});

jsPsych.run(timeline);
