# Facebook Comment Checker - Chrome Extension

A powerful Chrome extension that monitors Facebook post comments in **real-time** and automatically detects the first person to post the correct answer to a question.

Perfect for Facebook contests, giveaways, trivia posts, and community engagement activities where you need to identify the first correct responder.

## ✨ Features

- **🔍 Real-time Monitoring** - Watches for new comments as they appear using MutationObserver
- **⚡ Automatic Detection** - Instantly identifies when someone posts the correct answer
- **📊 Complete Comment Analysis** - Loads ALL comments (not just visible ones) before monitoring
- **🎯 Smart Matching** - Flexible answer matching (case-insensitive, word-based)
- **🎨 Visual Feedback** - Beautiful on-page notifications and highlighted winning comment
- **👤 Full User Info** - Captures winner's name, profile URL, timestamp, and comment
- **🔔 Multi-Channel Alerts** - On-page popup, browser notification, and extension popup display
- **🛡️ Page Validation** - Warns you if you're not on a proper post page

## 📸 Screenshots

### Monitoring Indicator
When active, shows a blue bar at the top of Facebook with:
- Pulsing green indicator
- Current answer being monitored
- Quick stop button

### Winner Notification
Beautiful purple gradient popup showing:
- Winner's name (clickable to profile)
- The winning comment
- Timestamp
- Auto-scrolls to and highlights the winning comment

### Extension Popup
Clean interface with:
- Start/Stop monitoring controls
- Real-time status updates
- Full winner details with profile link

## 🚀 Installation

### Quick Install (Development)

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd comment-checker
   ```

2. **Generate extension icons** (optional):
   ```bash
   cd icons
   node generate-icons.cjs
   ```
   Or simply use the included placeholder icons.

3. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `comment-checker` folder
   - Extension icon appears in toolbar!

### Production Install

Package the extension:
1. Go to `chrome://extensions/`
2. Click **Pack extension**
3. Select the `comment-checker` folder
4. Share the generated `.crx` file

## 📖 How to Use

### Step 1: Prepare the Facebook Post

1. Navigate to the Facebook post you want to monitor
2. **Important**: Open the FULL post page (not a lightbox/modal)
   - Right-click the post timestamp → "Open link in new tab"
   - Or click directly on the timestamp
3. **Switch to "All comments" view**
   - Find the comment filter dropdown (default: "Most relevant")
   - Select "All comments" or "Most recent"
   - This ensures you see ALL comments, not just filtered ones

### Step 2: Start Monitoring

1. Click the extension icon in your Chrome toolbar
2. Enter the correct answer you're looking for
3. Click **Start Monitoring**

### Step 3: Watch the Magic Happen

The extension will:
1. ✅ Click all "View more comments" buttons
2. ✅ Load ALL existing comments
3. ✅ Check each existing comment for the answer
4. ✅ If found → Shows winner immediately
5. ✅ If not found → Watches for new comments in real-time

### Step 4: View Results

When the correct answer is found:
- 🎉 Purple notification popup appears
- 💚 Winning comment is highlighted in green
- 📜 Page auto-scrolls to the winning comment
- 🔔 Browser notification (if permissions granted)
- 📋 Full details shown in extension popup

## 🎯 Answer Matching

By default, the extension uses **flexible matching**:
- ✅ Case-insensitive: "HELLO" matches "hello"
- ✅ Word-based: Looks for answer as a complete word
- ✅ Trimmed: Ignores leading/trailing whitespace

### Customization

Edit `content.js` (lines 210-214) to customize matching:

**Exact match only:**
```javascript
return normalizedMessage === normalizedAnswer;
```

**Contains (substring):**
```javascript
return normalizedMessage.includes(normalizedAnswer);
```

**Multiple acceptable answers:**
```javascript
const acceptable = ['42', 'forty-two', 'forty two'];
return acceptable.some(ans => normalizedMessage.includes(ans));
```

**Regex pattern:**
```javascript
const pattern = /\b42\b/i;
return pattern.test(message);
```

## 🔧 Configuration

### Default Answer
Set a default answer in Settings to avoid typing it each time:
1. Click extension icon → **Settings**
2. Enter your default answer
3. It will auto-fill in the popup

