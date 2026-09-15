import SwiftUI

// MARK: - Quick Add Sheet View
// This is the native SwiftUI sheet that appears when the Back Tap fires.
// It is compact, fast, and feels native — not a web page.

struct QuickAddView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var vm = QuickAddViewModel()

    var body: some View {
        NavigationStack {
            Form {
                // ── Amount ────────────────────────────────────────────────
                Section {
                    HStack {
                        Text("$")
                            .foregroundStyle(.secondary)
                            .font(.title2.weight(.semibold))
                        TextField("0.00", value: $vm.amount, format: .number)
                            .keyboardType(.decimalPad)
                            .font(.title2.weight(.semibold))
                    }
                } header: {
                    Text("Amount")
                }

                // ── Description ───────────────────────────────────────────
                Section {
                    TextField("Coffee, groceries, rent…", text: $vm.description)
                } header: {
                    Text("What was it for?")
                }

                // ── Category ──────────────────────────────────────────────
                Section {
                    if vm.categories.isEmpty {
                        Label("Loading categories…", systemImage: "arrow.clockwise")
                            .foregroundStyle(.secondary)
                    } else {
                        Picker("Category", selection: $vm.selectedCategoryId) {
                            ForEach(vm.expenseCategories) { cat in
                                Text("\(cat.icon) \(cat.name)").tag(cat.id)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                } header: {
                    Text("Category")
                }

                // ── Date ──────────────────────────────────────────────────
                Section {
                    DatePicker("Date", selection: $vm.date, displayedComponents: .date)
                        .labelsHidden()
                } header: {
                    Text("Date")
                }
            }
            .navigationTitle("Quick Add Expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await vm.save(); if vm.saved { dismiss() } }
                    }
                    .fontWeight(.semibold)
                    .disabled(!vm.canSave || vm.saving)
                }
            }
            .overlay {
                if vm.saving {
                    ZStack {
                        Color.black.opacity(0.2).ignoresSafeArea()
                        ProgressView("Saving…")
                            .padding(20)
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .alert("Error", isPresented: $vm.showError) {
                Button("OK") {}
            } message: {
                Text(vm.errorMessage)
            }
            .task { await vm.loadCategories() }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - View Model

@MainActor
final class QuickAddViewModel: ObservableObject {
    @Published var amount: Double?          = nil
    @Published var description: String      = ""
    @Published var date: Date               = .now
    @Published var categories: [Category]   = []
    @Published var selectedCategoryId: String = ""
    @Published var saving   = false
    @Published var saved    = false
    @Published var showError = false
    @Published var errorMessage = ""

    var expenseCategories: [Category] { categories.filter { $0.type == "expense" } }

    var canSave: Bool {
        (amount ?? 0) > 0 && !description.trimmingCharacters(in: .whitespaces).isEmpty && !selectedCategoryId.isEmpty
    }

    func loadCategories() async {
        guard
            let token  = SupabaseSession.shared.accessToken,
            let userId = SupabaseSession.shared.userId
        else { return }

        do {
            let cats = try await SupabaseClient.shared.fetchCategories(userId: userId, token: token)
            categories = cats
            if selectedCategoryId.isEmpty, let first = cats.first(where: { $0.type == "expense" }) {
                selectedCategoryId = first.id
            }
        } catch {
            // Non-fatal — user can still try to save
        }
    }

    func save() async {
        guard canSave,
              let amt = amount,
              let token  = SupabaseSession.shared.accessToken,
              let userId = SupabaseSession.shared.userId
        else { return }

        saving = true
        defer { saving = false }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)

        let tx = NewTransaction(
            user_id:     userId,
            amount:      amt,
            description: description.trimmingCharacters(in: .whitespaces),
            category_id: selectedCategoryId,
            date:        dateStr,
            type:        "expense",
            notes:       nil
        )

        do {
            try await SupabaseClient.shared.insertTransaction(tx, token: token)
            saved = true
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

#Preview {
    QuickAddView()
}
