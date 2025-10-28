// State management for monitoring
let isMonitoring = false;
let correctAnswer = '';
let matchMode = 'exact'; // 'exact' or 'contains'
let observer = null;
let processedComments = new Set();
let monitoringIndicator = null;
let inlineDialog = null;
let highlightedElements = [];
let foundWinners = []; // Track all found winners in order
let currentWinnerIndex = -1; // Track which winner is currently displayed

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startMonitoring') {
    const pageCheck = checkIfProperPostPage();
    if (!pageCheck.isProperPage) {
      sendResponse({ success: false, error: pageCheck.error, showInstructions: true });
      return true;
    }
    // Start monitoring asynchronously
    startMonitoring(request.correctAnswer, request.matchMode || 'exact').then(() => {
      sendResponse({ success: true, message: 'Monitoring started' });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'stopMonitoring') {
    stopMonitoring();
    sendResponse({ success: true, message: 'Monitoring stopped' });
  } else if (request.action === 'getMonitoringStatus') {
    sendResponse({ isMonitoring, correctAnswer });
  } else if (request.action === 'checkPageType') {
    sendResponse(checkIfProperPostPage());
  } else if (request.action === 'showInstructions') {
    showInstructionsOverlay();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Check if user is on a proper post page (not lightbox/modal)
 */
function checkIfProperPostPage() {
  const url = window.location.href;

  // Check if we're on a proper post page
  const isPostPage = url.includes('/posts/') ||
                     url.includes('/permalink/') ||
                     url.includes('/photo/') ||
                     url.includes('story_fbid=');

  // Check if we're viewing a modal/lightbox overlay
  const hasModal = document.querySelector('[role="dialog"]') !== null ||
                   document.querySelector('.fbPhotoSnowlift') !== null;

  // If we're on the main feed with a modal open
  if (hasModal && !isPostPage) {
    return {
      isProperPage: false,
      error: 'You appear to be viewing a post in a lightbox/modal. Please open the full post page.',
      reason: 'modal'
    };
  }

  // If we're on the main feed without any specific post
  if (!isPostPage) {
    return {
      isProperPage: false,
      error: 'Please navigate to a specific Facebook post page first.',
      reason: 'not_on_post'
    };
  }

  return {
    isProperPage: true
  };
}

/**
 * Show instructions overlay on how to get to full post page
 */
function showInstructionsOverlay() {
  // Remove existing overlay if present
  const existing = document.getElementById('fb-checker-instructions');
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'fb-checker-instructions';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
    <div style="
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.4s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <h2 style="margin: 0 0 20px 0; color: #1877f2; font-size: 24px;">
        📋 How to Get to the Full Post Page
      </h2>

      <div style="color: #333; line-height: 1.6; font-size: 15px;">
        <p style="margin-bottom: 20px; font-weight: 600; background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
          ⚠️ The extension won't work properly on lightbox/modal popups. You need to open the full post page.
        </p>

        <p style="margin-bottom: 15px; font-weight: 600; color: #1877f2;">
          Method 1: From Your Feed
        </p>
        <ol style="margin: 0 0 20px 0; padding-left: 25px;">
          <li style="margin-bottom: 10px;">Find the post you want to monitor</li>
          <li style="margin-bottom: 10px;">Look for the <strong>timestamp</strong> (e.g., "2h", "October 25 at 3:30 PM")</li>
          <li style="margin-bottom: 10px;"><strong>Right-click</strong> on the timestamp</li>
          <li style="margin-bottom: 10px;">Select <strong>"Open link in new tab"</strong></li>
        </ol>

        <p style="margin-bottom: 15px; font-weight: 600; color: #1877f2;">
          Method 2: From a Page
        </p>
        <ol style="margin: 0 0 20px 0; padding-left: 25px;">
          <li style="margin-bottom: 10px;">Navigate to the Facebook page</li>
          <li style="margin-bottom: 10px;">Find the post you want to monitor</li>
          <li style="margin-bottom: 10px;"><strong>Click</strong> on the timestamp or post text to open the full page</li>
        </ol>

        <p style="margin-bottom: 15px; font-weight: 600; color: #1877f2;">
          📌 Important: Switch to "All Comments" View
        </p>
        <ol style="margin: 0 0 20px 0; padding-left: 25px; background: #e7f3ff; padding: 15px; border-radius: 6px; border-left: 4px solid #1877f2;">
          <li style="margin-bottom: 10px;">Once on the post page, scroll to the comments section</li>
          <li style="margin-bottom: 10px;">Look for the filter dropdown (usually says <strong>"Most relevant"</strong> by default)</li>
          <li style="margin-bottom: 10px;">Click it and select <strong>"All comments"</strong> or <strong>"Most recent"</strong></li>
          <li style="margin-bottom: 10px;">This ensures you see ALL comments, not just Facebook's filtered selection</li>
        </ol>

        <p style="margin-bottom: 15px; font-weight: 600; color: #1877f2;">
          ✅ How to Verify You're on the Right Page:
        </p>
        <ul style="margin: 0 0 20px 0; padding-left: 25px;">
          <li style="margin-bottom: 8px;">The URL should include <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">/posts/</code> or <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">/permalink/</code></li>
          <li style="margin-bottom: 8px;">You should see the full post page, not a modal overlay</li>
          <li style="margin-bottom: 8px;">The comments section should be visible on the main page</li>
          <li style="margin-bottom: 8px;">The comment filter should show <strong>"All comments"</strong> or <strong>"Most recent"</strong></li>
        </ul>

        <div style="margin-top: 30px; text-align: right;">
          <button id="closeInstructionsBtn" style="
            background: #1877f2;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
          ">
            Got it!
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on button click
  document.getElementById('closeInstructionsBtn').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click (but not on content click)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

/**
 * Clear all previous comment highlights
 */
function clearHighlights() {
  highlightedElements.forEach(element => {
    if (element && element.style) {
      element.style.border = '';
      element.style.backgroundColor = '';
      element.style.position = '';

      // Remove position badge if exists
      const badge = element.querySelector('.fb-checker-position-badge');
      if (badge) {
        badge.remove();
      }
    }
  });
  highlightedElements = [];
  foundWinners = [];
  currentWinnerIndex = -1;
}

/**
 * Check if a comment contains the correct answer
 */
function isCorrectAnswer(message, answer) {
  if (!message) return false;

  const normalizedMessage = message.toLowerCase().trim();
  const normalizedAnswer = answer.toLowerCase().trim();

  if (matchMode === 'exact') {
    // Exact mode: comment must be exactly the answer (case insensitive)
    return normalizedMessage === normalizedAnswer;
  } else {
    // Contains mode: answer must appear as a whole word in the comment
    const words = normalizedMessage.split(/\s+/);
    return words.includes(normalizedAnswer);
  }
}

/**
 * Extract user information from a comment element
 */
function extractCommentInfo(commentElement) {
  try {
    // Extract author name and profile URL
    let author = 'Unknown';
    let profileUrl = '';

    // Find the author link - it should have href with user ID or profile
    const authorLink = commentElement.querySelector('a[href*="facebook.com"]');

    if (authorLink) {
      profileUrl = authorLink.href;

      // Try multiple methods to get the author name from the link
      // Method 1: span with dir="auto" inside the link
      const authorSpan = authorLink.querySelector('span[dir="auto"]');
      if (authorSpan && authorSpan.innerText.trim()) {
        author = authorSpan.innerText.trim();
      } else {
        // Method 2: Just get the link text, but exclude any nested elements
        const linkText = authorLink.innerText.trim();
        if (linkText && linkText.length > 0 && linkText.length < 100) {
          author = linkText.split('\n')[0].trim(); // Take first line only
        }
      }

      // Method 3: Extract from URL as last resort
      if (!author || author === 'Unknown' || author.length === 0) {
        const urlMatch = profileUrl.match(/facebook\.com\/([^?/]+)/);
        if (urlMatch && urlMatch[1]) {
          author = urlMatch[1].replace(/\./g, ' '); // Convert eric.takata to eric takata
        }
      }
    }

    // Extract comment text - looking for div with style="text-align: start" or dir="auto"
    let text = '';

    // Method 1: Look for div with text-align: start (most specific for comment content)
    const textDiv = commentElement.querySelector('div[style*="text-align"]');
    if (textDiv) {
      text = textDiv.innerText.trim();
    }

    // Method 2: If not found, look for divs with dir="auto" that are NOT the author name
    if (!text) {
      const dirAutoDivs = commentElement.querySelectorAll('div[dir="auto"]');
      for (const div of dirAutoDivs) {
        const divText = div.innerText.trim();
        // Skip if it's just the author name or very short
        if (divText && divText !== author && divText.length > author.length) {
          text = divText;
          break;
        }
      }
    }

    // Method 3: Fallback - get all text and clean it up
    if (!text) {
      text = commentElement.innerText.trim();
      // Remove author name and common prefixes
      text = text.replace(author, '').trim();
      text = text.replace(/^Top fan\s*/i, '').trim();
      text = text.replace(/^\s*·\s*/, '').trim();
      // Take the main content (first substantial line)
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      text = lines[0] || '';
    }

    // Extract user ID from profile URL if possible
    let userId = '';
    if (profileUrl) {
      const userIdMatch = profileUrl.match(/\/user\/(\d+)/) ||
                         profileUrl.match(/profile\.php\?id=(\d+)/) ||
                         profileUrl.match(/\/([^\/\?]+)\?/);
      userId = userIdMatch ? userIdMatch[1] : '';
    }

    // Try to extract timestamp
    const timeElement = commentElement.querySelector('abbr') ||
                       commentElement.querySelector('[data-utime]');
    const timestamp = timeElement ?
                     (timeElement.getAttribute('data-utime') * 1000 || Date.now()) :
                     Date.now();

    return {
      text,
      author,
      profileUrl,
      userId,
      timestamp,
      element: commentElement
    };
  } catch (error) {
    console.error('Error extracting comment info:', error);
    return null;
  }
}

/**
 * Handle a new comment detection
 */
function handleNewComment(commentElement) {
  // Create a unique identifier for this comment to avoid duplicates
  const commentId = commentElement.innerText.trim() + commentElement.querySelector('a[role="link"]')?.innerText;

  if (processedComments.has(commentId)) {
    return; // Already processed this comment
  }

  const commentInfo = extractCommentInfo(commentElement);

  if (!commentInfo || !commentInfo.text) {
    return; // Could not extract comment info
  }

  // Mark as processed
  processedComments.add(commentId);

  // Check if this is the correct answer
  if (isCorrectAnswer(commentInfo.text, correctAnswer)) {
    foundCorrectAnswer(commentInfo);
  }
}

/**
 * Called when the correct answer is found
 */
function foundCorrectAnswer(commentInfo) {
  // Stop monitoring (observer only, keep indicator visible)
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  isMonitoring = false;

  // Add to winners list
  foundWinners.push(commentInfo);
  const position = foundWinners.length;
  currentWinnerIndex = position - 1; // Update current index (0-based)

  // Get position label
  const positionLabel = getPositionLabel(position);

  // Highlight the winning comment with position badge
  if (commentInfo.element) {
    commentInfo.element.style.border = '3px solid #00ff00';
    commentInfo.element.style.backgroundColor = '#d4edda';
    commentInfo.element.style.position = 'relative';

    // Add position badge
    const badge = document.createElement('div');
    badge.className = 'fb-checker-position-badge';
    badge.style.cssText = `
      position: absolute;
      top: -10px;
      left: -10px;
      background: #00c853;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10;
    `;
    badge.textContent = positionLabel;
    commentInfo.element.insertBefore(badge, commentInfo.element.firstChild);

    commentInfo.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Track highlighted element so we can clear it later
    highlightedElements.push(commentInfo.element);
  }

  // Send notification to popup
  chrome.runtime.sendMessage({
    action: 'correctAnswerFound',
    winner: {
      name: commentInfo.author,
      message: commentInfo.text,
      timestamp: commentInfo.timestamp,
      profileUrl: commentInfo.profileUrl,
      userId: commentInfo.userId,
      position: position
    }
  });

  // Show browser notification
  if (Notification.permission === 'granted') {
    new Notification(`Comment Found! (${positionLabel})`, {
      body: `${commentInfo.author}: "${commentInfo.text}"`,
      icon: chrome.runtime.getURL('icons/icon48.png')
    });
  }

  // Transform monitoring indicator to show winner
  showWinnerInIndicator(commentInfo, position);
}

/**
 * Get position label (1st, 2nd, 3rd, etc.)
 */
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

/**
 * Transform monitoring indicator to show winner information
 */
function showWinnerInIndicator(commentInfo, position) {
  if (!monitoringIndicator) return;

  const positionLabel = getPositionLabel(position);

  // Change to success state with green gradient
  monitoringIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
    color: white;
    padding: 16px 30px;
    border-radius: 12px;
    box-shadow: 0 6px 25px rgba(0,200,83,0.4);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 400px;
    max-width: 600px;
    animation: successPulse 0.5s ease-out;
  `;

  const profileLink = commentInfo.profileUrl
    ? `<a href="${commentInfo.profileUrl}" target="_blank" style="color: white; text-decoration: underline; font-weight: 700;">${commentInfo.author}</a>`
    : `<strong>${commentInfo.author}</strong>`;

  const commentText = commentInfo.text.length > 100
    ? commentInfo.text.substring(0, 100) + '...'
    : commentInfo.text;

  monitoringIndicator.innerHTML = `
    <style>
      @keyframes successPulse {
        0% { transform: translateX(-50%) scale(0.95); opacity: 0.8; }
        50% { transform: translateX(-50%) scale(1.02); }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }
    </style>
    <div style="display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 700;">
      <span style="font-size: 24px;">🎉</span>
      <span>COMMENT FOUND! (${positionLabel} Place)</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; padding-left: 36px;">
      <div><strong>Winner:</strong> ${profileLink}</div>
      <div><strong>Answer:</strong> "${commentText}"</div>
      <div style="opacity: 0.9; font-size: 11px;">${new Date(commentInfo.timestamp).toLocaleString()}</div>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 8px; padding-top: 8px;">
      <div style="display: flex; gap: 8px;">
        <button id="findPreviousBtn" style="background: rgba(255,255,255,0.9); border: none; color: #00c853; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; transition: all 0.2s; ${position === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
          ← Previous
        </button>
        <button id="findNextBtn" style="background: rgba(255,255,255,0.9); border: none; color: #00c853; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; transition: all 0.2s;">
          Next →
        </button>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="monitorAgainBtn" style="background: rgba(255,255,255,0.7); border: none; color: white; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">
          Monitor Again
        </button>
        <button id="closeIndicatorBtn" style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: background 0.2s;">
          Close
        </button>
      </div>
    </div>
  `;

  // Find Previous button functionality
  const findPreviousBtn = document.getElementById('findPreviousBtn');
  if (findPreviousBtn) {
    findPreviousBtn.addEventListener('click', () => {
      if (position > 1) { // Only allow if not at first position
        findPreviousCorrectAnswer();
      }
    });

    // Hover effect (only if not disabled)
    if (position > 1) {
      findPreviousBtn.addEventListener('mouseenter', () => {
        findPreviousBtn.style.background = 'white';
        findPreviousBtn.style.transform = 'scale(1.05)';
      });
      findPreviousBtn.addEventListener('mouseleave', () => {
        findPreviousBtn.style.background = 'rgba(255,255,255,0.9)';
        findPreviousBtn.style.transform = 'scale(1)';
      });
    }
  }

  // Find Next button functionality
  const findNextBtn = document.getElementById('findNextBtn');
  if (findNextBtn) {
    findNextBtn.addEventListener('click', () => {
      findNextCorrectAnswer();
    });

    // Hover effect
    findNextBtn.addEventListener('mouseenter', () => {
      findNextBtn.style.background = 'white';
      findNextBtn.style.transform = 'scale(1.05)';
    });
    findNextBtn.addEventListener('mouseleave', () => {
      findNextBtn.style.background = 'rgba(255,255,255,0.9)';
      findNextBtn.style.transform = 'scale(1)';
    });
  }

  // Monitor Again button functionality
  const monitorAgainBtn = document.getElementById('monitorAgainBtn');
  if (monitorAgainBtn) {
    monitorAgainBtn.addEventListener('click', () => {
      // Remove the winner indicator
      removeMonitoringIndicator();

      // Reset the monitoring state
      isMonitoring = false;
      processedComments.clear();

      // Send message to popup to reset it
      chrome.runtime.sendMessage({
        action: 'readyForNewMonitoring'
      });

      // Show inline dialog for new monitoring
      showInlineDialog();
    });

    // Hover effect
    monitorAgainBtn.addEventListener('mouseenter', () => {
      monitorAgainBtn.style.background = 'rgba(255,255,255,0.9)';
      monitorAgainBtn.style.transform = 'scale(1.05)';
    });
    monitorAgainBtn.addEventListener('mouseleave', () => {
      monitorAgainBtn.style.background = 'rgba(255,255,255,0.7)';
      monitorAgainBtn.style.transform = 'scale(1)';
    });
  }

  // Close button functionality
  const closeBtn = document.getElementById('closeIndicatorBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeMonitoringIndicator();
    });

    // Hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.5)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.3)';
    });
  }
}

/**
 * Find the previous correct answer (navigate back in found winners)
 */
function findPreviousCorrectAnswer() {
  if (currentWinnerIndex <= 0) {
    return; // Already at first winner
  }

  // Move to previous winner
  currentWinnerIndex--;
  const previousWinner = foundWinners[currentWinnerIndex];

  if (previousWinner && previousWinner.element) {
    // Scroll to the previous winner
    previousWinner.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update indicator to show this winner
    const position = currentWinnerIndex + 1;
    showWinnerInIndicator(previousWinner, position);
  }
}

/**
 * Find the next correct answer in the comments
 */
function findNextCorrectAnswer() {
  // Check if there's already a next winner in our found list
  if (currentWinnerIndex < foundWinners.length - 1) {
    // Move to next already-found winner
    currentWinnerIndex++;
    const nextWinner = foundWinners[currentWinnerIndex];

    if (nextWinner && nextWinner.element) {
      // Scroll to the next winner
      nextWinner.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Update indicator to show this winner
      const position = currentWinnerIndex + 1;
      showWinnerInIndicator(nextWinner, position);
    }
    return;
  }

  // No more already-found winners, search for new ones
  const allComments = findCommentElements();

  // Get all existing winners' elements
  const foundElements = foundWinners.map(w => w.element);

  // Search for next correct answer
  for (let comment of allComments) {
    // Skip if already found
    if (foundElements.includes(comment)) {
      continue;
    }

    // Extract comment info
    const commentInfo = extractCommentInfo(comment);

    if (commentInfo && commentInfo.text) {
      // Check if this is a correct answer
      if (isCorrectAnswer(commentInfo.text, correctAnswer)) {
        foundCorrectAnswer(commentInfo);
        return;
      }
    }
  }

  // No more correct answers found
  showNoMoreResultsMessage();
}

/**
 * Show message when no more results are found
 */
function showNoMoreResultsMessage() {
  if (!monitoringIndicator) return;

  const totalFound = foundWinners.length;
  const positionLabel = getPositionLabel(totalFound);

  // Update indicator to show "No more found" message
  updateMonitoringIndicator(`🏁 No more found! (${totalFound} total - last was ${positionLabel})`);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (monitoringIndicator) {
      // Restore to show the last winner
      const lastWinner = foundWinners[foundWinners.length - 1];
      if (lastWinner) {
        showWinnerInIndicator(lastWinner, totalFound);
      }
    }
  }, 3000);
}

/**
 * Show inline FB Comment Checker dialog on the page
 */
function showInlineDialog() {
  // Remove existing dialog if present
  if (inlineDialog) {
    inlineDialog.remove();
    inlineDialog = null;
  }

  // Create dialog overlay
  inlineDialog = document.createElement('div');
  inlineDialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 350px;
    animation: dialogSlideIn 0.3s ease-out;
  `;

  inlineDialog.innerHTML = `
    <style>
      @keyframes dialogSlideIn {
        from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
      .fb-checker-dialog-header {
        font-size: 18px;
        font-weight: 700;
        color: #1877f2;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .fb-checker-dialog-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        margin-bottom: 6px;
      }
      .fb-checker-dialog-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
        margin-bottom: 16px;
        font-family: inherit;
      }
      .fb-checker-dialog-input:focus {
        outline: none;
        border-color: #1877f2;
      }
      .fb-checker-dialog-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .fb-checker-dialog-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .fb-checker-dialog-btn-primary {
        background: #1877f2;
        color: white;
      }
      .fb-checker-dialog-btn-primary:hover {
        background: #0e5ac7;
        transform: translateY(-1px);
      }
      .fb-checker-dialog-btn-secondary {
        background: #e4e6eb;
        color: #333;
      }
      .fb-checker-dialog-btn-secondary:hover {
        background: #d0d2d7;
      }
      .fb-checker-dialog-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #888;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      .fb-checker-dialog-close:hover {
        background: #f0f0f0;
      }
      .fb-checker-dialog-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #555;
      }
      .fb-checker-dialog-checkbox input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      .fb-checker-dialog-checkbox label {
        cursor: pointer;
        margin: 0;
      }
    </style>
    <div class="fb-checker-dialog-header">
      <span>📋 FB Comment Checker</span>
      <button class="fb-checker-dialog-close" id="inlineDialogClose">×</button>
    </div>
    <label class="fb-checker-dialog-label" for="inlineAnswerInput">Answer to Monitor:</label>
    <input
      type="text"
      id="inlineAnswerInput"
      class="fb-checker-dialog-input"
      placeholder="Enter the answer to look for..."
      value="${correctAnswer}"
    />
    <div class="fb-checker-dialog-checkbox">
      <input type="checkbox" id="inlineMatchModeCheckbox" ${matchMode === 'contains' ? 'checked' : ''}>
      <label for="inlineMatchModeCheckbox">Contains match (answer can appear anywhere in comment)</label>
    </div>
    <div class="fb-checker-dialog-buttons">
      <button class="fb-checker-dialog-btn fb-checker-dialog-btn-secondary" id="inlineDialogCancel">Cancel</button>
      <button class="fb-checker-dialog-btn fb-checker-dialog-btn-primary" id="inlineDialogStart">Start Monitoring</button>
    </div>
  `;

  document.body.appendChild(inlineDialog);

  // Focus the input
  const input = document.getElementById('inlineAnswerInput');
  input.focus();
  input.select();

  // Close button
  document.getElementById('inlineDialogClose').addEventListener('click', closeInlineDialog);
  document.getElementById('inlineDialogCancel').addEventListener('click', closeInlineDialog);

  // Start monitoring button
  document.getElementById('inlineDialogStart').addEventListener('click', () => {
    const answer = input.value.trim();
    if (!answer) {
      input.style.borderColor = '#f44336';
      input.placeholder = 'Please enter an answer!';
      return;
    }

    // Get match mode from checkbox
    const checkbox = document.getElementById('inlineMatchModeCheckbox');
    const mode = checkbox.checked ? 'contains' : 'exact';

    // Save to chrome storage for sync with popup
    chrome.storage.sync.set({ correctAnswer: answer, matchMode: mode });

    // Close dialog
    closeInlineDialog();

    // Start monitoring with the new answer and match mode
    startMonitoring(answer, mode);
  });

  // Allow Enter key to submit
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('inlineDialogStart').click();
    }
  });
}

