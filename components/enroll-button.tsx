"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icon";
import type { UpiGatewayConfig } from "@/lib/types";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  price?: number;
  enrolled: boolean;
}

export function EnrollButton({ courseId, courseTitle, price = 23999, enrolled }: EnrollButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [upiConfig, setUpiConfig] = useState<UpiGatewayConfig>({
    upi_id: "samsedutech@okaxis",
    payee_name: "Sams Edutech",
    qr_image_url: "/upi-qr-default.svg",
    auto_enroll: false,
    active: true,
  });

  const [utrNumber, setUtrNumber] = useState("");
  const [senderUpi, setSenderUpi] = useState("");
  const [receiptScreenshot, setReceiptScreenshot] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load active UPI Gateway Configuration when modal opens
  useEffect(() => {
    if (!showModal) return;
    let isMounted = true;

    fetch("/api/upi/config")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.upi_id) {
          setUpiConfig({
            upi_id: data.upi_id,
            payee_name: data.payee_name || "Sams Edutech",
            qr_image_url: data.qr_image_url || "/upi-qr-default.svg",
            auto_enroll: typeof data.auto_enroll === "boolean" ? data.auto_enroll : true,
            instructions: data.instructions,
            active: typeof data.active === "boolean" ? data.active : true,
          });
        }
      })
      .catch((err) => console.warn("Could not load UPI config:", err))
      .finally(() => {
        if (isMounted) setLoadingConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showModal]);

  async function handleEnrollClick() {
    setStatusMessage("");
    setErrorMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoadingConfig(true);
    setShowModal(true);
  }

  function handleCopyUpi() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(upiConfig.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  }

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("Receipt image must be under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // Compress screenshot to max 1200px width/height to save bandwidth
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.78);
          setReceiptScreenshot(compressed);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Generate mobile UPI Intent link (opens GPay, PhonePe, Paytm directly with prefilled amount)
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiConfig.upi_id)}&pn=${encodeURIComponent(
    upiConfig.payee_name
  )}&am=${price}&cu=INR&tn=${encodeURIComponent(`Enrollment for ${courseTitle.slice(0, 30)}`)}`;

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    const cleanUtr = utrNumber.trim().replace(/\s+/g, "");

    if (!cleanUtr) {
      setErrorMessage("Please enter the 12-digit UPI Reference Number (UTR) from your payment receipt.");
      return;
    }

    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage("Invalid UTR number. It must be exactly 12 numeric digits (e.g., 432109876543).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          course_title: courseTitle,
          amount: price,
          utr_number: cleanUtr,
          sender_upi_id: senderUpi.trim() || null,
          screenshot_url: receiptScreenshot || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Unable to register payment. Please retry or contact support at info@samsedutech.com.");
        setSubmitting(false);
        return;
      }

      setStatusMessage(
        data.enrollment_created
          ? "Payment verified! Your 12-digit UTR was recorded and course enrollment is active! Redirecting..."
          : "Payment submitted successfully! Your 12-digit UTR is under verification with bank records. Redirecting to dashboard..."
      );

      setTimeout(() => {
        setShowModal(false);
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setErrorMessage("Network timed out. Please check your internet connection and retry.");
    } finally {
      setSubmitting(false);
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
      >
        <span>Enroll with UPI QR &bull; &#8377;{price.toLocaleString("en-IN")}</span>
        <Icon name="arrow" size={16} />
      </button>

      {/* ── UPI QR PAYMENT MODAL ── */}
      {showModal && (
        <div className="payment-modal-backdrop" onClick={() => !submitting && setShowModal(false)}>
          <div
            className="payment-modal-card upi-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upi-checkout-title"
          >
            {/* Header */}
            <div className="modal-header">
              <div>
                <span className="sec-eyebrow" style={{ fontSize: "10px", marginBottom: "4px" }}>
                  Instant UPI QR Gateway
                </span>
                <h3 id="upi-checkout-title" style={{ margin: "2px 0 0", fontSize: "1.15rem", fontWeight: 800 }}>
                  {courseTitle}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !submitting && setShowModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Fee Summary */}
            <div className="modal-summary-box">
              <div className="summary-row">
                <span>Tuition &amp; Certification Fee</span>
                <strong>&#8377;{price.toLocaleString("en-IN")}</strong>
              </div>
              <div className="summary-row">
                <span>Access Duration</span>
                <span style={{ color: "var(--blue)", fontWeight: 700 }}>Lifetime + All Weekly Labs</span>
              </div>
              <div className="summary-row total-row">
                <span>Total Amount to Pay</span>
                <strong className="total-amount">&#8377;{price.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            {/* UPI QR SCANNER SECTION */}
            <div className="upi-scanner-wrap">
              <div className="upi-scanner-box">
                {/* Visual scanner corner indicators */}
                <div className="upi-corner upi-tl" />
                <div className="upi-corner upi-tr" />
                <div className="upi-corner upi-bl" />
                <div className="upi-corner upi-br" />

                {loadingConfig ? (
                  <div style={{ padding: "40px 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                    Loading verified QR code...
                  </div>
                ) : (
                  <Image
                    src={upiConfig.qr_image_url}
                    alt={`Scan UPI QR to pay ${upiConfig.payee_name}`}
                    width={220}
                    height={220}
                    className="upi-qr-image"
                    unoptimized
                    priority
                  />
                )}
              </div>

              <div className="upi-id-row">
                <span className="upi-label">UPI ID / VPA:</span>
                <code className="upi-id-code">{upiConfig.upi_id}</code>
                <button
                  type="button"
                  className="btn-copy-upi"
                  onClick={handleCopyUpi}
                  title="Copy UPI ID to clipboard"
                >
                  {copiedUpi ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Direct mobile deep-link button */}
              <div className="upi-mobile-pay-cta">
                <a href={upiIntentUrl} className="btn btn-secondary upi-intent-btn">
                  <Icon name="spark" size={15} /> Pay with GPay / PhonePe / Paytm
                </a>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="upi-instructions-box">
              <div className="upi-step">
                <span className="step-num">1</span>
                <span>Scan official bank QR or tap &apos;Pay with UPI App&apos; and transfer <strong>&#8377;{price.toLocaleString("en-IN")}</strong></span>
              </div>
              <div className="upi-step">
                <span className="step-num">2</span>
                <span>Copy the <strong>12-digit UTR / UPI Ref Number</strong> from your payment receipt</span>
              </div>
              <div className="upi-step">
                <span className="step-num">3</span>
                <span>Paste the 12-digit UTR below &mdash; our system matches your transfer to <strong>{courseTitle}</strong></span>
              </div>
            </div>

            {/* UTR Submission Form */}
            <form onSubmit={handleSubmitPayment} className="upi-utr-form">
              <div className="field">
                <label htmlFor="utr-input" style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  12-Digit UTR / UPI Reference No. <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <div className="utr-input-wrap">
                  <input
                    id="utr-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="e.g. 432109876543"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    required
                    style={{
                      height: "44px",
                      letterSpacing: "1px",
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderColor: utrNumber.length === 12 ? "var(--green)" : "var(--line)",
                    }}
                  />
                  <span className={`utr-counter ${utrNumber.length === 12 ? "valid" : ""}`}>
                    {utrNumber.length}/12
                  </span>
                </div>
              </div>

              <div className="field" style={{ marginTop: "10px" }}>
                <label htmlFor="sender-upi" style={{ fontSize: "0.78rem" }}>
                  Your UPI ID or Phone (Optional, for quick verification)
                </label>
                <input
                  id="sender-upi"
                  type="text"
                  placeholder="e.g. 9876543210@paytm or yourname@okaxis"
                  value={senderUpi}
                  onChange={(e) => setSenderUpi(e.target.value)}
                  style={{ height: "38px" }}
                />
              </div>

              <div className="field" style={{ marginTop: "10px" }}>
                <label htmlFor="receipt-screenshot" style={{ fontSize: "0.78rem", display: "flex", justifyContent: "space-between" }}>
                  <span>Payment Screenshot / Receipt (Recommended)</span>
                  {receiptScreenshot && <span style={{ color: "var(--green)", fontWeight: 700 }}>✓ Attached</span>}
                </label>
                <input
                  id="receipt-screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  style={{ height: "36px", fontSize: "0.8rem", padding: "4px 8px" }}
                />
              </div>

              {errorMessage && (
                <div className="form-error" role="alert" style={{ marginTop: 10 }}>
                  {errorMessage}
                </div>
              )}

              {statusMessage && (
                <div className="form-success" role="status" style={{ marginTop: 10 }}>
                  {statusMessage}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-orange"
                  style={{ width: "100%", justifyContent: "center", height: "46px" }}
                  disabled={submitting || utrNumber.length !== 12}
                >
                  {submitting ? "Verifying UTR &bull;&bull;&bull;" : "Verify UTR & Unlock Course"}
                </button>

                <div className="security-guarantee">
                  <Icon name="shield" size={14} /> Direct UPI Transfer &bull; Zero Gateway Surcharge &bull; Verified by Faculty
                </div>

                <div style={{ marginTop: 10, fontSize: "0.76rem", color: "var(--muted)", textAlign: "center" }}>
                  Need help? Contact support at{" "}
                  <a href="mailto:info@samsedutech.com" style={{ color: "var(--blue)", fontWeight: 700 }}>
                    info@samsedutech.com
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
