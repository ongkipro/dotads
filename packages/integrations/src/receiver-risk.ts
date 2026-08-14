export interface ReceiverRiskAssessmentInput {
  customerPhone: string;
  shippingAddress: string;
  subdistrictId: string;
  orderTotalMinor: number;
}

export interface ReceiverRiskScore {
  score: number; // 0-100
  tier: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
}

export function evaluateReceiverRisk(input: ReceiverRiskAssessmentInput): ReceiverRiskScore {
  let score = 15;
  const reasons: string[] = [];

  // Address length check
  if (input.shippingAddress.length < 15) {
    score += 35;
    reasons.push("Alamat pengiriman terlalu pendek / kurang detail");
  }

  // Phone number format validation
  if (!input.customerPhone.startsWith("08") && !input.customerPhone.startsWith("62")) {
    score += 40;
    reasons.push("Format nomor WhatsApp / HP mencurigakan");
  }

  // Order value threshold check for COD
  if (input.orderTotalMinor > 1000000) {
    score += 25;
    reasons.push("Nilai transaksi COD di atas Rp 1.000.000");
  }

  let tier: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (score >= 60) {
    tier = "HIGH";
  } else if (score >= 35) {
    tier = "MEDIUM";
  }

  return {
    score: Math.min(score, 100),
    tier,
    reasons,
  };
}
