# Cookie Info Overlay Extension

## Overview
This extension injects an overlay into every webpage.  
It shows:
- Current page URL
- Domain
- HTTPS status
- A button to request cookie access (runtime permission)

Once permission is granted:
- Displays cookies for the current domain
- Updates cookie list in real time when cookies change
- Provides options to revoke cookie access or clear cookies

## Permissions
- "activeTab": To interact with the current tab.
- "scripting": For injecting content scripts.
- "storage": For storing UI state.
- "cookies": **Requested at runtime only**, not in the manifest.

## Communication
- Content script → creates overlay, sends requests.
- Background script → handles cookies, permissions, and events.
- Messaging: chrome.runtime.sendMessage and chrome.runtime.onMessage.

## Security
- Cookie data never exposed to webpage JS.
- Handled only inside the extension context.
- Runtime permission ensures least-privilege model.

## Bonus Features
- Revoke cookie access for the current domain.
- Clear all cookies for the current domain.# CookieAccessManager_Extension
