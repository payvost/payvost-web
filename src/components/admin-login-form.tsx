"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Step 1: Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Step 2: Get ID token
      const idToken = await user.getIdToken()

      // Step 3: Create session cookie and verify admin role
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to create session"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // Handle non-JSON responses (like 405 with empty body)
            const text = await response.text()
            if (text) {
              errorMessage = text
            } else {
              // Provide specific message for 405
              if (response.status === 405) {
                errorMessage = "Server configuration error. Please contact support."
              } else {
                errorMessage = `Server error (${response.status})`
              }
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, use status-based message
          if (response.status === 405) {
            errorMessage = "Server configuration error. Please contact support."
          } else if (response.status === 401) {
            errorMessage = "Authentication failed. Please try again."
          } else if (response.status === 403) {
            errorMessage = "Access denied. You do not have admin privileges."
          } else {
            errorMessage = `Server error (${response.status})`
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Step 4: Redirect to admin dashboard
      router.push("/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Handle specific error cases
      if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password")
      } else if (error.code === "auth/user-not-found") {
        setError("No user found with this email")
      } else if (error.code === "auth/wrong-password") {
        setError("Invalid password")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later")
      } else if (error.message.includes("Unauthorized")) {
        setError("Access denied. You do not have admin privileges")
      } else {
        setError(error.message || "An error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access the admin dashboard
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              placeholder="admin@payvost.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500">
        <p>Only authorized administrators can access this portal</p>
      </div>
    </div>
  )
}
