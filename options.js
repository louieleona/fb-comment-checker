// Load saved settings
chrome.storage.sync.get(['accessToken', 'correctAnswer'], (result) => {
  if (result.accessToken) {
    document.getElementById('accessToken').value = result.accessToken;
  }
  if (result.correctAnswer) {
    document.getElementById('defaultAnswer').value = result.correctAnswer;
  }
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const accessToken = document.getElementById('accessToken').value.trim();
  const correctAnswer = document.getElementById('defaultAnswer').value.trim();

  chrome.storage.sync.set({
    accessToken: accessToken,
    correctAnswer: correctAnswer
  }, () => {
    // Show success message
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    status.className = 'status success';
    status.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  });
});
