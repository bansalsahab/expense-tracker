import AppIntents
import Foundation

// MARK: - App Shortcut definition
// This registers the "Quick Add Expense" intent with iOS so it appears in:
//   Settings → Accessibility → Touch → Back Tap → Double/Triple Tap
//   Siri Shortcuts app
//   Spotlight

// MARK: - Notification name used to trigger the QuickAdd sheet from AppDelegate/SceneDelegate
extension Notification.Name {
    static let showQuickAdd = Notification.Name("showQuickAdd")
}

@available(iOS 16.0, *)
struct QuickAddExpenseIntent: AppIntent {

    // The name shown in Settings → Accessibility → Touch → Back Tap
    static var title: LocalizedStringResource = "Quick Add Expense"
    static var description = IntentDescription("Add an expense instantly without opening the full app.")

    // IMPORTANT: openAppWhenRun = true is required so iOS brings the app
    // to the foreground and we can present the native SwiftUI sheet.
    // Setting this to false only works for pure background tasks (no UI).
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        // Post a notification — the app's scene observes this and presents QuickAddView
        NotificationCenter.default.post(name: .showQuickAdd, object: nil)
        return .result()
    }
}

// MARK: - App Shortcuts Provider
// This tells iOS about all the shortcuts your app provides.
// iOS 16.4+ will surface these in Settings → Accessibility → Back Tap automatically.

@available(iOS 16.4, *)
struct ExpenseTrackerShortcuts: AppShortcutsProvider {

    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: QuickAddExpenseIntent(),
            phrases: [
                "Add expense in \(.applicationName)",
                "Quick add in \(.applicationName)",
                "Log expense with \(.applicationName)",
            ],
            shortTitle: "Quick Add Expense",
            systemImageName: "dollarsign.circle.fill"
        )
    }
}
