export class DotAdsFormElement extends HTMLElement {
  private shadow: ShadowRoot;
  private isSubmitting: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["tenant-id", "api-host", "form-schema-id", "mode"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private get apiHost(): string {
    return this.getAttribute("api-host") || "http://localhost:8787";
  }

  private get tenantId(): string {
    return this.getAttribute("tenant-id") || "";
  }

  private get formSchemaId(): string {
    return this.getAttribute("form-schema-id") || "";
  }

  private get mode(): string {
    return this.getAttribute("mode") || "hybrid";
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          color: #0f172a;
        }
        .form-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .form-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: #0f172a;
        }
        .field-group {
          margin-bottom: 16px;
        }
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 6px;
          color: #334155;
        }
        input, select, textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .submit-button {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .submit-button:hover {
          background: #1d4ed8;
        }
        .submit-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .error-summary {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          display: none;
        }
      </style>
      <div class="form-container">
        <div class="form-title">Pesan Sekarang (Single-Page Order)</div>
        <div class="error-summary" id="error-summary"></div>
        <form id="dotads-order-form">
          <div class="field-group">
            <label for="customerName">Nama Lengkap *</label>
            <input type="text" id="customerName" name="customerName" required placeholder="Contoh: Budi Santoso" />
          </div>
          <div class="field-group">
            <label for="customerPhone">Nomor WhatsApp / HP *</label>
            <input type="tel" id="customerPhone" name="customerPhone" required placeholder="081234567890" />
          </div>
          <div class="field-group">
            <label for="shippingAddress">Alamat Lengkap Pengiriman *</label>
            <textarea id="shippingAddress" name="shippingAddress" rows="3" required placeholder="Jl. Merdeka No. 123, RT 01 RW 02"></textarea>
          </div>
          <div class="field-group">
            <label for="subdistrictId">Kecamatan / Kota *</label>
            <select id="subdistrictId" name="subdistrictId" required>
              <option value="">Pilih Kecamatan...</option>
              <option value="ID_SUB_1001">Kebayoran Baru, Jakarta Selatan</option>
              <option value="ID_SUB_1002">Gambir, Jakarta Pusat</option>
              <option value="ID_SUB_1003">Coblong, Bandung</option>
            </select>
          </div>
          <div class="field-group">
            <label for="courierCode">Ekspedisi Kurir *</label>
            <select id="courierCode" name="courierCode" required>
              <option value="JNE">JNE Express</option>
              <option value="SICEPAT">SiCepat Express</option>
              <option value="J&T">J&T Express</option>
              <option value="SAP">SAP Express</option>
            </select>
          </div>
          <div class="field-group">
            <label for="paymentMethod">Metode Pembayaran *</label>
            <select id="paymentMethod" name="paymentMethod" required>
              <option value="COD">COD (Bayar di Tempat)</option>
              <option value="QRIS">QRIS / Instant E-Wallet</option>
              <option value="VA_BCA">Virtual Account BCA</option>
              <option value="VA_MANDIRI">Virtual Account Mandiri</option>
            </select>
          </div>
          <button type="submit" class="submit-button" id="submit-btn">Pesan Sekarang</button>
        </form>
      </div>
    `;

    const form = this.shadow.querySelector("#dotads-order-form") as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    const phoneInput = this.shadow.querySelector("#customerPhone") as HTMLInputElement;
    if (phoneInput) {
      phoneInput.addEventListener("blur", () => this.handleDraftLead());
    }
  }

  private async handleDraftLead() {
    try {
      const customerName = (this.shadow.querySelector("#customerName") as HTMLInputElement)?.value || "";
      const customerPhone = (this.shadow.querySelector("#customerPhone") as HTMLInputElement)?.value || "";
      if (!customerPhone || customerPhone.length < 9) return;

      await fetch(`${this.apiHost}/api/v1/public/leads/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: this.tenantId || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
          customerName,
          customerPhone,
          draftDataJson: {
            shippingAddress: (this.shadow.querySelector("#shippingAddress") as HTMLTextAreaElement)?.value || "",
          },
        }),
      });
    } catch {
      // Ignore draft lead capture errors gracefully
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isSubmitting) return;

    const errorSummary = this.shadow.querySelector("#error-summary") as HTMLElement;
    const submitBtn = this.shadow.querySelector("#submit-btn") as HTMLButtonElement;

    if (errorSummary) errorSummary.style.display = "none";
    this.isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Memproses Pesanan...";
    }

    try {
      const customerName = (this.shadow.querySelector("#customerName") as HTMLInputElement).value;
      const customerPhone = (this.shadow.querySelector("#customerPhone") as HTMLInputElement).value;
      const shippingAddress = (this.shadow.querySelector("#shippingAddress") as HTMLTextAreaElement).value;
      const subdistrictId = (this.shadow.querySelector("#subdistrictId") as HTMLSelectElement).value;
      const courierCode = (this.shadow.querySelector("#courierCode") as HTMLSelectElement).value;
      const paymentMethod = (this.shadow.querySelector("#paymentMethod") as HTMLSelectElement).value;

      const payload = {
        tenantId: this.tenantId || "11111111-1111-1111-1111-111111111111",
        customerName,
        customerPhone,
        shippingAddress,
        subdistrictId,
        courierCode,
        paymentMethod,
        items: [
          {
            productId: "22222222-2222-2222-2222-222222222222",
            quantity: 1,
          },
        ],
        attribution: {
          fbp: this.getCookie("_fbp"),
          fbc: this.getCookie("_fbc"),
        },
      };

      const res = await fetch(`${this.apiHost}/api/v1/public/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Gagal membuat pesanan" }));
        throw new Error(errorData.error || "Gagal membuat pesanan");
      }

      const orderData = await res.json();

      // Trigger Meta Pixel Track
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          currency: "IDR",
          value: orderData.totalMinor / 100,
        });
      }

      // Redirect to thank-you page
      window.location.href = `/thank-you?orderNumber=${orderData.orderNumber}&id=${orderData.id}`;
    } catch (err: any) {
      if (errorSummary) {
        errorSummary.innerText = err.message || "Terjadi kesalahan. Silakan coba lagi.";
        errorSummary.style.display = "block";
      }
    } finally {
      this.isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Pesan Sekarang";
      }
    }
  }

  private getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return undefined;
  }
}

if (typeof window !== "undefined" && !customElements.get("dotads-form")) {
  customElements.define("dotads-form", DotAdsFormElement);
}
