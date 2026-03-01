"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Building2, CheckCircle2, XCircle } from "lucide-react";

export default function ClientPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid access link. Please contact your account manager.");
      setIsVerifying(false);
      return;
    }

    authenticateWithToken();
  }, [token]);

  const authenticateWithToken = async () => {
    try {
      // Sign in using the token-based provider
      const result = await signIn("client-token", {
        token,
        redirect: false,
        callbackUrl: "/client-dashboard",
      });

      if (result?.error) {
        console.error("Authentication error:", result.error);
        setError("Invalid or expired access link. Please contact your account manager.");
        setIsVerifying(false);
      } else if (result?.ok) {
        // Wait for session to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = "/client-dashboard";
      }
    } catch (err) {
      console.error("Authentication exception:", err);
      setError("An error occurred. Please try again or contact your account manager.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">TaskGrid Client Portal</h1>
          
          {isVerifying ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-600">Verifying your access...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                If you continue to experience issues, please contact your account manager for a new access link.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-600">Access verified! Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