function closeInlineDialog() {
  if (inlineDialog) {
    inlineDialog.remove();
    inlineDialog = null;
  }
}


/**
 * Create and show monitoring indicator
 */
function createMonitoringIndicator() {
  if (monitoringIndicator) return;

  monitoringIndicator = document.createElement('div');
  monitoringIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #1877f2 0%, #0e5ac7 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  monitoringIndicator.innerHTML = `
    <span style="display: inline-block; width: 10px; height: 10px; background: #00ff00; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></span>
    <span>Monitoring for answer: "${correctAnswer}"</span>
    <button id="stopMonitoringBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 12px; border-radius: 12px; cursor: pointer; font-size: 12px;">Stop</button>
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }
    </style>
  `;

  document.body.appendChild(monitoringIndicator);

  // Stop button functionality
  document.getElementById('stopMonitoringBtn').addEventListener('click', () => {
    stopMonitoring();

    // Show inline dialog for new monitoring
    showInlineDialog();

    // Notify popup that monitoring stopped
    chrome.runtime.sendMessage({
      action: 'monitoringStopped'
    });
  });
}

/**
 * Remove monitoring indicator
 */
function removeMonitoringIndicator() {
  if (monitoringIndicator && monitoringIndicator.parentElement) {
    monitoringIndicator.remove();
    monitoringIndicator = null;
  }
}

/**
 * Expand all comments by clicking "View more" buttons and scrolling
 */
async function expandAllComments() {
  // Update indicator to show we're loading
  updateMonitoringIndicator('Loading all comments...');

  let previousCommentCount = 0;
  let currentCommentCount = findCommentElements().length;
  let attempts = 0;
  const maxAttempts = 50; // Prevent infinite loops

  while (attempts < maxAttempts) {
    attempts++;

    // Find and click "View more comments" / "View previous comments" buttons
    const viewMoreButtons = [
      ...document.querySelectorAll('[role="button"]')
    ].filter(btn => {
      const text = btn.innerText.toLowerCase();
      return text.includes('view more') ||
             text.includes('view previous') ||
             text.includes('see more') ||
             text.includes('more comment') ||
             text.includes('previous comment');
    });

    // Click all "view more" buttons
    for (const btn of viewMoreButtons) {
      try {
        btn.click();
        await sleep(300); // Wait for comments to load
      } catch (e) {
        // Silently continue if button click fails
      }
    }

    // Scroll to load more comments (Facebook lazy loads on scroll)
    const commentsSection = document.querySelector('[role="article"]')?.parentElement;
    if (commentsSection) {
      commentsSection.scrollTop = commentsSection.scrollHeight;
    }
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(500);

    // Check if we loaded more comments
    previousCommentCount = currentCommentCount;
    currentCommentCount = findCommentElements().length;

    // If no new comments loaded in the last 2 attempts, we're probably done
    if (currentCommentCount === previousCommentCount) {
      if (attempts > 2) {
        break;
      }
    }

    // If we found new comments, update the indicator
    if (currentCommentCount > previousCommentCount) {
      updateMonitoringIndicator(`Loading comments (${currentCommentCount} found)...`);
    }
  }

  updateMonitoringIndicator(`Monitoring for: "${correctAnswer}"`);
  return currentCommentCount;
}

/**
 * Helper function to sleep/wait
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update the monitoring indicator text
 */
function updateMonitoringIndicator(text) {
  if (monitoringIndicator) {
    const textSpan = monitoringIndicator.querySelector('span:nth-child(2)');
    if (textSpan) {
      textSpan.textContent = text;
    }
  }
}

/**
 * Start monitoring for new comments
 */
async function startMonitoring(answer, mode = 'exact') {
  if (isMonitoring) {
    stopMonitoring();
  }

  // Clear any previous highlights from previous monitoring sessions
  clearHighlights();

  correctAnswer = answer;
  matchMode = mode;
  isMonitoring = true;
  processedComments.clear();

  // Create visual indicator
  createMonitoringIndicator();

  // Request notification permission if not granted
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // FIRST: Expand all comments to make sure we see everything
  await expandAllComments();

  // THEN: Check all existing comments to see if the answer already exists
  const existingComments = findCommentElements();

  let foundInExisting = false;

  for (let i = 0; i < existingComments.length; i++) {
    const comment = existingComments[i];
    const commentId = comment.innerText.trim() + comment.querySelector('a[role="link"]')?.innerText;

    // Extract comment info
    const commentInfo = extractCommentInfo(comment);

    if (commentInfo && commentInfo.text) {
      // Check if this existing comment has the correct answer
      if (isCorrectAnswer(commentInfo.text, correctAnswer)) {
        foundInExisting = true;

        // Mark this as the winner
        foundCorrectAnswer(commentInfo);
        return; // Exit early, no need to start monitoring
      }
    }

    // Mark as processed so we don't check it again
    processedComments.add(commentId);
  }

  // Set up MutationObserver to watch for new comments if no answer found yet
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is a comment or contains comments
          if (isCommentElement(node)) {
            handleNewComment(node);
          } else {
            // Check children for comment elements
            const comments = node.querySelectorAll ? findCommentElements(node) : [];
            comments.forEach(comment => handleNewComment(comment));
          }
        }
      });
    });
  });

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Stop monitoring
 */
function stopMonitoring() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  isMonitoring = false;
  correctAnswer = '';
  processedComments.clear();

  removeMonitoringIndicator();
}

/**
 * Find comment elements on the page
 */
function findCommentElements(root = document) {
  const selectors = [
    '[role="article"]',
    '[data-ad-preview="message"]',
    '.UFICommentContent',
    '[data-testid="comment"]',
    'div[dir="auto"]'
  ];

  let comments = [];
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    if (elements.length > 0) {
      comments = Array.from(elements).filter(el => {
        return el.innerText && el.innerText.trim().length > 0;
      });
      if (comments.length > 0) break;
    }
  }

  return comments;
}

/**
 * Check if an element is a comment element
 */
function isCommentElement(element) {
  // Check common comment attributes and classes
  return element.getAttribute?.('role') === 'article' ||
         element.getAttribute?.('data-testid') === 'comment' ||
         element.classList?.contains('UFICommentContent');
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
  stopMonitoring();
});
