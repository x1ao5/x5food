// 初始化應用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化本地儲存
    initializeStorage();
    
    // 載入現有食譜
    loadRecipes();
    
    // 設置評分系統
    setupRating('taste-rating', 'taste-rating-value');
    setupRating('difficulty-rating', 'difficulty-rating-value');
    
    // 表單提交事件
    document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    
    // 搜尋功能
    document.getElementById('search-input').addEventListener('input', function() {
        searchRecipes(this.value);
    });
    
    // 取消編輯按鈕
    document.getElementById('cancel-edit').addEventListener('click', resetForm);
    
    // 使用事件委派處理編輯和刪除按鈕
    document.getElementById('records-container').addEventListener('click', handleRecordActions);
});

// 初始化本地儲存
function initializeStorage() {
    try {
        const existingData = localStorage.getItem('recipes');
        if (!existingData) {
            localStorage.setItem('recipes', JSON.stringify([]));
        } else {
            // 驗證現有數據格式
            const parsed = JSON.parse(existingData);
            if (!Array.isArray(parsed)) {
                console.warn('現有數據格式不正確，重置為空陣列');
                localStorage.setItem('recipes', JSON.stringify([]));
            }
        }
    } catch (e) {
        console.error('初始化儲存失敗:', e);
        localStorage.setItem('recipes', JSON.stringify([]));
    }
}

// 表單提交處理
function handleFormSubmit(e) {
    e.preventDefault();
    const recipeId = document.getElementById('recipe-id').value;
    
    try {
        if (recipeId) {
            updateRecipe(recipeId);
        } else {
            saveRecipe();
        }
    } catch (error) {
        console.error('表單提交錯誤:', error);
        showMessage('操作失敗，請檢查控制台', 'warning');
    }
}

// 記錄操作處理
function handleRecordActions(e) {
    const card = e.target.closest('.record-card');
    if (!card) return;
    
    const id = card.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
        loadRecipeToForm(id);
    } else if (e.target.classList.contains('btn-delete')) {
        deleteRecipe(id);
    }
}

// 設置評分系統
function setupRating(ratingId, hiddenInputId) {
    const stars = document.querySelectorAll(`#${ratingId} .star`);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            hiddenInput.value = value;
            updateStarDisplay(stars, value);
        });
    });
}

// 更新星星顯示
function updateStarDisplay(stars, value) {
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < value);
    });
}

