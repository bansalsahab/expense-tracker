import SwiftUI

// MARK: - Login View
// Shown when no session token is found. The user signs in once;
// the token is saved and future Back Tap actions skip this screen.

struct LoginView: View {
    @State private var email    = ""
    @State private var password = ""
    @State private var loading  = false
    @State private var error    = ""
    var onSuccess: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue)

                Text("Expense Tracker")
                    .font(.title.weight(.bold))
                Text("Sign in to enable Quick Add")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Spacer().frame(height: 8)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textContentType(.emailAddress)
                        .padding()
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding()
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                }
                .padding(.horizontal)

                if !error.isEmpty {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Button {
                    Task { await signIn() }
                } label: {
                    HStack {
                        if loading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Sign In")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(loading || email.isEmpty || password.isEmpty)
                .padding(.horizontal)

                Spacer()

                Text("Use the same email & password as your web app account.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .padding()
            .navigationTitle("")
            .navigationBarHidden(true)
        }
    }

    private func signIn() async {
        loading = true
        error   = ""
        do {
            let (token, userId) = try await SupabaseClient.shared.signIn(email: email, password: password)
            SupabaseSession.shared.accessToken = token
            SupabaseSession.shared.userId      = userId
            loading = false
            onSuccess()
        } catch {
            self.error   = error.localizedDescription
            self.loading = false
        }
    }
}

#Preview {
    LoginView(onSuccess: {})
}
