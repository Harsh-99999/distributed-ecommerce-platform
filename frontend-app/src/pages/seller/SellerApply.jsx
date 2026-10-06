import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const EMPTY = {
  businessName: "",
  taxId: "",
  iban: "",
  contactEmail: "",
  contactPhone: "",
};

/** Pre-baked application drafts for fast demo / video walkthroughs. */
const DEMO_APPLICATIONS = [
  {
    id: "anadolu",
    label: "Anadolu Ticaret",
    description: "Kapsamlı çoklu kategori — elektronik + ev",
    businessName: "Anadolu Ticaret",
    taxId: "9876543210",
    iban: "TR330006100519786457841326",
    contactPhone: "+90 532 111 0001",
  },
  {
    id: "premium",
    label: "Premium Outlet",
    description: "Markalı moda ve ayakkabı outlet'i",
    businessName: "Premium Outlet",
    taxId: "8765432109",
    iban: "TR470001000110000123456789",
    contactPhone: "+90 532 111 0002",
  },
  {
    id: "starmag",
    label: "Star Mağaza",
    description: "Yeni satıcı — kitap + hobi ürünleri",
    businessName: "Star Mağaza",
    taxId: "7654321098",
    iban: "TR930001500158007299999931",
    contactPhone: "+90 532 111 0003",
  },
];

export default function SellerApply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [existing, setExisting] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If user already has a seller record, redirect to dashboard.
  useEffect(() => {
    api
      .get("/api/sellers/me")
      .then((r) => setExisting(r.data || r))
      .catch((e) => {
        if (e.status !== 404) setError(e.message);
      })
      .finally(() => setLoadingExisting(false));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function prefill(template) {
    setForm({
      businessName: template.businessName,
      taxId: template.taxId,
      iban: template.iban,
      contactEmail: user?.email ?? "",
      contactPhone: template.contactPhone,
    });
    setError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/sellers/apply", {
        businessName: form.businessName.trim(),
        taxId: form.taxId.trim(),
        iban: form.iban.trim(),
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
      });
      navigate("/seller/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) return <div className="container">Loading…</div>;
  if (existing) {
    return (
      <div className="container">
        <h1>You already have a seller account</h1>
        <p>Status: <strong>{existing.status}</strong></p>
        <Link to="/seller/dashboard" className="btn btn-primary">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Become a Seller</h1>
      <p className="muted">
        Apply to sell on the marketplace. After admin approval you can list products and
        manage your listings.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Demo applications</h3>
        <p className="muted small" style={{ marginTop: 0 }}>
          Click a template below to prefill the form, then hit Submit. Perfect for video
          walkthroughs — the application goes to PENDING, admin can approve it from
          /admin/sellers.
        </p>
        <div className="demo-grid">
          {DEMO_APPLICATIONS.map((d) => (
            <div key={d.id} className="demo-card" style={{ borderLeft: "4px solid #b06000" }}>
              <strong>{d.label}</strong>
              <p className="small" style={{ margin: "4px 0 8px" }}>{d.description}</p>
              <button type="button" className="btn btn-sm" onClick={() => prefill(d)}>
                Use this draft →
              </button>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={onSubmit} className="form" style={{ maxWidth: 560 }}>
        <label>
          Business name *
          <input
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            required
            placeholder="TechMart Elektronik"
          />
        </label>
        <label>
          Tax ID *
          <input
            value={form.taxId}
            onChange={(e) => update("taxId", e.target.value)}
            required
            placeholder="1234567890"
          />
        </label>
        <label>
          IBAN *
          <input
            value={form.iban}
            onChange={(e) => update("iban", e.target.value)}
            required
            placeholder="TR00 0000 0000 0000 0000 0000 00"
          />
        </label>
        <label>
          Contact email
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="seller@example.com"
          />
        </label>
        <label>
          Contact phone
          <input
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            placeholder="+90 555 000 0000"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}