// 保存新食譜
function saveRecipe() {
    const recipeData = getFormData();
    
    // 驗證必填字段
    if (!recipeData.dishName || !recipeData.cookingDate) {
        showMessage('請填寫料理名稱和日期', 'warning');
        return;
    }
    
    const recipes = JSON.parse(localStorage.getItem('recipes'));
    
    recipes.push({
        ...recipeData,
        id: Date.now(),
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('recipes', JSON.stringify(recipes));
    loadRecipes();
    resetForm();
    showMessage('食譜已成功保存！', 'success');
}

// 更新現有食譜
function updateRecipe(id) {
    const recipes = JSON.parse(localStorage.getItem('recipes'));
    const index = recipes.findIndex(r => r.id === parseInt(id));
    
    if (index !== -1) {
        recipes[index] = {
            ...recipes[index],
            ...getFormData()
        };
        
        localStorage.setItem('recipes', JSON.stringify(recipes));
        loadRecipes();
        resetForm();
        showMessage('食譜已成功更新！', 'success');
    }
}

// 獲取表單數據
function getFormData() {
    return {
        dishName: document.getElementById('dish-name').value,
        cookingDate: document.getElementById('cooking-date').value,
        dishImage: document.getElementById('dish-image').value,
        tasteRating: parseInt(document.getElementById('taste-rating-value').value),
        difficultyRating: parseInt(document.getElementById('difficulty-rating-value').value),
        ingredients: document.getElementById('ingredients').value.split(',').map(i => i.trim()).filter(i => i),
        steps: document.getElementById('steps').value,
        notes: document.getElementById('notes').value
    };
}

// 載入食譜到表單
function loadRecipeToForm(id) {
    const recipes = JSON.parse(localStorage.getItem('recipes'));
    const recipe = recipes.find(r => r.id === parseInt(id));
    
    if (recipe) {
        // 設置表單值
        document.getElementById('recipe-id').value = recipe.id;
        document.getElementById('dish-name').value = recipe.dishName;
        document.getElementById('cooking-date').value = recipe.cookingDate;
        document.getElementById('dish-image').value = recipe.dishImage || '';
        document.getElementById('ingredients').value = recipe.ingredients.join(', ');
        document.getElementById('steps').value = recipe.steps;
        document.getElementById('notes').value = recipe.notes || '';
        
        // 設置評分
        document.getElementById('taste-rating-value').value = recipe.tasteRating;
        document.getElementById('difficulty-rating-value').value = recipe.difficultyRating;
        updateStarDisplay(document.querySelectorAll('#taste-rating .star'), recipe.tasteRating);
        updateStarDisplay(document.querySelectorAll('#difficulty-rating .star'), recipe.difficultyRating);
        
        // 更新UI狀態
        document.querySelector('.btn').textContent = '💾 更新記錄';
        document.getElementById('cancel-edit').style.display = 'inline-block';
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        showMessage(`正在編輯: ${recipe.dishName}`, 'info');
    }
}

// 刪除食譜
function deleteRecipe(id) {
    if (confirm('確定要刪除這道料理的記錄嗎？')) {
        const recipes = JSON.parse(localStorage.getItem('recipes'));
        const updatedRecipes = recipes.filter(r => r.id !== parseInt(id));
        
        localStorage.setItem('recipes', JSON.stringify(updatedRecipes));
        loadRecipes();
        showMessage('料理記錄已刪除', 'warning');
    }
}

// 搜尋食譜
function searchRecipes(keyword) {
    const recipes = JSON.parse(localStorage.getItem('recipes'));
    const filtered = keyword ? recipes.filter(r => 
        r.dishName.toLowerCase().includes(keyword.toLowerCase()) || 
        r.ingredients.some(i => i.toLowerCase().includes(keyword.toLowerCase()))
    ) : recipes;
    
    renderRecipes(filtered);
}

// 渲染食譜列表
function renderRecipes(recipes) {
    const container = document.getElementById('records-container');
    
    if (recipes.length === 0) {
        const searchText = document.getElementById('search-input').value;
        container.innerHTML = `
            <div class="no-records">
                <img src="https://i.ibb.co/qL40sXF3/Chat-GPT-Image-2025-4-5-06-00-55.png" alt="龍貓" class="totoro-img">
                <p>${searchText ? '沒有找到匹配的料理' : '還沒有任何記錄喔～'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recipes.map(recipe => `
        <div class="record-card" data-id="${recipe.id}">
            <div class="record-header">
                <h3 class="record-title">${recipe.dishName}</h3>
                <div class="record-date">${formatDate(recipe.cookingDate)}</div>
            </div>
            <div class="record-rating">
                <div>美味度: ${'⭐'.repeat(recipe.tasteRating)}${'☆'.repeat(5 - recipe.tasteRating)}</div>
                <div>難易度: ${'✨'.repeat(recipe.difficultyRating)}${'☆'.repeat(5 - recipe.difficultyRating)}</div>
            </div>
            ${recipe.dishImage ? `<img src="${recipe.dishImage}" alt="${recipe.dishName}" class="food-image">` : ''}
            <div class="record-ingredients">
                ${recipe.ingredients.map(i => `<span>${i}</span>`).join('')}
            </div>
            <div class="record-steps">
                <p>${recipe.steps.replace(/\n/g, '<br>')}</p>
            </div>
            ${recipe.notes ? `<div class="record-notes">${recipe.notes}</div>` : ''}
            <div class="record-actions">
                <button class="btn-edit">✏️ 編輯</button>
                <button class="btn-delete">🗑️ 刪除</button>
            </div>
        </div>
    `).join('');
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 重置表單
function resetForm() {
    document.getElementById('recipe-form').reset();
    document.getElementById('recipe-id').value = '';
    document.getElementById('taste-rating-value').value = '0';
    document.getElementById('difficulty-rating-value').value = '0';
    updateStarDisplay(document.querySelectorAll('.star'), 0);
    
    document.querySelector('.btn').textContent = '✏️ 保存記錄';
    document.getElementById('cancel-edit').style.display = 'none';
    document.querySelector('.btn-secondary').textContent = '🌀 重新開始';
}

// 顯示訊息
function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => message.classList.add('show'), 10);
    setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => message.remove(), 500);
    }, 3000);
}

// 載入所有記錄
function loadRecipes() {
    try {
        const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
        renderRecipes(recipes);
    } catch (e) {
        console.error('載入食譜失敗:', e);
        showMessage('載入食譜失敗，請檢查控制台', 'warning');
    }
}