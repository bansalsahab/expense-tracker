import SwiftUI

@main
struct ExpenseTrackerQuickAddApp: App {
    @State private var isSignedIn   = SupabaseSession.shared.accessToken != nil
    @State private var showQuickAdd = false

    var body: some Scene {
        WindowGroup {
            if isSignedIn {
                MainView(showQuickAdd: $showQuickAdd)
                    .sheet(isPresented: $showQuickAdd) {
                        QuickAddView()
                    }
                    // Triggered by QuickAddExpenseIntent via NotificationCenter
                    .onReceive(NotificationCenter.default.publisher(for: .showQuickAdd)) { _ in
                        showQuickAdd = true
                    }
                    // Also handle the URL scheme: expensetrackerquickadd://quick-add
                    .onOpenURL { url in
                        if url.host == "quick-add" { showQuickAdd = true }
                    }
            } else {
                LoginView {
                    isSignedIn = true
                }
            }
        }
    }
}

// MARK: - Main (home screen of the companion app)

struct MainView: View {
    @Binding var showQuickAdd: Bool
    @State private var showQuickAddSheet = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(.blue)

                Text("Expense Tracker")
                    .font(.largeTitle.weight(.bold))

                Text("Quick Add Companion")
                    .font(.title3)
                    .foregroundStyle(.secondary)

                Divider().padding(.horizontal, 40)

                VStack(alignment: .leading, spacing: 12) {
                    Label("Double-tap the Apple logo on the back of your iPhone", systemImage: "1.circle.fill")
                    Label("iOS will show the Quick Add Expense sheet", systemImage: "2.circle.fill")
                    Label("Enter amount, category, note — tap Save", systemImage: "3.circle.fill")
                    Label("Expense appears instantly in the web app", systemImage: "4.circle.fill")
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 32)

                Spacer()

                // Manual trigger button (for testing)
                Button {
                    showQuickAddSheet = true
                } label: {
                    Label("Quick Add Expense", systemImage: "plus.circle.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .font(.headline)
                }
                .padding(.horizontal)
                .sheet(isPresented: $showQuickAddSheet) {
                    QuickAddView()
                }

                Button("Sign out", role: .destructive) {
                    SupabaseSession.shared.accessToken = nil
                    SupabaseSession.shared.userId      = nil
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.bottom, 8)

                Spacer().frame(height: 20)
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            // Setup instructions link
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(destination: SetupInstructionsView()) {
                        Image(systemName: "questionmark.circle")
                    }
                }
            }
        }
    }
}

// MARK: - Setup Instructions

struct SetupInstructionsView: View {
    var body: some View {
        List {
            Section("Enable Back Tap") {
                Step(n: 1, text: "Open iPhone Settings")
                Step(n: 2, text: "Go to Accessibility → Touch → Back Tap")
                Step(n: 3, text: "Tap Double Tap")
                Step(n: 4, text: "Scroll down to Shortcuts")
                Step(n: 5, text: "Select "Quick Add Expense"")
                Step(n: 6, text: "Done! Double-tap the Apple logo to add an expense")
            }
            Section("How it works") {
                Text("The expense is saved directly to the same database as the web app at expense-tracker-seven-xi-72.vercel.app. No Safari. No browser. Pure native iOS.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Back Tap Setup")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct Step: View {
    let n: Int
    let text: String
    var body: some View {
        Label {
            Text(text)
        } icon: {
            Text("\(n)")
                .font(.caption.weight(.bold))
                .frame(width: 22, height: 22)
                .background(Color.blue)
                .foregroundStyle(.white)
                .clipShape(Circle())
        }
    }
}
