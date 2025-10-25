// Background service worker for the extension
// Handles any background tasks and API calls if needed

chrome.runtime.onInstalled.addListener(() => {
  console.log('Facebook Comment Checker extension installed');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchComments') {
    // Handle API calls here if needed
    fetchCommentsAPI(request.postId, request.accessToken)
      .then(comments => sendResponse({ success: true, comments }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

/**
 * Fetch comments from Facebook Graph API
 */
async function fetchCommentsAPI(postId, accessToken) {
  const comments = [];
  let url = `https://graph.facebook.com/v18.0/${postId}/comments`;
  let hasNext = true;

  while (hasNext) {
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,message,from,created_time',
      order: 'chronological',
      limit: '100'
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (data.data) {
      comments.push(...data.data);
    }

    if (data.paging && data.paging.next) {
      url = data.paging.next;
    } else {
      hasNext = false;
    }
  }

  return comments;
}
