// 配置常數
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbw1rSfL-pIZrxVQlwgKE8iaGOLG7kYvb6QjQ_l0ZHEtKQzJfjSFRMqY9I12Ahq3AMhr/exec',
    DEFAULT_IMAGE: 'https://i.ibb.co/qL40sXF3/Chat-GPT-Image-2025-4-5-06-00-55.png',
    MAX_RATING: 5
  };
  
  // DOM 加載完成後初始化
  document.addEventListener('DOMContentLoaded', function() {
    initApp();
  });
  
  function initApp() {
    // 載入現有食譜
    loadRecipes();
    
    // 設置評分系統
    setupRatingSystem();
    
    // 綁定事件監聽器
    bindEventListeners();
    
    // 隱藏加載指示器
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
    }, 500);
  }
  
  function setupRatingSystem() {
    // 美味度評分
    const tasteStars = document.querySelectorAll('#taste-rating .star');
    const tasteHiddenInput = document.getElementById('taste-rating-value');
    
    // 難易度評分
    const difficultyStars = document.querySelectorAll('#difficulty-rating .star');
    const difficultyHiddenInput = document.getElementById('difficulty-rating-value');
    
    // 設置評分事件
    setupStars(tasteStars, tasteHiddenInput);
    setupStars(difficultyStars, difficultyHiddenInput);
  }
  
  function setupStars(stars, hiddenInput) {
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        const value = index + 1;
        hiddenInput.value = value;
        updateStarsDisplay(stars, value);
      });
    });
  }
  
  function updateStarsDisplay(stars, activeCount) {
    stars.forEach((star, index) => {
      star.classList.toggle('active', index < activeCount);
    });
  }
  
  function bindEventListeners() {
    // 表單提交
    document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    
    // 搜尋功能
    document.getElementById('search-input').addEventListener('input', function() {
      searchRecipes(this.value);
    });
    
    // 取消編輯按鈕
    document.getElementById('cancel-edit').addEventListener('click', resetForm);
    
    // 使用事件委派處理編輯和刪除按鈕
    document.getElementById('records-container').addEventListener('click', function(e) {
      const card = e.target.closest('.record-card');
      if (!card) return;
      
      const recipeId = card.dataset.id;
      
      if (e.target.classList.contains('btn-edit')) {
        loadRecipeForEditing(recipeId);
      } else if (e.target.classList.contains('btn-delete')) {
        deleteRecipe(recipeId);
      }
    });
  }
  
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = getFormData();
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
      showMessage(errors.join('<br>'), 'error');
      return;
    }
    
    try {
      if (formData.id) {
        await updateRecipe(formData);
      } else {
        await addRecipe(formData);
      }
      
      // 重置表單並刷新列表
      resetForm();
      await loadRecipes();
      
    } catch (error) {
      console.error('表單提交錯誤:', error);
      showMessage(`操作失敗: ${error.message}`, 'error');
    }
  }
  
  function getFormData() {
    return {
      id: document.getElementById('recipe-id').value,
      dishName: document.getElementById('dish-name').value.trim(),
      cookingDate: document.getElementById('cooking-date').value,
      dishImage: document.getElementById('dish-image').value.trim(),
      tasteRating: parseInt(document.getElementById('taste-rating-value').value) || 0,
      difficultyRating: parseInt(document.getElementById('difficulty-rating-value').value) || 0,
      ingredients: document.getElementById('ingredients').value.split(',').map(i => i.trim()).filter(i => i),
      steps: document.getElementById('steps').value.trim(),
      notes: document.getElementById('notes').value.trim()
    };
  }
  
  function validateForm(formData) {
    const errors = [];
    
    if (!formData.dishName) errors.push('請輸入料理名稱');
    if (!formData.cookingDate) errors.push('請選擇烹飪日期');
    if (formData.ingredients.length === 0) errors.push('請至少輸入一種食材');
    if (!formData.steps) errors.push('請輸入烹飪步驟');
    
    return errors;
  }
  
  async function addRecipe(recipeData) {
    showMessage('正在保存食譜...', 'info');
    
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        料理名稱: recipeData.dishName,
        烹飪日期: recipeData.cookingDate,
        圖片URL: recipeData.dishImage,
        美味度: recipeData.tasteRating,
        難易度: recipeData.difficultyRating,
        食材: recipeData.ingredients.join(','),
        步驟: recipeData.steps,
        備註: recipeData.notes
      }),
      mode: 'no-cors'
    });
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(result.message || '保存食譜失敗');
    }
    
    showMessage('食譜保存成功!', 'success');
  }
  
  async function updateRecipe(recipeData) {
    showMessage('正在更新食譜...', 'info');
    
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        ID: recipeData.id,
        料理名稱: recipeData.dishName,
        烹飪日期: recipeData.cookingDate,
        圖片URL: recipeData.dishImage,
        美味度: recipeData.tasteRating,
        難易度: recipeData.difficultyRating,
        食材: recipeData.ingredients.join(','),
        步驟: recipeData.steps,
        備註: recipeData.notes
      }),
      mode: 'no-cors'
    });
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(result.message || '更新食譜失敗');
    }
    
    showMessage('食譜更新成功!', 'success');
  }
  
  async function loadRecipes() {
    try {
      showMessage('正在載入食譜...', 'info');
      
      const response = await fetch(CONFIG.API_URL);
      const result = await response.json();
      
      if (result.status === 'success') {
        renderRecipes(result.data || []);
        updateRecordsCount(result.data.length);
        showMessage(`已載入 ${result.data.length} 個食譜`, 'success', 2000);
      } else {
        throw new Error(result.message || '載入食譜失敗');
      }
    } catch (error) {
      console.error('載入食譜失敗:', error);
      showMessage(`載入失敗: ${error.message}`, 'error');
      renderRecipes([]);
    }
  }
  
  function updateRecordsCount(count) {
    const countElement = document.getElementById('records-count');
    if (countElement) {
      countElement.textContent = `${count} 個記錄`;
    }
  }
  
  function renderRecipes(recipes) {
    const container = document.getElementById('records-container');
    
    if (!recipes || recipes.length === 0) {
      const searchText = document.getElementById('search-input').value;
      container.innerHTML = `
        <div class="no-records">
          <img src="${CONFIG.DEFAULT_IMAGE}" alt="暫無記錄" class="no-records-img">
          <div class="no-records-text">
            <h3>${searchText ? '沒有找到匹配的料理' : '還沒有任何記錄喔～'}</h3>
            <p>快來記錄你的第一道魔法料理吧！</p>
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = recipes.map(recipe => `
      <div class="record-card" data-id="${recipe.ID}">
        <div class="record-header">
          <h3>${recipe.料理名稱}</h3>
          <span class="record-date">${formatDate(recipe.創建時間 || recipe.烹飪日期)}</span>
        </div>
        
        <div class="record-ratings">
          <div class="rating-item">
            <span>美味度:</span>
            <div class="stars">${renderStars(recipe.美味度)}</div>
          </div>
          <div class="rating-item">
            <span>難易度:</span>
            <div class="stars">${renderStars(recipe.難易度, '✨')}</div>
          </div>
        </div>
        
        ${recipe.圖片URL ? `<img src="${recipe.圖片URL}" alt="${recipe.料理名稱}" class="recipe-image">` : ''}
        
        <div class="recipe-ingredients">
          <h4>食材:</h4>
          <div class="ingredients-list">
            ${recipe.食材.split(',').map(item => `<span class="ingredient-tag">${item.trim()}</span>`).join('')}
          </div>
        </div>
        
        <div class="recipe-steps">
          <h4>步驟:</h4>
          <p>${recipe.步驟.replace(/\n/g, '<br>')}</p>
        </div>
        
        ${recipe.備註 ? `
        <div class="recipe-notes">
          <h4>備註:</h4>
          <p>${recipe.備註}</p>
        </div>` : ''}
        
        <div class="recipe-actions">
          <button class="btn-edit">✏️ 編輯</button>
          <button class="btn-delete">🗑️ 刪除</button>
        </div>
      </div>
    `).join('');
  }
  
  function renderStars(count, activeChar = '⭐', inactiveChar = '☆') {
    return activeChar.repeat(count) + inactiveChar.repeat(CONFIG.MAX_RATING - count);
  }
  
  function formatDate(dateString) {
    if (!dateString) return '無日期';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-TW', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '-');
    } catch {
      return dateString;
    }
  }
  
  async function loadRecipeForEditing(recipeId) {
    try {
      showMessage('正在載入食譜資料...', 'info');
      
      const response = await fetch(`${CONFIG.API_URL}?action=getOne&id=${recipeId}`);
      const result = await response.json();
      
      if (result.status !== 'success' || !result.data) {
        throw new Error(result.message || '食譜資料載入失敗');
      }
      
      const recipe = result.data;
      populateForm(recipe);
      
      document.getElementById('recipe-form').scrollIntoView({ behavior: 'smooth' });
      showMessage(`正在編輯: ${recipe.料理名稱}`, 'success');
      
    } catch (error) {
      console.error('載入食譜失敗:', error);
      showMessage(`載入失敗: ${error.message}`, 'error');
    }
  }
  
  function populateForm(recipe) {
    document.getElementById('recipe-id').value = recipe.ID;
    document.getElementById('dish-name').value = recipe.料理名稱;
    document.getElementById('cooking-date').value = recipe.烹飪日期;
    document.getElementById('dish-image').value = recipe.圖片URL || '';
    document.getElementById('ingredients').value = recipe.食材;
    document.getElementById('steps').value = recipe.步驟;
    document.getElementById('notes').value = recipe.備註 || '';
    
    document.getElementById('taste-rating-value').value = recipe.美味度 || 0;
    document.getElementById('difficulty-rating-value').value = recipe.難易度 || 0;
    
    updateStarsDisplay(
      document.querySelectorAll('#taste-rating .star'),
      recipe.美味度 || 0
    );
    updateStarsDisplay(
      document.querySelectorAll('#difficulty-rating .star'),
      recipe.難易度 || 0
    );
    
    document.querySelector('.form-submit-btn').textContent = '💾 更新食譜';
    document.getElementById('cancel-edit').style.display = 'inline-block';
  }
  
  async function deleteRecipe(recipeId) {
    if (!confirm('確定要永久刪除此食譜嗎？此操作無法復原！')) return;
    
    try {
      showMessage('正在刪除食譜...', 'info');
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          ID: recipeId
        }),
        mode: 'no-cors'
      });
      
      const text = await response.text();
      let result;
      try {
        result = text ? JSON.parse(text) : { status: 'success' };
      } catch {
        result = { status: 'success' };
      }
      
      if (result.status === "success") {
        showMessage('食譜已刪除', 'success');
        loadRecipes();
      } else {
        throw new Error(result.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除食譜失敗:', error);
      showMessage(`刪除失敗: ${error.message}`, 'error');
    }
  }
  
  async function searchRecipes(keyword) {
    if (!keyword.trim()) {
      await loadRecipes();
      return;
    }
    
    try {
      const response = await fetch(`${CONFIG.API_URL}?search=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        renderRecipes(result.data || []);
        updateRecordsCount(result.data.length);
        showMessage(`找到 ${result.data.length} 個匹配結果`, 'success', 2000);
      } else {
        throw new Error(result.message || '搜尋失敗');
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
      showMessage(`搜尋失敗: ${error.message}`, 'error');
    }
  }
  
  function resetForm() {
    document.getElementById('recipe-form').reset();
    document.getElementById('recipe-id').value = '';
    
    document.getElementById('taste-rating-value').value = '0';
    document.getElementById('difficulty-rating-value').value = '0';
    updateStarsDisplay(document.querySelectorAll('#taste-rating .star'), 0);
    updateStarsDisplay(document.querySelectorAll('#difficulty-rating .star'), 0);
    
    document.querySelector('.form-submit-btn').textContent = '✏️ 新增食譜';
    document.getElementById('cancel-edit').style.display = 'none';
    
    showMessage('表單已重置', 'info', 2000);
  }
  
  function showMessage(text, type = 'info', duration = 3000) {
    const messageBox = document.createElement('div');
    messageBox.className = `message ${type}`;
    messageBox.innerHTML = text;
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => messageBox.classList.add('show'), 10);
    
    setTimeout(() => {
      messageBox.classList.remove('show');
      setTimeout(() => messageBox.remove(), 500);
    }, duration);
  }