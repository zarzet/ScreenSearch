document.addEventListener('DOMContentLoaded', async function() {
  const captureBtn = document.getElementById('captureBtn');
  const captureFullBtn = document.getElementById('captureFullBtn');
  const screenshotContainer = document.getElementById('screenshotContainer');
  const screenshotPreview = document.getElementById('screenshotPreview');
  const cropCanvas = document.getElementById('cropCanvas');
  const cropBtn = document.getElementById('cropBtn');
  const resetBtn = document.getElementById('resetBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultContainer = document.getElementById('resultContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const aiResponse = document.getElementById('aiResponse');
  const newSearchBtn = document.getElementById('newSearchBtn');
  const cropControls = document.getElementById('cropControls');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevel = document.getElementById('zoomLevel');
  const finishCropBtn = document.getElementById('finishCropBtn');
  const cancelCropBtn = document.getElementById('cancelCropBtn');
  const cropHistory = document.getElementById('cropHistory');
  const cropThumbnails = document.getElementById('cropThumbnails');

  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const messagesContainer = document.getElementById('messagesContainer');

  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
  const sessionListContainer = document.getElementById('sessionListContainer');
  const sessionList = document.getElementById('sessionList');
  const chatContainer = document.getElementById('chatContainer');

  viewHistoryBtn.addEventListener('click', showSessionList);
  backFromHistoryBtn.addEventListener('click', showChat);

  const viewHistoryBtnMain = document.getElementById('viewHistoryBtnMain');
  const backFromHistoryMainBtn = document.getElementById('backFromHistoryMainBtn');
  const sessionListContainerMain = document.getElementById('sessionListContainerMain');
  const sessionListMain = document.getElementById('sessionListMain');
  const buttonsContainer = document.querySelector('.buttons');

  viewHistoryBtnMain.addEventListener('click', showMainSessionList);
  backFromHistoryMainBtn.addEventListener('click', showMainInitial);

  const githubBtn = document.getElementById('githubBtn');
  githubBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://github.com/zarzet' });
  });

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsContainer = document.getElementById('settingsContainer');
  const backFromSettingsBtn = document.getElementById('backFromSettingsBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const apiKeyStatus = document.getElementById('apiKeyStatus');

  settingsBtn.addEventListener('click', showSettings);
  backFromSettingsBtn.addEventListener('click', showMainInitial);
  toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  saveSettingsBtn.addEventListener('click', saveApiKey);
  testApiKeyBtn.addEventListener('click', testApiKey);

  function renderSessionListMain() {
    sessionListMain.innerHTML = '';
    getStoredSessions().forEach((session, idx) => {
      const item = document.createElement('div');
      item.className = 'session-item';
      

      const titleElement = document.createElement('div');
      titleElement.className = 'session-title';
      titleElement.textContent = session.title || generateFallbackTitle(session.history || []);
      
      const dateElement = document.createElement('div');
      dateElement.className = 'session-date';
      dateElement.textContent = new Date(session.timestamp).toLocaleString();
      
      item.appendChild(titleElement);
      item.appendChild(dateElement);
      item.addEventListener('click', () => loadSessionFromMain(idx));
      sessionListMain.appendChild(item);
    });
  }

  async function showMainSessionList() {
    if (!suppressSave) await saveCurrentSession();
    suppressSave = false;
    buttonsContainer.classList.add('hidden');
    screenshotContainer.classList.add('hidden');
    settingsContainer.classList.add('hidden');
    sessionListContainerMain.classList.remove('hidden');
    
    updateLegacySessions().catch(console.error);
    
    renderSessionListMain();
  }

  function showMainInitial() {
    sessionListContainerMain.classList.add('hidden');
    settingsContainer.classList.add('hidden');
    buttonsContainer.classList.remove('hidden');
    screenshotContainer.classList.remove('hidden');
    const developerCredit = document.querySelector('.developer-credit');
    if (developerCredit) {
      developerCredit.style.display = '';
    }
  }

  function showSettings() {
    buttonsContainer.classList.add('hidden');
    screenshotContainer.classList.add('hidden');
    settingsContainer.classList.remove('hidden');
    const developerCredit = document.querySelector('.developer-credit');
    if (developerCredit) {
      developerCredit.style.display = 'none';
    }
    loadCurrentApiKey();
  }

  function toggleApiKeyVisibility() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.innerHTML = '<i class="material-icons">visibility_off</i>';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.innerHTML = '<i class="material-icons">visibility</i>';
    }
  }

  async function loadCurrentApiKey() {
    try {
      const currentKey = config.getApiKey();
      if (currentKey) {
        const maskedKey = currentKey.substring(0, 8) + '•'.repeat(Math.max(currentKey.length - 8, 8));
        apiKeyInput.value = maskedKey;
        updateApiKeyStatus('API key is set', 'success');
      } else {
        apiKeyInput.value = '';
        updateApiKeyStatus('No API key set', 'info');
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      updateApiKeyStatus('Error loading API key', 'error');
    }
  }

  async function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    
    if (!newApiKey) {
      updateApiKeyStatus('Please enter an API key', 'error');
      return;
    }

    if (newApiKey.includes('•')) {
      updateApiKeyStatus('API key is already saved', 'success');
      return;
    }

    if (!newApiKey.startsWith('AIzaSy') || newApiKey.length < 30) {
      updateApiKeyStatus('Invalid API key format. Should start with "AIzaSy"', 'error');
      return;
    }

    try {
      await config.saveApiKey(newApiKey);
      
      const maskedKey = newApiKey.substring(0, 8) + '•'.repeat(Math.max(newApiKey.length - 8, 8));
      apiKeyInput.value = maskedKey;
      
      updateApiKeyStatus('API key saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving API key:', error);
      updateApiKeyStatus('Error saving API key', 'error');
    }
  }

  async function testApiKey() {
    const currentApiKey = config.getApiKey();
    
    if (!currentApiKey) {
      updateApiKeyStatus('No API key to test', 'error');
      return;
    }

    updateApiKeyStatus('Testing API key...', 'info');
    testApiKeyBtn.disabled = true;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Hello" }]
          }],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      });

      if (response.ok) {
        updateApiKeyStatus('API key is working correctly!', 'success');
      } else {
        const errorData = await response.json();
        updateApiKeyStatus(`API key test failed: ${errorData.error?.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      updateApiKeyStatus('Error testing API key: Network error', 'error');
    } finally {
      testApiKeyBtn.disabled = false;
    }
  }

  function updateApiKeyStatus(message, type) {
    apiKeyStatus.textContent = message;
    apiKeyStatus.className = `status-text ${type}`;
  }

  function loadSessionFromMain(index) {
    buttonsContainer.classList.add('hidden');
    screenshotContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    loadSession(index);
    sessionListContainerMain.classList.add('hidden');
  }

  function getStoredSessions() {
    const data = localStorage.getItem('chatSessions');
    return data ? JSON.parse(data) : [];
  }

  async function generateSessionTitle(history) {
    console.log('Generating title for session with', history.length, 'messages');
    
    try {
      const apiKey = config.getApiKey();
      console.log('API key available:', !!apiKey);
      
      if (!apiKey || history.length === 0) {
        console.log('Using fallback title - no API key or empty history');
        return generateFallbackTitle(history);
      }

      const conversationSummary = history
        .slice(0, 4)
        .map(msg => `${msg.role}: ${msg.content.substring(0, 200)}`)
        .join('\n');

      console.log('Conversation summary for title:', conversationSummary.substring(0, 100) + '...');

      const titlePrompt = `Based on this conversation, generate a short, descriptive title (maximum 50 characters). Focus on the main topic or question being discussed. Return only the title, no quotes or explanations.

Conversation:
${conversationSummary}

Title:`;

      const requestBody = JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: titlePrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 16,
          topP: 0.8,
          maxOutputTokens: 50
        }
      });

      console.log('Sending title generation request to AI...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      const data = await response.json();
      console.log('AI response for title:', data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        let title = data.candidates[0].content.parts[0].text.trim();
        title = title.replace(/['"]/g, '').substring(0, 50);
        console.log('Generated title:', title);
        return title || generateFallbackTitle(history);
      } else {
        console.log('Invalid AI response, using fallback');
        return generateFallbackTitle(history);
      }
    } catch (error) {
      console.log('Failed to generate AI title, using fallback:', error);
    }
    
    return generateFallbackTitle(history);
  }

  function generateFallbackTitle(history) {
    console.log('Generating fallback title for', history.length, 'messages');
    
    if (history.length === 0) {
      console.log('Empty chat - using default title');
      return 'Empty Chat';
    }
    
    const firstUserMessage = history.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      console.log('First user message:', firstUserMessage.content.substring(0, 50) + '...');
      let content = firstUserMessage.content.replace(/[^\w\s]/g, '').toLowerCase();
      
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those', 'analyze', 'image', 'screenshot', 'picture'];
      const words = content.split(' ')
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 3);
      
      console.log('Extracted keywords:', words);
      
      if (words.length > 0) {
        const title = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        console.log('Fallback title from keywords:', title);
        return title;
      }
    }
    
    const title = `Chat ${new Date().toLocaleDateString()}`;
    console.log('Using date-based fallback title:', title);
    return title;
  }

  async function saveCurrentSession() {
    console.log('Saving current session with', conversationHistory.length, 'messages');
    
    if (!conversationHistory.length) {
      console.log('No conversation history to save');
      return;
    }
    
    const sessions = getStoredSessions();
    const currentStr = JSON.stringify(conversationHistory);
    
    if (sessions.length > 0 && JSON.stringify(sessions[0].history) === currentStr) {
      console.log('Skipping save - duplicate session detected');
      return;
    }
    
    console.log('Generating title for new session...');
    const title = await generateSessionTitle(conversationHistory);
    console.log('Final title for session:', title);
    
    const newSession = { 
      timestamp: Date.now(), 
      history: conversationHistory,
      title: title
    };
    
    sessions.unshift(newSession);
    localStorage.setItem('chatSessions', JSON.stringify(sessions.slice(0, 10)));
    console.log('Session saved successfully with title:', title);
  }

  async function updateLegacySessions() {
    const sessions = getStoredSessions();
    let hasUpdates = false;
    
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      if (!session.title && session.history && session.history.length > 0) {
        console.log(`Updating legacy session ${i + 1} with AI title...`);
        session.title = await generateSessionTitle(session.history);
        hasUpdates = true;
      }
    }
    
    if (hasUpdates) {
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
      console.log('Updated legacy sessions with titles');
    }
  }

  function renderSessionList() {
    sessionList.innerHTML = '';
    getStoredSessions().forEach((session, idx) => {
      const item = document.createElement('div');
      item.className = 'session-item';
      

      const titleElement = document.createElement('div');
      titleElement.className = 'session-title';
      titleElement.textContent = session.title || generateFallbackTitle(session.history || []);
      
      const dateElement = document.createElement('div');
      dateElement.className = 'session-date';
      dateElement.textContent = new Date(session.timestamp).toLocaleString();
      
      item.appendChild(titleElement);
      item.appendChild(dateElement);
      item.addEventListener('click', () => loadSession(idx));
      sessionList.appendChild(item);
    });
  }

  async function showSessionList() {
    if (!suppressSave) await saveCurrentSession();
    suppressSave = false;
    chatContainer.classList.add('hidden');
    sessionListContainer.classList.remove('hidden');
    
    updateLegacySessions().catch(console.error);
    
    renderSessionList();
  }

  function showChat() {
    sessionListContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    const developerCredit = document.querySelector('.developer-credit');
    if (developerCredit) {
      developerCredit.style.display = 'none';
    }
  }

  function loadSession(index) {
    suppressSave = true;
    const sessions = getStoredSessions();
    const session = sessions[index];
    if (!session) return;
    conversationHistory = session.history.slice();
    messagesContainer.innerHTML = '';
    isLoadingSession = true;
    conversationHistory.forEach(msg => {
      addMessageToChat(msg.content, msg.role === 'user' ? 'user' : 'ai');
    });
    isLoadingSession = false;
    showChat();
  }

  let screenshotDataUrl = null;
  let originalScreenshotDataUrl = null;
  let isCropping = false;
  let ctx = null;
  let currentZoom = 1.0;
  let storedCrops = [];
  let activeCropIndex = -1;
  let isCapturingFullPage = false;
  let fullPageData = {
    scrollHeight: 0,
    scrollWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    currentScroll: 0,
    canvas: null,
    canvasContext: null,
    scrollsPerformed: 0,
    totalScrollsNeeded: 0
  };

  let conversationHistory = [];
  let suppressSave = false;
  let isLoadingSession = false;
  let currentImageBase64 = null;
  let isProcessing = false;
  const modelName = "gemini-2.5-flash";
  
  const systemPrompt = `You are ZARZ AI Chat, an AI assistant specialized in solving questions and problems shown in images. Your primary role is to:

**PRIORITY 1: QUESTION SOLVING**
- If the image contains any questions, problems, homework, tests, or exercises - SOLVE THEM IMMEDIATELY
- Focus on providing direct answers and step-by-step solutions
- Do NOT waste time describing what you see - jump straight to solving
- For math problems: show each calculation step clearly
- For text questions: provide complete, accurate answers
- For multiple choice: clearly state the correct answer with reasoning

**PRIORITY 2: EDUCATIONAL ASSISTANCE**
- Explain concepts when needed for understanding
- Provide formulas and principles used in solutions
- Give study tips for similar problems

**FORMATTING RULES:**
- Always use LaTeX for mathematical expressions:
- Inline math: $content$ 
- Display math: $$content$$
- Multi-line equations: use $$ and separate lines with \\\\
- Example: "- $x^2$" not "-$x^2$"
- Keep formatting simple and clean
- Use proper Markdown code blocks when showing code

**ONLY describe the image content if:**
- No questions/problems are visible in the image
- User specifically asks for description
- Context is needed to understand the problem

Remember: Your goal is to SOLVE and HELP, not just describe!`;

  let isAdjustableGridActive = false;
  let gridStartX = 0;
  let gridStartY = 0;
  let gridEndX = 0;
  let gridEndY = 0;
  let isDraggingGrid = false;
  let dragHandle = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const handleSize = 16;

  let cursorX = 0;
  let cursorY = 0;
  let showCursorDot = false;

  await config.init();
  
  if (config.getApiKey()) {
    console.log('API key loaded successfully');
  } else {
    console.log('No API key found. Please set it in Settings.');
  }

  captureBtn.addEventListener('click', captureVisibleScreenshot);

  captureFullBtn.addEventListener('click', captureFullPageScreenshot);

  cropBtn.addEventListener('click', function() {
    startCroppingMode();
  });

  resetBtn.addEventListener('click', function() {
    if (isCropping) {
      cancelCropping();
    } else {
      resetUI();
    }
  });

  analyzeBtn.addEventListener('click', analyzeImage);

  newSearchBtn.addEventListener('click', resetUI);

  zoomInBtn.addEventListener('click', function() {
    changeZoom(0.1);
  });

  zoomOutBtn.addEventListener('click', function() {
    changeZoom(-0.1);
  });

  finishCropBtn.addEventListener('click', finishCropping);

  cancelCropBtn.addEventListener('click', cancelCropping);

  sendBtn.addEventListener('click', sendMessage);

  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function startCroppingMode() {
    isCropping = true;
    currentZoom = 1.0;
    updateZoomDisplay();
    
    screenshotPreview.classList.add('hidden');
    cropCanvas.classList.remove('hidden');
    cropControls.classList.remove('hidden');
    
    const img = new Image();
    img.onload = function() {
      cropCanvas.width = img.width;
      cropCanvas.height = img.height;
      ctx = cropCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      gridStartX = Math.floor(cropCanvas.width * 0.25);
      gridStartY = Math.floor(cropCanvas.height * 0.25);
      gridEndX = Math.floor(cropCanvas.width * 0.75);
      gridEndY = Math.floor(cropCanvas.height * 0.75);
      
      drawAdjustableGrid();
      
      cropCanvas.addEventListener('mousedown', startGridDrag);
      cropCanvas.addEventListener('mousemove', updateGridDrag);
      cropCanvas.addEventListener('mouseup', endGridDrag);
      cropCanvas.addEventListener('mouseleave', endGridDrag);
      cropCanvas.addEventListener('mousemove', updateCursor);
    };
    img.src = screenshotDataUrl;
  }

  function cancelCropping() {
    isCropping = false;
    cropCanvas.classList.add('hidden');
    cropControls.classList.add('hidden');
    screenshotPreview.classList.remove('hidden');
    
    cropCanvas.removeEventListener('mousedown', startGridDrag);
    cropCanvas.removeEventListener('mousemove', updateGridDrag);
    cropCanvas.removeEventListener('mouseup', endGridDrag);
    cropCanvas.removeEventListener('mouseleave', endGridDrag);
    cropCanvas.removeEventListener('mousemove', updateCursor);
  }

  function finishCropping() {
    if (!isCropping) return;
    
    const croppedCanvas = document.createElement('canvas');
    const width = Math.abs(gridEndX - gridStartX);
    const height = Math.abs(gridEndY - gridStartY);
    
    if (width < 10 || height < 10) {
      cancelCropping();
      return;
    }
    
    const startX = Math.min(gridStartX, gridEndX);
    const startY = Math.min(gridStartY, gridEndY);
    
    croppedCanvas.width = width;
    croppedCanvas.height = height;
    
    const croppedCtx = croppedCanvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      croppedCtx.drawImage(
        img,
        startX, startY, width, height,
        0, 0, width, height
      );
      
      const cropDataUrl = croppedCanvas.toDataURL('image/png');
      storedCrops.push(cropDataUrl);
      activeCropIndex = storedCrops.length - 1;
      
      screenshotDataUrl = cropDataUrl;
      screenshotPreview.src = cropDataUrl;
      
      updateCropHistory();
      
      isCropping = false;
      cropCanvas.classList.add('hidden');
      cropControls.classList.add('hidden');
      screenshotPreview.classList.remove('hidden');
      
      cropCanvas.removeEventListener('mousedown', startGridDrag);
      cropCanvas.removeEventListener('mousemove', updateGridDrag);
      cropCanvas.removeEventListener('mouseup', endGridDrag);
      cropCanvas.removeEventListener('mouseleave', endGridDrag);
      cropCanvas.removeEventListener('mousemove', updateCursor);
    };
    img.src = originalScreenshotDataUrl;
  }

  function drawAdjustableGrid() {
    if (!isCropping || !ctx) return;
    
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, 0, 0, cropCanvas.width, cropCanvas.height);
      
      const startX = Math.min(gridStartX, gridEndX);
      const startY = Math.min(gridStartY, gridEndY);
      const width = Math.abs(gridEndX - gridStartX);
      const height = Math.abs(gridEndY - gridStartY);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      ctx.fillRect(0, 0, cropCanvas.width, startY);
      ctx.fillRect(0, startY, startX, height);
      ctx.fillRect(startX + width, startY, cropCanvas.width - (startX + width), height);
      ctx.fillRect(0, startY + height, cropCanvas.width, cropCanvas.height - (startY + height));
      
      ctx.strokeStyle = '#4285f4';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, width, height);
      
      drawGridHandles(startX, startY, width, height);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(startX + width - 80, startY - 25, 80, 20);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(`${width} × ${height}px`, startX + width - 75, startY - 10);
    };
    img.src = originalScreenshotDataUrl;
  }
  
  function drawGridHandles(x, y, width, height) {
    ctx.fillStyle = '#4285f4';
    
    drawHandle(x, y);
    drawHandle(x + width, y);
    drawHandle(x, y + height);
    drawHandle(x + width, y + height);
    
    drawHandle(x + width/2, y);
    drawHandle(x, y + height/2);
    drawHandle(x + width, y + height/2);
    drawHandle(x + width/2, y + height);
  }
  
  function drawHandle(x, y) {
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
  }
  
  function getHandleAtPosition(x, y) {
    const startX = Math.min(gridStartX, gridEndX);
    const startY = Math.min(gridStartY, gridEndY);
    const endX = Math.max(gridStartX, gridEndX);
    const endY = Math.max(gridStartY, gridEndY);
    const width = endX - startX;
    const height = endY - startY;
    const midX = startX + width/2;
    const midY = startY + height/2;
    
    if (isPointInHandle(x, y, startX, startY)) return 'tl';
    if (isPointInHandle(x, y, endX, startY)) return 'tr';
    if (isPointInHandle(x, y, startX, endY)) return 'bl';
    if (isPointInHandle(x, y, endX, endY)) return 'br';
    
    if (isPointInHandle(x, y, midX, startY)) return 'tm';
    if (isPointInHandle(x, y, startX, midY)) return 'ml';
    if (isPointInHandle(x, y, endX, midY)) return 'mr';
    if (isPointInHandle(x, y, midX, endY)) return 'bm';
    
    if (x > startX && x < endX && y > startY && y < endY) {
      return 'move';
    }
    
    return null;
  }
  
  function isPointInHandle(x, y, handleX, handleY) {
    return (
      x >= handleX - handleSize/2 && 
      x <= handleX + handleSize/2 && 
      y >= handleY - handleSize/2 && 
      y <= handleY + handleSize/2
    );
  }
  

  function startGridDrag(e) {
    const rect = cropCanvas.getBoundingClientRect();
    

    const canvasScaleX = cropCanvas.width / rect.width;
    const canvasScaleY = cropCanvas.height / rect.height;
    

    const x = (e.clientX - rect.left) * canvasScaleX / currentZoom;
    const y = (e.clientY - rect.top) * canvasScaleY / currentZoom;
    
    
    

    dragHandle = getHandleAtPosition(x, y);
    
    
    if (dragHandle) {
      isDraggingGrid = true;
      dragOffsetX = x;
      dragOffsetY = y;
      

      if (dragHandle === 'move') {
        dragOffsetX = x - Math.min(gridStartX, gridEndX);
        dragOffsetY = y - Math.min(gridStartY, gridEndY);
      }
      

      e.preventDefault();
    }
  }
  

  function updateGridDrag(e) {
    if (!isDraggingGrid || !dragHandle) return;
    
    const rect = cropCanvas.getBoundingClientRect();
    

    const canvasScaleX = cropCanvas.width / rect.width;
    const canvasScaleY = cropCanvas.height / rect.height;
    

    const x = Math.max(0, Math.min(cropCanvas.width, (e.clientX - rect.left) * canvasScaleX / currentZoom));
    const y = Math.max(0, Math.min(cropCanvas.height, (e.clientY - rect.top) * canvasScaleY / currentZoom));
    
    
    

    switch (dragHandle) {
      case 'tl':
        gridStartX = x;
        gridStartY = y;
        break;
      case 'tr':
        gridEndX = x;
        gridStartY = y;
        break;
      case 'bl':
        gridStartX = x;
        gridEndY = y;
        break;
      case 'br':
        gridEndX = x;
        gridEndY = y;
        break;
      case 'tm':
        gridStartY = y;
        break;
      case 'ml':
        gridStartX = x;
        break;
      case 'mr':
        gridEndX = x;
        break;
      case 'bm':
        gridEndY = y;
        break;
      case 'move':
        const width = Math.abs(gridEndX - gridStartX);
        const height = Math.abs(gridEndY - gridStartY);
        const isEndXLarger = gridEndX > gridStartX;
        const isEndYLarger = gridEndY > gridStartY;
        

        const newLeft = Math.max(0, Math.min(cropCanvas.width - width, x - dragOffsetX));
        const newTop = Math.max(0, Math.min(cropCanvas.height - height, y - dragOffsetY));
        

        gridStartX = newLeft;
        gridStartY = newTop;
        gridEndX = isEndXLarger ? newLeft + width : newLeft - width;
        gridEndY = isEndYLarger ? newTop + height : newTop - height;
        

        break;
    }
    

    gridStartX = Math.max(0, Math.min(cropCanvas.width, gridStartX));
    gridStartY = Math.max(0, Math.min(cropCanvas.height, gridStartY));
    gridEndX = Math.max(0, Math.min(cropCanvas.width, gridEndX));
    gridEndY = Math.max(0, Math.min(cropCanvas.height, gridEndY));
    

    drawAdjustableGrid();
    

    e.preventDefault();
  }
  

  function endGridDrag(e) {
    if (isDraggingGrid) {

      isDraggingGrid = false;
      dragHandle = null;
      e.preventDefault();
    }
  }


  function updateCursor(e) {
    if (!isCropping) return;
    
    const rect = cropCanvas.getBoundingClientRect();
    


    const canvasScaleX = cropCanvas.width / rect.width;
    const canvasScaleY = cropCanvas.height / rect.height;
    

    const x = (e.clientX - rect.left) * canvasScaleX / currentZoom;
    const y = (e.clientY - rect.top) * canvasScaleY / currentZoom;
    
    const handle = getHandleAtPosition(x, y);
    

    switch (handle) {
      case 'tl':
      case 'br':
        cropCanvas.style.cursor = 'nwse-resize';
        break;
      case 'tr':
      case 'bl':
        cropCanvas.style.cursor = 'nesw-resize';
        break;
      case 'tm':
      case 'bm':
        cropCanvas.style.cursor = 'ns-resize';
        break;
      case 'ml':
      case 'mr':
        cropCanvas.style.cursor = 'ew-resize';
        break;
      case 'move':
        cropCanvas.style.cursor = 'move';
        break;
      default:
        cropCanvas.style.cursor = 'default';
    }
  }


  function captureVisibleScreenshot() {
    isCapturingFullPage = false;
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
      screenshotDataUrl = dataUrl;
      originalScreenshotDataUrl = dataUrl;
      screenshotPreview.src = dataUrl;
      
      captureBtn.parentElement.classList.add('hidden');
      screenshotContainer.classList.remove('hidden');
    });
  }


  function captureFullPageScreenshot() {
    isCapturingFullPage = true;
    

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      if (!activeTab) return;
      

      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        function: getPageDimensions
      }, function(results) {
        if (chrome.runtime.lastError || !results || !results[0]) {
          console.error(chrome.runtime.lastError || 'Failed to get page dimensions');
          return;
        }
        
        const dimensions = results[0].result;

        

        fullPageData.scrollHeight = dimensions.scrollHeight;
        fullPageData.scrollWidth = dimensions.scrollWidth;
        fullPageData.viewportHeight = dimensions.viewportHeight;
        fullPageData.viewportWidth = dimensions.viewportWidth;
        fullPageData.currentScroll = 0;
        fullPageData.scrollsPerformed = 0;
        

        fullPageData.totalScrollsNeeded = Math.ceil(dimensions.scrollHeight / dimensions.viewportHeight);
        

        fullPageData.canvas = document.createElement('canvas');
        fullPageData.canvas.width = dimensions.scrollWidth;
        fullPageData.canvas.height = dimensions.scrollHeight;
        fullPageData.canvasContext = fullPageData.canvas.getContext('2d');
        

        captureBtn.parentElement.classList.add('hidden');
        screenshotContainer.classList.remove('hidden');
        captureScrolledScreenshot(activeTab.id, 0);
      });
    });
  }


  function getPageDimensions() {
    return {
      scrollHeight: Math.max(
        document.body.scrollHeight, 
        document.documentElement.scrollHeight,
        document.body.offsetHeight, 
        document.documentElement.offsetHeight,
        document.body.clientHeight, 
        document.documentElement.clientHeight
      ),
      scrollWidth: Math.max(
        document.body.scrollWidth, 
        document.documentElement.scrollWidth,
        document.body.offsetWidth, 
        document.documentElement.offsetWidth,
        document.body.clientWidth, 
        document.documentElement.clientWidth
      ),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth
    };
  }


  function captureScrolledScreenshot(tabId, scrollPosition) {

    chrome.scripting.executeScript({
      target: {tabId: tabId},
      function: (scrollPos) => { window.scrollTo(0, scrollPos); },
      args: [scrollPosition]
    }, function() {

      setTimeout(function() {

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
          const img = new Image();
          img.onload = function() {

            const yPosition = Math.min(scrollPosition, fullPageData.scrollHeight - fullPageData.viewportHeight);
            

            fullPageData.canvasContext.drawImage(
              img, 
              0, 0, img.width, img.height,
              0, yPosition, fullPageData.viewportWidth, Math.min(fullPageData.viewportHeight, fullPageData.scrollHeight - yPosition)
            );
            
            fullPageData.scrollsPerformed++;
            

            if (fullPageData.scrollsPerformed < fullPageData.totalScrollsNeeded) {
              const nextScrollPosition = scrollPosition + fullPageData.viewportHeight;
              captureScrolledScreenshot(tabId, nextScrollPosition);
            } else {

              screenshotDataUrl = fullPageData.canvas.toDataURL('image/png');
              originalScreenshotDataUrl = screenshotDataUrl;
              screenshotPreview.src = screenshotDataUrl;
              

              chrome.scripting.executeScript({
                target: {tabId: tabId},
                function: () => { window.scrollTo(0, 0); }
              });
            }
          };
          img.src = dataUrl;
        });
      }, 150);
    });
  }


  function changeZoom(delta) {
    currentZoom = Math.max(0.1, Math.min(3.0, currentZoom + delta));
    updateZoomDisplay();
    

    if (isCropping) {
      cropCanvas.style.transformOrigin = 'top left';
      cropCanvas.style.transform = `scale(${currentZoom})`;
    }
  }


  function updateZoomDisplay() {
    zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
  }


  function updateCropHistory() {
    if (storedCrops.length > 0) {
      cropHistory.classList.remove('hidden');
      cropThumbnails.innerHTML = '';
      
      storedCrops.forEach((crop, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = crop;
        thumbnail.className = 'thumbnail' + (index === activeCropIndex ? ' active' : '');
        thumbnail.addEventListener('click', function() {
          activeCropIndex = index;
          screenshotDataUrl = storedCrops[index];
          screenshotPreview.src = screenshotDataUrl;
          

          document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
          });
          thumbnail.classList.add('active');
        });
        
        cropThumbnails.appendChild(thumbnail);
      });
    }
  }


  function analyzeImage() {

    loadingIndicator.classList.remove('hidden');
    screenshotContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    

    conversationHistory = [];
    messagesContainer.innerHTML = '';
    

    const base64data = screenshotDataUrl.split(',')[1];
    currentImageBase64 = base64data;
    

    sendToAI("Please analyze this image. If there are any questions, problems, or exercises visible, solve them step by step. If it's educational content, provide explanations and solutions.", true);
  }


  async function sendMessage() {
    if (isProcessing || !chatInput.value.trim()) return;
    
    const userMessage = chatInput.value.trim();
    chatInput.value = '';
    

    addMessageToChat(userMessage, 'user');
    

    await sendToAI(userMessage);
  }


  function addMessageToChat(message, sender) {

    if (sender === 'ai') {
      loadingIndicator.classList.add('hidden');

    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;


    let formattedMessage = message;
    formattedMessage = formattedMessage.replace(/```(\w+)?\n([\s\S]*?)```/g,
      '<pre><code class="language-$1">$2</code></pre>');


    formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g,
      '<strong>$1</strong>');


    formattedMessage = formattedMessage.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" target="_blank">${url}</a>`);


    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    messageElement.innerHTML = formattedMessage;
    messagesContainer.appendChild(messageElement);


    if (message.includes('$')) {
      renderMathInElement(messageElement, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }
    

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    

    if (!isLoadingSession) {
      conversationHistory.push({
        role: sender === 'user' ? 'user' : 'model',
        content: message
      });
    }
  }


  async function sendToAI(message, isInitialAnalysis = false) {
    isProcessing = true;
    

    loadingIndicator.classList.remove('hidden');
    
    try {

      const apiKey = config.getApiKey();
      if (!apiKey) {
        throw new Error('API key not found. Please set your Gemini API key in Settings.');
      }
      

      let requestContents = [];
      

      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      

      if (isInitialAnalysis || formattedHistory.length <= 1) {
        requestContents = [
          {
            role: "user",
            parts: [
              { 
                text: `${systemPrompt}\n\nNow analyze this image: ${message}`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: currentImageBase64
                }
              }
            ]
          }
        ];
      } else {


        const initialMessage = {
          role: "user",
          parts: [
            { 
              text: `${systemPrompt}\n\nThis is the image we're discussing:` 
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: currentImageBase64
              }
            }
          ]
        };
        

        const relevantHistory = formattedHistory.slice(1);
        

        const userMessage = {
          role: "user",
          parts: [{ text: message }]
        };
        
        requestContents = [initialMessage, ...relevantHistory, userMessage];
      }
      

      const requestBody = JSON.stringify({
        contents: requestContents,
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096
        }
      });
      

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      const data = await response.json();
      

      let aiResponse = '';
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
          
        aiResponse = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        aiResponse = `Error: ${data.error.message || 'Unknown error occurred'}`;
      } else {
        aiResponse = 'Unable to analyze the image. Please try again.';
      }
      

      loadingIndicator.classList.add('hidden');

      

      addMessageToChat(aiResponse, 'ai');
      
    } catch (error) {
      console.error('Error communicating with AI:', error);
      

      loadingIndicator.classList.add('hidden');
      

      addMessageToChat(`Error: ${error.message}. Please try again.`, 'ai');
    } finally {

      loadingIndicator.classList.add('hidden');

      isProcessing = false;
    }
  }


  function resetUI() {
    screenshotDataUrl = null;
    originalScreenshotDataUrl = null;
    isCropping = false;
    currentZoom = 1.0;
    storedCrops = [];
    activeCropIndex = -1;
    

    cropCanvas.style.transform = 'none';
    

    const developerCredit = document.querySelector('.developer-credit');
    if (developerCredit) {
      developerCredit.style.display = '';
    }
    

    captureBtn.parentElement.classList.remove('hidden');
    screenshotContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    settingsContainer.classList.add('hidden');
    sessionListContainerMain.classList.add('hidden');
    cropCanvas.classList.add('hidden');
    cropControls.classList.add('hidden');
    cropHistory.classList.add('hidden');
    screenshotPreview.classList.remove('hidden');
    aiResponse.textContent = '';
  }
});
