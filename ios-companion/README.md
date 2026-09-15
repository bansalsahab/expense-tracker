# Expense Tracker — iOS Quick Add Companion

A native SwiftUI app that provides a real `AppIntent` / `AppShortcut` so you can assign **"Quick Add Expense"** to iPhone Back Tap — with **no Safari, no browser, no web page**.

---

## What this app does

| | Web app (PWA) | This native companion |
|---|---|---|
| Back Tap → native sheet | ❌ impossible | ✅ |
| No browser required | ❌ (URL scheme → Safari) | ✅ |
| Appears in Settings → Back Tap | ❌ | ✅ |
| Saves to same Supabase DB | ✅ | ✅ |
| Works offline | ❌ | ❌ (needs network to save) |

---

## Requirements

- Xcode 15.4 or later
- iPhone with iOS 16.4 or later (AppShortcutsProvider requires iOS 16.4+)
- An Apple Developer account (free account works for personal device)
- Your Supabase project already set up (same one the web app uses)

---

## Setup

### 1. Open in Xcode

```bash
open ios-companion/ExpenseTrackerQuickAdd/ExpenseTrackerQuickAdd.xcodeproj
```

### 2. Set your Team

In Xcode → click the project → Signing & Capabilities → Team → select your Apple ID.

Change `PRODUCT_BUNDLE_IDENTIFIER` to something unique like `com.yourname.expensetrackerquickadd`.

### 3. Update the App Group ID (optional — for future extension support)

In `SupabaseClient.swift`, change:
```swift
private let appGroupID = "group.com.yourname.expensetrackerquickadd"
```
to match your bundle ID prefix. If you skip this, the app uses standard `UserDefaults` which works fine for a standalone app.

### 4. Build & run on your iPhone

Plug in your iPhone → select it as the target → ▶ Run.

### 5. Sign in

Open the app → sign in with the **same email + password** you use on the web app. Your session is saved — you only do this once.

### 6. Wire up Back Tap

```
iPhone Settings
→ Accessibility
→ Touch
→ Back Tap
→ Double Tap
→ Shortcuts section → "Quick Add Expense"
```

Now **double-tap the Apple logo** on the back of your iPhone. The Quick Add sheet appears instantly — no browser, no Safari, pure native iOS.

---

## How it works

```
Double-tap Apple logo
        ↓
iOS fires Back Tap → runs "Quick Add Expense" AppShortcut
        ↓
QuickAddExpenseIntent.perform() is called
        ↓
Native SwiftUI sheet appears (QuickAddView)
        ↓
User enters: amount / category / note / date
        ↓
Tap Save → POST /rest/v1/transactions to Supabase
        ↓
Transaction appears instantly in the web app
(Supabase Realtime pushes the update)
```

---

## Files

| File | Purpose |
|---|---|
| `ExpenseTrackerQuickAddApp.swift` | App entry point, routing between login / main / quick-add |
| `QuickAddView.swift` | Native SwiftUI form sheet |
| `LoginView.swift` | One-time sign-in screen |
| `QuickAddIntent.swift` | `AppIntent` + `AppShortcutsProvider` — this is what Back Tap calls |
| `SupabaseClient.swift` | Pure `URLSession` REST calls to Supabase (no SDK dependency) |
| `Info.plist` | Bundle config + URL scheme `expensetrackerquickadd://` |

---

## iOS version notes

| iOS | AppIntents | AppShortcutsProvider | Back Tap support |
|---|---|---|---|
| 16.0 | ✅ | ❌ | Manual (add to Shortcuts app) |
| 16.4+ | ✅ | ✅ | Automatic (appears in Settings → Back Tap) |
| 17.0+ | ✅ | ✅ | Automatic |

On iOS 16.0–16.3, the shortcut won't appear automatically in Back Tap. The user must open the Shortcuts app, find "Quick Add Expense", and assign it manually. iOS 16.4+ is automatic.

---

## Troubleshooting

**"Quick Add Expense" doesn't appear in Back Tap settings**
- Make sure you've run the app on device at least once (iOS needs to scan the app for AppIntents)
- Requires iOS 16.4+
- Try force-quitting and reopening the Shortcuts app

**Save fails with auth error**
- Open the companion app → sign out → sign in again (Supabase tokens expire after 1 hour by default; a proper implementation would refresh them — see note below)

**Note on token refresh**
The current implementation stores the initial access token. Supabase tokens expire after 3600 seconds. For production use, implement token refresh using the `refresh_token` from the sign-in response and call `POST /auth/v1/token?grant_type=refresh_token` before each save.