### Optional: Facebook Access Token
For API-based fetching (not used for real-time monitoring):
1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Generate a token with `pages_read_engagement` permission
3. Add it in Settings

**Note:** The extension works great without an API token using page scraping!

## 🛠️ How It Works

### Technology
- **MutationObserver API** - Detects DOM changes in real-time
- **Chrome Extension Manifest V3** - Latest extension standard
- **Native JavaScript** - No external dependencies for core functionality

### Process Flow
1. User starts monitoring
2. Extension validates proper post page
3. Automatically expands all comments:
   - Clicks "View more comments" buttons
   - Scrolls to trigger lazy-loaded comments
   - Repeats until all comments loaded
4. Checks all existing comments chronologically
5. Sets up real-time watcher for new comments
6. Detects match → Highlights & notifies → Stops monitoring

### Comment Extraction
The extension intelligently extracts:
- **Author name** from link elements and profile URLs
- **Comment text** from specific Facebook div structures
- **Timestamp** from data attributes
- **Profile URL** from author links
- **User ID** from profile URLs

Includes multiple fallback methods for reliability across Facebook's changing HTML structure.

## 📁 Project Structure

```
comment-checker/
├── manifest.json          # Extension configuration
├── content.js             # Main logic - monitoring, detection, extraction
├── popup.html             # Extension popup UI
├── popup.js               # Popup interaction logic
├── options.html           # Settings page
├── options.js             # Settings logic
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   ├── icon128.png       # 128x128 icon
│   ├── icon.svg          # Source SVG
│   └── generate-icons.cjs # Icon generator script
├── .gitignore            # Git ignore rules
├── package.json          # Project metadata
└── README.md             # This file
```

## 🐛 Troubleshooting

### Extension won't start monitoring
- ✅ Ensure you're on a full Facebook post page (URL includes `/posts/` or `/permalink/`)
- ✅ Not on a lightbox/modal view
- ✅ Try refreshing the Facebook page

### Comments not being detected
- ✅ Make sure you selected "All comments" filter (not "Most relevant")
- ✅ Check that comments are fully loaded
- ✅ Facebook's HTML structure may have changed - check console for errors

### Missing winner information
- ✅ Reload the extension
- ✅ Check browser console for errors
- ✅ Ensure Chrome has necessary permissions

### No browser notifications
- ✅ Allow notifications when prompted
- ✅ Check Chrome settings: Settings → Privacy → Notifications
- ✅ Enable for facebook.com

### Comments won't load completely
- ✅ Scroll down manually to help load comments
- ✅ Some posts with thousands of comments may take time
- ✅ The extension tries up to 50 loading attempts

## 🔒 Privacy & Security

This extension:
- ✅ Only runs on Facebook pages
- ✅ Only accesses data when you explicitly start monitoring
- ✅ Does NOT send any data to external servers
- ✅ Stores only your settings locally (default answer, optional API token)
- ✅ Does NOT track or collect personal information
- ✅ All processing happens locally in your browser

## ⚡ Performance

- Lightweight and efficient
- Uses MutationObserver for optimal performance
- Only processes new comments (doesn't re-check old ones)
- Automatically stops monitoring when answer found
- Minimal impact on Facebook page performance

## 🚧 Limitations

- Only works on Facebook's desktop website (not mobile app)
- Requires you to be on the full post page (not modal/lightbox)
- Comment filter must be set to "All comments" manually
- Only monitors while the Facebook page is open
- Monitoring stops if you navigate away or refresh
- Facebook's HTML structure changes may require updates

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Mobile app support
- Auto-detection of "All comments" filter
- Multi-language support
- Export winner data to CSV
- History of past winners
- Support for multiple correct answers

## 📝 Development

### Testing
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension
4. Test on a Facebook post

### Key Functions
- `extractCommentInfo()` - Extracts user data from comment elements
- `isCorrectAnswer()` - Checks if comment matches answer
- `expandAllComments()` - Loads all comments from the post
- `startMonitoring()` - Main monitoring logic
- `foundCorrectAnswer()` - Winner detection handler

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

Built with:
- Chrome Extension APIs
- MutationObserver API
- Modern JavaScript (ES6+)

---

**Made with ❤️ for Facebook community managers, contest organizers, and page administrators**

Need help? Found a bug? Open an issue!
