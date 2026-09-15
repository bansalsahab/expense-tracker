import Foundation

// MARK: - Configuration
// Replace these with your actual Supabase project values.
// These match the values already in your web app's .env file.
enum SupabaseConfig {
    static let url    = "https://ekzscnsntgzuxmqobxoi.supabase.co"
    static let anonKey = "sb_publishable_LnvctnzHRtIEYd-ltWHkxA_UBjFJ6NF"
}

// MARK: - Models

struct Category: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let color: String
    let icon: String
    let type: String          // "expense" | "income"
}

struct NewTransaction: Codable {
    let user_id: String
    let amount: Double
    let description: String
    let category_id: String
    let date: String          // YYYY-MM-DD
    let type: String
    let notes: String?
}

// MARK: - Auth token storage (keychain-backed via UserDefaults for simplicity)

final class SupabaseSession {
    static let shared = SupabaseSession()
    private init() {}

    private let accessTokenKey  = "supa_access_token"
    private let userIdKey       = "supa_user_id"

    var accessToken: String? {
        get { UserDefaults(suiteName: appGroupID)?.string(forKey: accessTokenKey) }
        set { UserDefaults(suiteName: appGroupID)?.set(newValue, forKey: accessTokenKey) }
    }

    var userId: String? {
        get { UserDefaults(suiteName: appGroupID)?.string(forKey: userIdKey) }
        set { UserDefaults(suiteName: appGroupID)?.set(newValue, forKey: userIdKey) }
    }

    // App Group: allows the app extension (if you add one later) to share the same token.
    // For a standalone app this is just the bundle ID suite.
    private let appGroupID = "group.com.yourname.expensetrackerquickadd"
}

// MARK: - Supabase REST client

final class SupabaseClient {
    static let shared = SupabaseClient()
    private init() {}

    private var baseURL: URL { URL(string: SupabaseConfig.url)! }
    private var anonKey: String { SupabaseConfig.anonKey }

    // MARK: Sign in with email + password
    func signIn(email: String, password: String) async throws -> (accessToken: String, userId: String) {
        let url = baseURL.appendingPathComponent("auth/v1/token")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json",  forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey,             forHTTPHeaderField: "apikey")
        request.setValue("grant_type=password", forHTTPHeaderField: "x-grant-type") // not needed but harmless

        let body = ["email": email, "password": password, "grant_type": "password"]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["error_description"] ?? "Sign-in failed"
            throw NSError(domain: "Supabase", code: 401, userInfo: [NSLocalizedDescriptionKey: msg])
        }

        struct AuthResponse: Codable {
            let access_token: String
            let user: UserObj
            struct UserObj: Codable { let id: String }
        }
        let auth = try JSONDecoder().decode(AuthResponse.self, from: data)
        return (auth.access_token, auth.user.id)
    }

    // MARK: Fetch categories for the logged-in user
    func fetchCategories(userId: String, token: String) async throws -> [Category] {
        var components = URLComponents(url: baseURL.appendingPathComponent("rest/v1/categories"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "user_id", value: "eq.\(userId)"),
            URLQueryItem(name: "order",   value: "created_at.asc"),
            URLQueryItem(name: "select",  value: "id,name,color,icon,type"),
        ]
        var request = URLRequest(url: components.url!)
        request.setValue(anonKey,           forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json",forHTTPHeaderField: "Accept")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([Category].self, from: data)
    }

    // MARK: Insert a new transaction
    func insertTransaction(_ tx: NewTransaction, token: String) async throws {
        let url = baseURL.appendingPathComponent("rest/v1/transactions")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(anonKey,              forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)",    forHTTPHeaderField: "Authorization")
        request.setValue("application/json",   forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal",     forHTTPHeaderField: "Prefer")

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(tx)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "Insert failed"
            throw NSError(domain: "Supabase", code: 500, userInfo: [NSLocalizedDescriptionKey: msg])
        }
    }
}
