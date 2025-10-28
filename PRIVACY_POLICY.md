# Privacy Policy for Facebook Comment Checker

**Last Updated: October 28, 2024**

## Overview

Facebook Comment Checker is a Chrome extension that helps users monitor Facebook post comments in real-time to detect the first correct answer. This privacy policy explains how the extension handles data.

## Data Collection

**We do NOT collect, store, or transmit any personal data to external servers.**

This extension operates entirely within your browser and does not communicate with any external servers or third-party services.

## Data Handling

### What Happens Locally
- **Comment Monitoring**: The extension reads Facebook comments from pages you're actively viewing only when you explicitly start monitoring
- **Local Storage**: Your settings (default answer and optional Facebook API token) are stored locally on your device using Chrome's storage API
- **No Transmission**: No data ever leaves your device or browser
- **No Analytics**: We don't use any analytics, tracking, or telemetry services
- **No Third Parties**: No data is shared with any third-party services

### Data That Never Leaves Your Browser
- Facebook comments you monitor
- Winner information (name, profile, comment text, timestamp)
- Your settings (correct answer, API token)
- Your browsing activity

## Permissions Explained

The extension requests the following permissions, all of which are necessary for core functionality:

### storage
**Purpose**: To save your settings locally (default answer, optional API token)
**Data Stored**: Only your preferences that you explicitly configure

### activeTab
**Purpose**: To interact with the current Facebook tab when you start monitoring
**Scope**: Only the tab you're actively using, only when you click the extension

### scripting
**Purpose**: To inject monitoring code into Facebook pages to detect comments
**Scope**: Only on Facebook pages, only when monitoring is active

### notifications
**Purpose**: To alert you with a browser notification when the correct answer is found
**Data**: Only the winner's name and comment text, displayed locally

### host_permissions (facebook.com)
**Purpose**: To run the extension only on Facebook pages
**Scope**: Limited to facebook.com and graph.facebook.com domains

## Security

- All processing happens locally in your browser
- No external API calls (unless you optionally provide a Facebook API token)
- No user tracking or profiling
- No cookies or cross-site tracking
- Open source code available for audit

## Your Control

You have complete control over this extension:
- Monitoring only starts when you explicitly click "Start Monitoring"
- You can stop monitoring at any time
- You can uninstall the extension at any time, which removes all locally stored data
- No data persists outside your browser

## Facebook API Token (Optional)

If you choose to provide a Facebook API token in settings:
- The token is stored locally on your device only
- It's used only for optional API-based comment fetching (not required for core functionality)
- It's never transmitted to any servers other than Facebook's official API
- You can remove it at any time

## Children's Privacy

This extension does not knowingly collect any information from anyone, including children under 13. Since we don't collect any data at all, there are no special considerations for children's privacy.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the extension's store listing and in this document with an updated "Last Updated" date.

## Contact

If you have questions or concerns about this privacy policy:
- Open an issue on GitHub: [Your GitHub Repository URL]
- Contact: [Your Email Address]

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

Since we don't collect any personal data, there is no data to request, delete, or port.

## Summary

**In simple terms**: This extension works entirely in your browser, doesn't send any data anywhere, and only does what you explicitly tell it to do. Your privacy is fully protected because we never see or store your data.
