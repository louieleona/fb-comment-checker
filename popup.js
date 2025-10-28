// Load saved correct answer and match mode, check monitoring status
chrome.storage.sync.get(['correctAnswer', 'matchMode'], (result) => {
  if (result.correctAnswer) {
    document.getElementById('correctAnswer').value = result.correctAnswer;
  }
  if (result.matchMode) {
    document.getElementById('matchModeCheckbox').checked = result.matchMode === 'contains';
  }
});

// Check if monitoring is already active
checkMonitoringStatus();

// Settings button
document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Start monitoring button
document.getElementById('startBtn').addEventListener('click', async () => {
  const correctAnswer = document.getElementById('correctAnswer').value.trim();

  if (!correctAnswer) {
    showResult('Please enter the correct answer.', 'error');
    return;
  }

  // Get match mode from checkbox
  const checkbox = document.getElementById('matchModeCheckbox');
  const matchMode = checkbox.checked ? 'contains' : 'exact';

  // Save the correct answer and match mode
  chrome.storage.sync.set({ correctAnswer, matchMode });

  // Get the current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('facebook.com')) {
    showResult('Please navigate to a Facebook post first.', 'error');
    return;
  }

  // Send message to content script to start monitoring
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'startMonitoring',
      correctAnswer: correctAnswer,
      matchMode: matchMode
    });

    if (response.success) {
      // Close the popup immediately
      window.close();
    } else {
      // Show error with instructions button if needed
      if (response.showInstructions) {
        showResultWithInstructions(response.error, tab.id);
      } else {
        showResult(`Error: ${response.error || 'Failed to start monitoring'}`, 'error');
      }
    }
  } catch (error) {
    showResult(`Error: ${error.message}. Try refreshing the Facebook page.`, 'error');
  }
});

// Stop monitoring button
document.getElementById('stopBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'stopMonitoring'
    });

    if (response.success) {
      showMonitoringInactive();
      showResult('Monitoring stopped.', 'info');
    }
  } catch (error) {
    // If the page was refreshed, just update UI
    showMonitoringInactive();
    showResult('Monitoring stopped.', 'info');
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'correctAnswerFound') {
    displayWinner(request.winner);
    showMonitoringInactive();
  } else if (request.action === 'readyForNewMonitoring') {
    // Reset to initial state for new monitoring
    showMonitoringInactive();
    clearWinnerDisplay();
  } else if (request.action === 'monitoringStopped') {
    // User stopped monitoring from the page
    showMonitoringInactive();
  }
});

function showMonitoringActive(answer) {
  document.getElementById('monitoringStatus').classList.add('active');
  document.getElementById('currentAnswer').textContent = answer;
  document.getElementById('monitoringSection').classList.add('hidden');
  document.getElementById('stopSection').classList.add('active');
}

function showMonitoringInactive() {
  document.getElementById('monitoringStatus').classList.remove('active');
  document.getElementById('monitoringSection').classList.remove('hidden');
  document.getElementById('stopSection').classList.remove('active');
}

async function checkMonitoringStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('facebook.com')) {
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'getMonitoringStatus'
    });

    if (response.isMonitoring) {
      showMonitoringActive(response.correctAnswer);
    }
  } catch (error) {
    // Content script not loaded yet or page not ready
  }
}

function showResult(message, type) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = message;
  resultDiv.className = type;
  resultDiv.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    resultDiv.style.display = 'none';
  }, 5000);
}

function showResultWithInstructions(message, tabId) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <div class="error">
      <strong>${message}</strong>
      <button id="showInstructionsBtn" style="
        margin-top: 10px;
        width: 100%;
        padding: 8px;
        background-color: #1877f2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      ">
        Show Me How
      </button>
    </div>
  `;
  resultDiv.className = '';
  resultDiv.style.display = 'block';

  // Add click handler for the button
  document.getElementById('showInstructionsBtn').addEventListener('click', async () => {
    // Send message to content script to show instructions overlay
    await chrome.tabs.sendMessage(tabId, { action: 'showInstructions' });
    // Close the popup so user can see the instructions
    window.close();
  });
}

function getPositionLabel(position) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const lastDigit = position % 10;
  const lastTwoDigits = position % 100;

  let suffix;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = 'th';
  } else {
    suffix = suffixes[lastDigit] || 'th';
  }

  return `${position}${suffix}`;
}

function displayWinner(winner) {
  // Ensure we have the data we need
  const name = winner.name || 'Unknown';
  const message = winner.message || 'No message';
  const timestamp = winner.timestamp || Date.now();
  const profileUrl = winner.profileUrl || '';
  const userId = winner.userId || '';
  const position = winner.position || 1;

  // Get position label
  const positionLabel = getPositionLabel(position);

  const profileLink = profileUrl ?
    `<a href="${profileUrl}" target="_blank">${name}</a>` :
    name;

  const html = `
    <div class="success">
      <strong>🎉 Comment Found! (${positionLabel} Place)</strong>
      <div class="winner-info">
        <p><strong>Winner:</strong> ${profileLink}</p>
        ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : ''}
        <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Comment:</strong> "${message}"</p>
      </div>
    </div>
  `;
  showResult(html, '');

  // Keep the result visible (don't auto-hide)
  const resultDiv = document.getElementById('result');
  resultDiv.style.display = 'block';
}

function clearWinnerDisplay() {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';
  resultDiv.className = '';
  resultDiv.style.display = 'none';
}
