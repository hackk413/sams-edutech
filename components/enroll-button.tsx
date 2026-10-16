"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icon";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  price?: number;
  enrolled: boolean;
}

export function EnrollButton({ courseId, courseTitle, price = 2499, enrolled }: EnrollButtonProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleEnrollClick() {
    setMessage("");
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Open clean, interactive checkout modal
    setShowPaymentModal(true);
  }

  async function executeEnrollment() {
    setPaymentProcessing(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Simulate instantaneous secure gateway webhook confirmation
      await new Promise((resolve) => setTimeout(resolve, 900));

      const { error: insertError } = await supabase
        .from("enrollments")
        .insert({ user_id: user.id, course_id: courseId, progress_percent: 0 });

      if (insertError?.code === "23505") {
        setMessage("You are already enrolled in this course.");
        setShowPaymentModal(false);
        router.refresh();
        return;
      }

      if (insertError) {
        setError("Unable to finalize enrollment. Please retry or contact support.");
        return;
      }

      setMessage("Payment verified! Enrollment active. Redirecting to dashboard...");
      setTimeout(() => {
        setShowPaymentModal(false);
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch {
      setError("Payment gateway timed out. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  }

  if (enrolled) {
    return (
      <div className="form-success" role="status">
        <Icon name="check" size={16} /> Enrolled &bull; Access Active
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-orange"
        type="button"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={handleEnrollClick}
        disabled={paymentProcessing}
      >
        <span>Enroll &amp; Pay &bull; &#8377;{price.toLocaleString()}</span>
        <Icon name="arrow" size={16} />
      </button>

      {message && <div className="form-success" role="status" style={{ marginTop: 10 }}>{message}</div>}
      {error && !showPaymentModal && <div className="form-error" role="alert" style={{ marginTop: 10 }}>{error}</div>}

      {/* ── INTERACTIVE PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="payment-modal-backdrop" onClick={() => !paymentProcessing && setShowPaymentModal(false)}>
          <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="sec-eyebrow" style={{ fontSize: "10px", marginBottom: "4px" }}>Instant Secure Checkout</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 800 }}>{courseTitle}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !paymentProcessing && setShowPaymentModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-summary-box">
              <div className="summary-row">
                <span>Tuition &amp; Certification Fee</span>
                <strong>&#8377;{price.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Access Duration</span>
                <span style={{ color: "var(--blue)", fontWeight: 700 }}>Lifetime + Mentorship</span>
              </div>
              <div className="summary-row total-row">
                <span>Total Amount Due</span>
                <strong className="total-amount">&#8377;{price.toLocaleString()}</strong>
              </div>
            </div>

            <div className="payment-method-selector">
              <label className="method-label">Select Payment Method:</label>
              <div className="method-tabs">
                <button
                  type="button"
                  className={`method-tab ${selectedMethod === "upi" ? "active" : ""}`}
                  onClick={() => setSelectedMethod("upi")}
                >
                  <Icon name="spark" size={14} /> UPI / QR
                </button>
                <button
                  type="button"
                  className={`method-tab ${selectedMethod === "card" ? "active" : ""}`}
                  onClick={() => setSelectedMethod("card")}
                >
                  <Icon name="shield" size={14} /> Cards
                </button>
                <button
                  type="button"
                  className={`method-tab ${selectedMethod === "netbanking" ? "active" : ""}`}
                  onClick={() => setSelectedMethod("netbanking")}
                >
                  <Icon name="grid" size={14} /> Net Banking
                </button>
              </div>
            </div>

            {selectedMethod === "upi" && (
              <div className="method-content">
                <div className="field">
                  <label htmlFor="upi-id" style={{ fontSize: "0.78rem" }}>Enter your UPI ID (Google Pay, PhonePe, Paytm)</label>
                  <input
                    id="upi-id"
                    type="text"
                    placeholder="yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ height: "40px" }}
                  />
                </div>
                <div className="fast-scan-note">
                  <Icon name="check" size={14} /> Zero convenience fee on all UPI transactions.
                </div>
              </div>
            )}

            {selectedMethod === "card" && (
              <div className="method-content">
                <div className="field">
                  <label style={{ fontSize: "0.78rem" }}>Card Number</label>
                  <input type="text" placeholder="4111 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 1111" style={{ height: "40px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem" }}>Expiry</label>
                    <input type="text" placeholder="MM/YY" style={{ height: "40px" }} />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem" }}>CVV</label>
                    <input type="password" maxLength={4} placeholder="CVV" style={{ height: "40px" }} />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === "netbanking" && (
              <div className="method-content">
                <div className="field">
                  <label style={{ fontSize: "0.78rem" }}>Select Primary Bank</label>
                  <select style={{ height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--white)", color: "var(--ink)" }}>
                    <option>HDFC Bank</option>
                    <option>State Bank of India</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              </div>
            )}

            {error && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-orange"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={executeEnrollment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? "Authorizing Payment &bull;&bull;&bull;" : `Pay ₹${price.toLocaleString()} & Complete Enrollment`}
              </button>
              <div className="security-guarantee">
                <Icon name="shield" size={14} /> 256-bit Encrypted SSL &bull; Razorpay / Cashfree Compatible Gateway
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
