<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>語意認知挑戰賽 - 數據後台</title>
    
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <style>
        :root {
            --bg-color: #f8f9fa;
            --card-bg: #ffffff;
            --primary: #3498db;
            --success: #27ae60;
            --danger: #e74c3c;
            --text-dark: #2c3e50;
            --text-light: #7f8c8d;
        }

        body { 
            background-color: var(--bg-color); 
            font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif; 
            margin: 0; padding: 40px 20px; 
            color: var(--text-dark);
        }

        .container { max-width: 1100px; margin: 0 auto; background: var(--card-bg); padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        /* Header 樣式 */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .title-group { display: flex; align-items: center; gap: 15px; }
        .title-group h1 { margin: 0; font-size: 1.8rem; }
        .badge { background: #e1f0ff; color: #007bff; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }

        /* 狀態列 */
        .status-bar { background-color: #d4edda; color: #155724; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }

        /* 按鈕基礎樣式 */
        .btn { border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; color: white; }
        .btn:active { transform: scale(0.95); }
        .btn-refresh { background-color: var(--primary); }
        .btn-excel { background-color: var(--success); }
        .btn-delete { background-color: var(--danger); }
        .btn-delete:hover { background-color: #c0392b; }

        /* 表格樣式 */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; color: var(--text-light); border-bottom: 2px solid #eee; padding: 15px 10px; font-weight: 500; }
        td { padding: 18px 10px; border-bottom: 1px solid #f1f1f1; font-size: 0.95rem; }
        
        .device-tag { background: #fff0f0; color: #e74c3c; padding: 3px 10px; border-radius: 6px; font-size: 0.8rem; border: 1px solid #ffdada; }
        .device-pc { background: #f0f8ff; color: #3498db; border-color: #cce5ff; }
        .action-group { display: flex; gap: 10px; }

        .loading-spinner { text-align: center; padding: 50px; color: var(--text-light); }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <div class="title-group">
            <h1>📊 語意認知挑戰賽 - 數據後台</h1>
            <span class="badge">fucking-semantic</span>
        </div>
        <button class="btn btn-refresh" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i> 重新整理
        </button>
    </div>

    <div id="status-box" class="status-bar" style="display:none;">
        <i class="fas fa-check-circle"></i> 成功載入 <span id="data-count" style="font-weight:bold; margin: 0 5px;">0</span> 筆受試者資料。
    </div>

    <div id="loader" class="loading-spinner">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p style="margin-top: 10px;">數據載入中...</p>
    </div>

    <table id="main-table" style="display:none;">
        <thead>
            <tr>
                <th>受試者 ID</th>
                <th>完成時間</th>
                <th>裝置</th>
                <th>試次 (Trials)</th>
                <th>正確率</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody id="table-body"></tbody>
    </table>
</div>

<script>
    // 1. Firebase 配置 (已套用您最新成功寫入的設定)
    const firebaseConfig = {
      apiKey: "AIzaSyDig0LXShXvoUC-Q_jsB4fnt04ndT4AKMI",
      authDomain: "fucking-semantic.firebaseapp.com",
      projectId: "fucking-semantic",
      storageBucket: "fucking-semantic.firebasestorage.app",
      messagingSenderId: "121956643814",
      appId: "1:121956643814:web:8d3691d705b62321935c27",
      measurementId: "G-CNM3HH940R"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // 2. 加載數據
    async function fetchData() {
        const tbody = document.getElementById('table-body');
        try {
            // 從我們剛剛 app.js 寫入的 "results" 集合抓取資料
            const snapshot = await db.collection("results").get();
            
            document.getElementById('loader').style.display = "none";
            document.getElementById('main-table').style.display = "table";
            document.getElementById('status-box').style.display = "flex";
            document.getElementById('data-count').innerText = snapshot.size;

            tbody.innerHTML = "";
            
            // 將資料轉存成陣列並依時間排序 (最新在最上面)
            let dataArray = [];
            snapshot.forEach(doc => {
                dataArray.push({ id: doc.id, ...doc.data() });
            });
            dataArray.sort((a, b) => new Date(b.completionTime) - new Date(a.completionTime));

            // 渲染表格
            dataArray.forEach(d => {
                const totalCount = d.totalTrials || 0;
                const acc = d.accuracy !== undefined ? d.accuracy : 0;
                const isMobile = d.device === 'mobile';
                const deviceIcon = isMobile ? '<i class="fas fa-mobile-alt"></i> 手機' : '<i class="fas fa-desktop"></i> 電腦';
                const deviceClass = isMobile ? 'device-tag' : 'device-tag device-pc';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${d.subjectId || d.id}</strong></td>
                    <td>${d.completionTime || '未知時間'}</td>
                    <td><span class="${deviceClass}">${deviceIcon}</span></td>
                    <td>${totalCount}</td>
                    <td><span style="color: ${acc >= 80 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">${acc}%</span></td>
                    <td class="action-group">
                        <button class="btn btn-excel" onclick="downloadSingleExcel('${d.id}', '${d.subjectId || d.id}')">
                            <i class="fas fa-file-excel"></i> 匯出 Excel
                        </button>
                        <button class="btn btn-delete" onclick="deleteEntry('${d.id}', '${d.subjectId || d.id}')">
                            <i class="fas fa-trash-alt"></i> 刪除
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error(e);
            alert("讀取失敗：" + e.message);
        }
    }

    // 3. 刪除功能
    async function deleteEntry(docId, name) {
        if (confirm(`⚠️ 警告：確定要刪除受試者「${name}」的數據嗎？\n刪除後將無法恢復！`)) {
            try {
                await db.collection("results").doc(docId).delete();
                alert("✅ 數據已安全刪除");
                location.reload(); // 刪除後自動重新整理頁面
            } catch (e) {
                alert("❌ 刪除失敗：" + e.message);
            }
        }
    }

    // 4. 單筆下載 Excel 功能 (整合 Trials 試次資料與 Feedback 疑義表單)
    async function downloadSingleExcel(docId, subjectId) {
        try {
            const doc = await db.collection("results").doc(docId).get();
            if (!doc.exists) {
                alert("找不到該筆資料！");
                return;
            }
            const data = doc.data();
            const wb = XLSX.utils.book_new();

            // 第一個工作表：120 題的詳細反應數據
            if (data.trialsData && data.trialsData.length > 0) {
                const wsTrials = XLSX.utils.json_to_sheet(data.trialsData);
                XLSX.utils.book_append_sheet(wb, wsTrials, "詳細試次 (Trials)");
            }

            // 第二個工作表：受試者的疑義覆核表單與文字回饋
            if (data.feedback && Object.keys(data.feedback).length > 0) {
                // 將物件格式轉換成陣列，方便匯出 Excel
                const feedbackArray = Object.keys(data.feedback).map(key => ({
                    "題目/欄位": key,
                    "受試者填寫內容": data.feedback[key] === true ? "有疑義 (已勾選)" : data.feedback[key]
                }));
                const wsFeedback = XLSX.utils.json_to_sheet(feedbackArray);
                XLSX.utils.book_append_sheet(wb, wsFeedback, "疑義覆核與回饋");
            }

            // 下載檔案
            XLSX.writeFile(wb, `語意飽和實驗數據_${subjectId}.xlsx`);
        } catch (e) {
            console.error(e);
            alert("匯出失敗：" + e.message);
        }
    }

    // 網頁載入後立即獲取數據
    fetchData();
</script>

</body>
</html>
