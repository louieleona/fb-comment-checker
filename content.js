// State management for monitoring
let isMonitoring = false;
let correctAnswer = '';
let observer = null;
let processedComments = new Set();
let monitoringIndicator = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startMonitoring') {
    const pageCheck = checkIfProperPostPage();
    if (!pageCheck.isProperPage) {
      sendResponse({ success: false, error: pageCheck.error, showInstructions: true });
      return true;
    }
    // Start monitoring asynchronously
    startMonitoring(request.correctAnswer).then(() => {
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
 * Check if a comment contains the correct answer
 */
function isCorrectAnswer(message, answer) {
  if (!message) return false;

  const normalizedMessage = message.toLowerCase().trim();
  const normalizedAnswer = answer.toLowerCase().trim();

  // Check if the answer appears as a whole word
  const words = normalizedMessage.split(/\s+/);
  return words.includes(normalizedAnswer) || normalizedMessage === normalizedAnswer;
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
  // Stop monitoring
  stopMonitoring();

  // Highlight the winning comment
  if (commentInfo.element) {
    commentInfo.element.style.border = '3px solid #00ff00';
    commentInfo.element.style.backgroundColor = '#d4edda';
    commentInfo.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Send notification
  chrome.runtime.sendMessage({
    action: 'correctAnswerFound',
    winner: {
      name: commentInfo.author,
      message: commentInfo.text,
      timestamp: commentInfo.timestamp,
      profileUrl: commentInfo.profileUrl,
      userId: commentInfo.userId
    }
  });

  // Show browser notification
  if (Notification.permission === 'granted') {
    new Notification('Correct Answer Found!', {
      body: `${commentInfo.author} answered correctly: "${commentInfo.text}"`,
      icon: chrome.runtime.getURL('icons/icon48.png')
    });
  }

  // Show on-page notification
  showOnPageNotification(commentInfo);
}

/**
 * Show a notification overlay on the page
 */
function showOnPageNotification(commentInfo) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 300px;
    animation: slideIn 0.5s ease-out;
  `;

  notification.innerHTML = `
    <style>
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
      🎉 CORRECT ANSWER FOUND!
    </div>
    <div style="font-size: 14px; margin-bottom: 5px;">
      <strong>Winner:</strong> ${commentInfo.author}
    </div>
    <div style="font-size: 14px; margin-bottom: 5px;">
      <strong>Answer:</strong> "${commentInfo.text}"
    </div>
    <div style="font-size: 12px; opacity: 0.9; margin-top: 10px;">
      ${new Date(commentInfo.timestamp).toLocaleString()}
    </div>
    <div style="margin-top: 15px; text-align: right;">
      <button style="background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Close button functionality
  notification.querySelector('button').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 30000);
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
async function startMonitoring(answer) {
  if (isMonitoring) {
    stopMonitoring();
  }

  correctAnswer = answer;
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
