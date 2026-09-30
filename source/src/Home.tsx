import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Code2,
  ExternalLink,
  FileCheck2,
  Github,
  KeyRound,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  Terminal,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const API_URL = import.meta.env.VITE_CYRADUCT_API_URL || "https://api.cyraduct.com";
const GITHUB_URL = "https://github.com/raheem-verisigil/cyraduct";

const tiers = [
  {
    number: "01",
    title: "Advisory",
    label: "See what should happen",
    description: "Evaluate an action outside the execution path and return a documented decision trail.",
    guarantee: "A decision trail for every evaluated action.",
    limitation: "A caller can still ignore the response.",
    icon: FileCheck2,
  },
  {
    number: "02",
    title: "Attested",
    label: "Require proof before execution",
    description: "A compliant destination checks for a current Cyraduct receipt before it acts.",
    guarantee: "No compliant sink executes without a valid, unexpired, unrevoked receipt.",
    limitation: "A sink can bypass or ignore the requirement.",
    icon: ShieldCheck,
    featured: true,
  },
  {
    number: "03",
    title: "Broker-enforced",
    label: "Put the boundary in the path",
    description: "Actions route through a Cyraduct gateway or sidecar before reaching the destination.",
    guarantee: "Integrated actions cannot bypass the network-layer enforcement path.",
    limitation: "Availability and latency become Cyraduct dependencies.",
    icon: Network,
  },
];

const nonGoals = [
  "Does not prevent all misuse. It reduces the surface for unauthorized or unreviewed consequential actions, but cannot guarantee the absence of failure, evasion, or novel attack paths.",
  "Does not replace identity or access management. Cyraduct consumes identity signals from your existing IAM/PAM stack; it does not issue or own identity.",
  "Does not adjudicate legal liability. It produces evidence for legal, compliance, and regulatory review; it does not determine fault or compliance status.",
  "Does not author domain policy unilaterally. Policy packs are versioned and attributed to a named signing authority; Cyraduct hosts and enforces them.",
  "Does not require full custody to provide value. Attested mode provides enforceable guarantees without making Cyraduct a routing bottleneck for every action.",
];

const proofPillars = [
  ["Signed", "Ed25519 receipts bind the decision to a verifiable cryptographic signature."],
  ["Bound", "The receipt is tied to the action and agent it authorizes."],
  ["Time-limited", "Every receipt carries an expiry appropriate to the consequence class."],
  ["Revocable", "Issued authority can be invalidated independently of the original policy history."],
  ["Conformant", "The public test suite makes protocol behavior inspectable rather than aspirational."],
];

const retentionLayers = [
  ["Receipt infrastructure", "Make reliance evidence a reusable artifact across services, not a dashboard-only event."],
  ["Versioned policy packs", "Encode organizational rules and institutional memory into versioned, attributable policy."],
  ["Conformance in CI/CD", "Let engineering teams continuously test whether an agent, gateway or sink still honors the boundary."],
  ["Verification libraries", "Give downstream systems small, composable primitives for signature, expiry, binding and revocation checks."],
  ["Evidence history", "Answer the future audit question: why was this action trusted at that moment?"],
  ["Conformance ecosystem", "Create a path for infrastructure vendors and agent platforms to demonstrate Cyraduct compatibility."],
];

export default function Home() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [apiState, setApiState] = useState<"checking" | "online" | "offline">("checking");
  const [infraChecks, setInfraChecks] = useState({ publicKey: "checking", fixtures: "checking", openapi: "checking" });
  const [receiptId, setReceiptId] = useState("");
  const [verification, setVerification] = useState<VerificationState>({ status: "idle" });
  const [tamperTest, setTamperTest] = useState<VerificationState>({ status: "idle" });
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>({ name: "", company: "", email: "", role: "", partner_type: "AI Platform", message: "" });
  const [partnerStatus, setPartnerStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [partnerMessage, setPartnerMessage] = useState("");

  useEffect(() => {
    const check = async (path: string, key: "publicKey" | "fixtures" | "openapi") => {
      try {
        const response = await fetch(`${API_URL}${path}`);
        setInfraChecks((current) => ({ ...current, [key]: response.ok ? "online" : "offline" }));
      } catch {
        setInfraChecks((current) => ({ ...current, [key]: "offline" }));
      }
    };
    fetch(`${API_URL}/healthz`)
      .then((response) => setApiState(response.ok ? "online" : "offline"))
      .catch(() => setApiState("offline"));
    check("/v1/public-key", "publicKey");
    check("/v1/conformance/fixtures", "fixtures");
    check("/openapi.json", "openapi");
  }, []);

  const runConformance = async () => {
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/v1/conformance/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await response.json();
      setResult({ ok: response.ok, data });
    } catch {
      setResult({ ok: false, data: { error: "Unable to reach the live conformance endpoint." } });
    } finally {
      setRunning(false);
    }
  };

  const verifyReceipt = async () => {
    const id = receiptId.trim();
    if (!id) {
      setVerification({ status: "error", title: "Enter a receipt ID", text: "Paste a Cyraduct receipt ID to query the live verification endpoint." });
      return;
    }
    setVerification({ status: "checking" });
    try {
      const response = await fetch(`${API_URL}/v1/attested/verify/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok) {
        setVerification({ status: "error", title: "Verification request failed", text: JSON.stringify(data) });
        return;
      }
      setVerification({
        status: data.valid ? "valid" : "invalid",
        title: data.valid ? "Receipt accepted by the enforcing verifier" : "Receipt refused by the enforcing verifier",
        text: data.reason || "The live Cyraduct verifier returned a decision.",
        data,
      });
    } catch {
      setVerification({ status: "error", title: "Verifier unavailable", text: "The live API could not be reached from this browser." });
    }
  };

  const createLiveTestReceipt = async () => {
    setVerification({ status: "checking" });
    try {
      const response = await fetch(`${API_URL}/v1/attested/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "cyraduct-public-demo",
          principal: "demo:public",
          framework: "cyraduct-site",
          action_type: "update_vendor_bank_details",
          consequence_class: "vendor_master_change",
          purpose: "safe public Finance Guard demonstration",
          consumer: "demo:sink",
          jurisdiction: "US",
          policy_pack: "finance_vendor_change_v1",
          payload: {
            vendor_id: "demo-vendor-1842",
            old_account_fingerprint: "sha256:demo-old",
            new_account_fingerprint: "sha256:demo-new",
            callback_verified: true,
            callback_channel_preexisting: true,
            reviewer_id: "public-demo-reviewer",
            new_beneficiary: true,
            dual_approval: true,
            sender_domain_match: true,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.receipt?.receipt_id) {
        setVerification({ status: "error", title: "Live receipt was not issued", text: data?.decision?.reasons?.join("; ") || JSON.stringify(data) });
        return;
      }
      const id = data.receipt.receipt_id;
      setReceiptId(id);
      setVerification({ status: "valid", title: "Live receipt issued", text: "The public API evaluated a safe Finance Guard test action and returned a signed receipt. Verify it again or run the action-mismatch refusal test.", data });
    } catch {
      setVerification({ status: "error", title: "Live API unavailable", text: "The public API could not issue the safe demonstration receipt." });
    }
  };

  const runTamperTest = async () => {
    const id = receiptId.trim();
    if (!id) {
      setTamperTest({ status: "error", title: "Enter a receipt ID first", text: "The test uses the same receipt you are verifying." });
      return;
    }
    setTamperTest({ status: "checking" });
    try {
      const response = await fetch(
        `${API_URL}/v1/broker/execute?receipt_id=${encodeURIComponent(id)}&execution_webhook=https%3A%2F%2Fexample.invalid%2Fcyraduct-lab-sink`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: "cyraduct-lab-tamper",
            action_type: "deliberately_mismatched_action",
            consequence_class: "low_risk",
            payload: {},
          }),
        },
      );
      const data = await response.json();
      const refused = data?.reason === "action_binding_mismatch" && data?.executed === false;
      setTamperTest({
        status: refused ? "valid" : "invalid",
        title: refused ? "Boundary refused the altered action" : "Boundary result returned",
        text: refused
          ? "The test changes the action presented to the broker. The broker returned the exact action-binding refusal and a real sink was not reached. The sink URL is a reserved example.invalid address and is never intended to execute anything."
          : "The broker returned a response that should be inspected before treating this as a refusal proof.",
        data,
      });
    } catch {
      setTamperTest({ status: "error", title: "Tamper test unavailable", text: "The live broker endpoint could not be reached." });
    }
  };

  const submitPartnerRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPartnerStatus("sending");
    setPartnerMessage("");
    try {
      const response = await fetch(`${API_URL}/api/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.detail?.[0]?.msg || data?.message || "Unable to submit partnership request");
      setPartnerStatus("success");
      setPartnerMessage("Thank you. The CYRADUCT team will review your partnership request.");
      setPartnerForm({ name: "", company: "", email: "", role: "", partner_type: "AI Platform", message: "" });
    } catch (error) {
      setPartnerStatus("error");
      setPartnerMessage(error instanceof Error ? error.message : "The partnership form is temporarily unavailable. Please email hello@cyraduct.com.");
    }
  };

  const resultSummary = summarizeConformance(result);

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="site-container flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-3 font-semibold tracking-tight">
            <img src="/logo-mark.png" alt="Cyraduct" className="h-8 w-auto" /><span className="text-lg">Cyraduct</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#finance" className="nav-link">Finance Guard</a>
            <a href="#model" className="nav-link">How it works</a>
            <a href="#verify" className="nav-link">Verify</a>
            <a href="#status" className="nav-link">Status</a>
            <a href="#tiers" className="nav-link">Deployment</a>
            <a href="#retention" className="nav-link">Why it sticks</a>
            <a href="#partners" className="nav-link">Partners</a>
            <a href="#developers" className="nav-link">Developers</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="nav-link inline-flex items-center gap-1">GitHub <ExternalLink size={12} /></a>
          </nav>
          <a href="#finance" className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 sm:inline-flex">See Finance Guard</a>
        </div>
      </header>

      <div className="border-b border-white/10 bg-[#050d18]">
        <div className="site-container flex flex-wrap items-center gap-x-5 gap-y-3 py-3 text-xs">
          <div className="inline-flex items-center gap-2 font-semibold text-slate-200"><span className={`h-2 w-2 rounded-full ${apiState === "online" ? "bg-cyan-300" : apiState === "offline" ? "bg-red-400" : "bg-slate-500"}`} /> API {apiState === "online" ? "Operational" : apiState === "offline" ? "Unavailable" : "Checking"}</div>
          <span className="hidden text-slate-700 sm:inline">·</span><span className="text-slate-400">Protocol v0.2.1</span>
          <span className="text-slate-700">·</span><span className="text-slate-400">Ed25519 receipts</span>
          <span className="text-slate-700">·</span><span className="text-slate-400">3 enforcement tiers</span>
          <div className="ml-auto flex flex-wrap gap-3 font-medium">
            <a href="#status" className="text-cyan-200 hover:text-white">Status</a>
            <a href="#verify" className="text-cyan-200 hover:text-white">Verify</a>
            <a href={`${API_URL}/openapi.json`} target="_blank" rel="noreferrer" className="text-cyan-200 hover:text-white">OpenAPI</a>
            <a href="#developers" className="text-cyan-200 hover:text-white">Developers</a>
          </div>
        </div>
      </div>

      <main id="top">
        <section className="hero-grid relative overflow-hidden border-b border-white/10">
          <div className="hero-glow" />
          <div className="site-container relative grid gap-12 py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-28">
            <div>
              <div className="eyebrow"><span className="status-dot" /> Open protocol · reference implementation · self-hostable</div>
              <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                The consequence boundary for <span className="text-cyan-300">AI agents.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                When an AI agent or finance workflow wants to act, Cyraduct makes the required evidence verifiable before another system relies on it — with signed receipts, bounded expiry, independent revocation, and enforceable verification.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#finance" className="cta-primary">Protect a financial action <ArrowRight size={17} /></a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="cta-secondary">Read the protocol <Github size={17} /></a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-cyan-300" /> Ed25519-signed</span>
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-cyan-300" /> Action-bound</span>
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-cyan-300" /> Time-bounded</span>
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-cyan-300" /> Revocable</span>
              </div>
            </div>
            <div className="hero-terminal">
              <div className="terminal-top"><span /><span /><span /><div className="ml-auto text-[11px] text-slate-500">reliance / verified</div></div>
              <div className="p-6 font-mono text-[12px] leading-6 sm:text-sm">
                <div className="text-slate-500">$ cyraduct evaluate --action update_vendor_bank_details</div>
                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <span className="text-slate-500">decision</span><span className="text-cyan-300">ALLOW</span>
                  <span className="text-slate-500">consequence</span><span>vendor_master_change</span>
                  <span className="text-slate-500">policy</span><span>finance_vendor_change_v1</span>
                  <span className="text-slate-500">receipt</span><span>rcpt_••••••••••••</span>
                  <span className="text-slate-500">expires</span><span>bounded · time-limited</span>
                  <span className="text-slate-500">signature</span><span className="text-cyan-300">Ed25519 ✓</span>
                </div>
                <div className="mt-6 border-t border-white/10 pt-5 text-slate-400"><span className="text-cyan-300">→</span> downstream sink checks receipt before execution</div>
              </div>
            </div>
          </div>
        </section>

        <section id="finance" className="section-shell border-b border-white/10 bg-[#091522]">
          <div className="site-container grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <div className="section-kicker">Cyraduct Finance Guard</div>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Stop risky vendor changes before they reach the payment system.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">Cyraduct gives AP, treasury, and finance automation a verifiable action boundary. A vendor-bank change or AI-initiated payment needs the right evidence, a trusted verification step, and a current receipt before a compliant sink acts.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="mailto:hello@cyraduct.com?subject=Finance%20Guard%20pilot" className="cta-primary">Discuss a pilot <ArrowRight size={17} /></a>
                <a href="#developers" className="cta-secondary">Build the adapter <Code2 size={17} /></a>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">Finance Guard is a reference application and pilot path. It does not move money, replace the ERP, autonomously approve payments, or claim regulatory compliance by itself.</p>
            </div>
            <div className="dark-card p-6 sm:p-7">
              <div className="text-sm font-semibold text-slate-100">The control loop</div>
              <div className="mt-6 space-y-4">
                {[
                  ["01", "Detect", "An email, ERP workflow, or agent proposes a consequential financial action."],
                  ["02", "Verify", "Trusted evidence and human review establish what may be relied on."],
                  ["03", "Receipt", "Cyraduct signs a time-limited, action-bound authorization."],
                  ["04", "Enforce", "The ERP, bank, or payment sink verifies before execution."],
                ].map(([number, title, text]) => <div key={number} className="flex gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"><span className="font-mono text-xs text-cyan-300">{number}</span><div><div className="font-semibold text-slate-100">{title}</div><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div></div>)}
              </div>
              <div className="mt-6 rounded-xl border border-cyan-300/15 bg-cyan-300/[.04] px-4 py-3 font-mono text-xs leading-6 text-slate-300">update_vendor_bank_details<br /><span className="text-cyan-300">→ receipt required before sink acts</span></div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#091522]">
          <div className="site-container grid gap-8 py-14 md:grid-cols-3">
            <Stat icon={LockKeyhole} title="Proof before reliance" text="A receipt is evidence a downstream system can verify, not a promise hidden in policy prose." />
            <Stat icon={Clock3} title="Bounded by time" text="Every receipt carries consequence-class-appropriate expiry. Indefinite validity is treated as a design flaw." />
            <Stat icon={RefreshCw} title="Revocable independently" text="Previously issued authority can be invalidated without rewriting the action or policy history." />
          </div>
        </section>

        <section id="model" className="section-shell">
          <div className="site-container">
            <SectionIntro kicker="The action-reliance model" title="Policy language becomes an enforceable boundary." text="The important question is not only whether an AI action was allowed. It is whether the next system has machine-verifiable evidence that it may rely on that action." />
            <div className="flow-grid mt-12">
              {[
                ["01", "Agent", "Proposes a consequential action."],
                ["02", "Evaluate", "Policy, consequence and available evidence produce a decision."],
                ["03", "Receipt", "An allow or conditional decision becomes signed, time-bounded proof."],
                ["04", "Enforcing sink", "The destination verifies before it acts."],
              ].map(([n, title, text], index) => (
                <div key={n} className="flow-card relative">
                  <div className="flow-number">{n}</div><h3>{title}</h3><p>{text}</p>
                  {index < 3 && <ChevronRight className="flow-arrow hidden lg:block" size={19} />}
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[["Identity", "Cyraduct consumes existing IAM signals; it does not replace identity."], ["Reliance", "Cyraduct answers what evidence is required before a consequential action is trusted."], ["Execution", "Attested and broker-enforced modes put the reliance check at or before the action boundary."]].map(([title, text]) => (
                <div key={title} className="dark-card p-5"><div className="text-sm font-semibold text-slate-100">{title}</div><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="verify" className="section-shell border-y border-white/10 bg-[#091522]">
          <div className="site-container grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <SectionIntro kicker="Verification lab" title="Don't trust the demo. Verify the boundary." text="Cyraduct exposes a live verification endpoint and a public signing key. Paste a real receipt ID to see what the enforcing verifier says. No account is required for this demonstration." />
              <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-400">
                <a className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 hover:border-cyan-300/40 hover:text-slate-200" href={`${API_URL}/v1/public-key`} target="_blank" rel="noreferrer"><KeyRound size={13} /> Public key <ExternalLink size={11} /></a>
                <a className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 hover:border-cyan-300/40 hover:text-slate-200" href={`${API_URL}/v1/conformance/fixtures`} target="_blank" rel="noreferrer"><FileCheck2 size={13} /> Test vectors <ExternalLink size={11} /></a>
                <a className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 hover:border-cyan-300/40 hover:text-slate-200" href={GITHUB_URL} target="_blank" rel="noreferrer"><Code2 size={13} /> Standalone verifier <ExternalLink size={11} /></a>
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-[#07111f] p-5">
                <div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${apiState === "online" ? "bg-cyan-300" : apiState === "offline" ? "bg-red-400" : "bg-slate-500"}`} /><span className="text-sm font-semibold">Live API {apiState === "online" ? "online" : apiState === "offline" ? "unavailable" : "checking"}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Verification here uses the live enforcement endpoint. Independent verification can be performed locally using the published Ed25519 public key and the receipt's canonical signed fields.</p>
              </div>
            </div>

            <div className="dark-card p-6 sm:p-7">
              <div className="flex items-center gap-3"><Terminal size={18} className="text-cyan-300" /><div><div className="font-semibold">Verify a Cyraduct receipt</div><div className="text-xs text-slate-500">Live Tier 2 enforcement check</div></div></div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input value={receiptId} onChange={(e) => setReceiptId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verifyReceipt()} placeholder="rcpt_..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/40" />
                <button onClick={verifyReceipt} disabled={verification.status === "checking"} className="cta-primary disabled:cursor-wait disabled:opacity-60">{verification.status === "checking" ? "Checking…" : "Verify receipt"}</button>
              </div>
              <button onClick={createLiveTestReceipt} disabled={verification.status === "checking"} className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/[.05] disabled:opacity-50"><Zap size={15} /> Create a live test receipt</button>
              <p className="mt-2 text-xs leading-5 text-slate-500">This evaluates a synthetic vendor-change action only. It does not contact a bank, modify an ERP, or move money.</p>
              <VerificationPanel state={verification} />
              <div className="mt-7 border-t border-white/10 pt-6">
                <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 text-cyan-300" /><div><div className="font-semibold">Break the boundary</div><p className="mt-1 text-sm leading-6 text-slate-400">Run a safe refusal test: the same receipt is presented with a deliberately different action. The sink target is a reserved <span className="font-mono text-slate-300">example.invalid</span> address, so this lab never intends to execute a real external action.</p></div></div>
                <button onClick={runTamperTest} disabled={tamperTest.status === "checking"} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/[.03] disabled:opacity-50">{tamperTest.status === "checking" ? "Testing…" : "Test action mismatch"} <X size={15} /></button>
                <VerificationPanel state={tamperTest} compact />
              </div>
            </div>
          </div>
        </section>

        <section id="status" className="section-shell border-y border-white/10 bg-[#050d18]">
          <div className="site-container">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionIntro kicker="Live infrastructure" title="Don't trust the status badge. Check the endpoints." text="Cyraduct exposes the operational surfaces that technical buyers need to inspect: API health, public verification key, conformance fixtures and the live OpenAPI contract." />
              <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="cta-secondary shrink-0">Open API docs <ExternalLink size={15} /></a>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["API", apiState, "/healthz"],
                ["Public key", infraChecks.publicKey, "/v1/public-key"],
                ["Conformance", infraChecks.fixtures, "/v1/conformance/fixtures"],
                ["OpenAPI", infraChecks.openapi, "/openapi.json"],
              ].map(([label, state, path]) => (
                <a key={label} href={`${API_URL}${path}`} target="_blank" rel="noreferrer" className="status-card group">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">{label}</span><ExternalLink size={13} className="text-slate-600 transition group-hover:text-cyan-300" /></div>
                  <div className="mt-5 flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${state === "online" ? "bg-cyan-300" : state === "offline" ? "bg-red-400" : "bg-slate-500"}`} /><span className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{state === "online" ? "Operational" : state === "offline" ? "Unavailable" : "Checking"}</span></div>
                  <div className="mt-3 font-mono text-[11px] text-slate-600">{path}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="tiers" className="section-shell">
          <div className="site-container">
            <SectionIntro kicker="Deployment modes" title="Choose how close the boundary sits to execution." text="Cyraduct is not one deployment pattern. Start with visibility, require attestation at compliant sinks, or place the broker directly in the execution path." />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {tiers.map(({ number, title, label, description, guarantee, limitation, icon: Icon, featured }) => (
                <article key={title} className={`tier-card ${featured ? "tier-card-featured" : ""}`}>
                  <div className="flex items-center justify-between"><div className="tier-number">{number}</div><Icon size={20} className="text-cyan-300" /></div>
                  <div className="mt-10 text-xs font-bold uppercase tracking-[.16em] text-cyan-300">{label}</div>
                  <h3 className="mt-2 text-2xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-7 text-slate-400">{description}</p>
                  <div className="mt-7 border-t border-white/10 pt-5"><div className="text-xs uppercase tracking-[.12em] text-slate-500">Guarantee</div><p className="mt-2 text-sm leading-6 text-slate-200">{guarantee}</p><div className="mt-5 text-xs uppercase tracking-[.12em] text-slate-500">Boundary</div><p className="mt-2 text-sm leading-6 text-slate-400">{limitation}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell border-y border-white/10 bg-[#091522]">
          <div className="site-container grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <SectionIntro kicker="Consequence-aware" title="Not every action deserves the same reliance conditions." text="Cyraduct's action model carries a consequence class into policy evaluation and receipt semantics. Policy packs determine the actual rules; the protocol does not invent a universal risk taxonomy." />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {["financial_transfer", "infra_change", "health_record_access", "generic_tool_call", "low_risk"].map((item) => <div key={item} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 font-mono text-xs text-slate-300">{item}</div>)}
              </div>
            </div>
            <div className="dark-card p-7">
              <div className="section-kicker">The five protocol properties</div>
              <div className="mt-6 space-y-5">
                {proofPillars.map(([title, text]) => <div key={title} className="flex gap-4"><CircleCheck size={18} className="mt-0.5 shrink-0 text-cyan-300" /><div><div className="font-semibold">{title}</div><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="retention" className="section-shell">
          <div className="site-container">
            <SectionIntro kicker="Why it sticks" title="Retention comes from becoming infrastructure, not another dashboard." text="The durable value is created when receipts, policies, verification and conformance become part of how an organization builds and operates AI actions." />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {retentionLayers.map(([title, text], i) => <div key={title} className="dark-card p-6"><div className="text-xs font-mono text-slate-600">0{i + 1}</div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>)}
            </div>
            <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-6 sm:p-8">
              <div className="section-kicker">Future interoperability layer · roadmap</div>
              <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><h3 className="text-2xl font-semibold">Action Passport</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">A future interoperability primitive could carry an agent's identity reference, action intent, consequence class, evidence references and Cyraduct reliance receipt together. This is a design direction, not a current protocol feature.</p></div><div className="rounded-xl border border-white/10 bg-[#07111f] px-5 py-4 font-mono text-xs text-slate-400">identity → action → evidence → receipt → rely/refuse</div></div>
            </div>
          </div>
        </section>

        <section className="section-shell border-y border-white/10 bg-[#091522]">
          <div className="site-container grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <SectionIntro kicker="Conformance" title="Make compatibility a testable property." text="The public suite is part of the product. Vendors, infrastructure teams and researchers should be able to inspect fixtures and run the reference behavior rather than rely on a marketing claim." />
              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><button onClick={runConformance} disabled={running} className="cta-primary disabled:opacity-60">{running ? "Running…" : "Run live conformance"} <Zap size={16} /></button><a href={`${API_URL}/v1/conformance/fixtures`} target="_blank" rel="noreferrer" className="cta-secondary">Inspect fixtures <ExternalLink size={16} /></a></div>
              {resultSummary && <div className={`mt-5 rounded-xl border p-4 text-sm ${resultSummary.ok ? "border-cyan-300/20 bg-cyan-300/[.04]" : "border-red-300/20 bg-red-300/[.04]"}`}><div className="font-semibold">{resultSummary.title}</div><p className="mt-1 text-slate-400">{resultSummary.text}</p></div>}
            </div>
            <div className="receipt-panel p-6 sm:p-7"><div className="flex items-center gap-3"><FileCheck2 size={19} className="text-cyan-300" /><div className="font-semibold">Receipt anatomy</div></div><div className="mt-6 grid gap-3 font-mono text-xs">{[["receipt_id", "rcpt_…"],["agent", "agent_…"],["action_hash", "sha256:…"],["expires_at", "bounded timestamp"],["signature.alg", "Ed25519"],["signature.key_id", "cyraduct-prod-1"],["revoked", "false / true"]].map(([k,v]) => <div key={k} className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/5 pb-3"><span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span></div>)}</div><p className="mt-5 text-xs leading-5 text-slate-500">Illustrative structure based on the live protocol schema. Values are intentionally not presented as a real customer's receipt.</p></div>
          </div>
        </section>

        <section id="non-goals" className="section-shell">
          <div className="site-container grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <SectionIntro kicker="Explicit boundaries" title="Credibility includes saying what Cyraduct does not do." text="The protocol is designed to make a specific boundary enforceable. It does not claim to solve identity, liability, every misuse path, or every regulatory question." />
            <div className="grid gap-3">{nonGoals.map((text, i) => <div key={i} className="non-goal"><X size={17} className="mt-1 shrink-0 text-slate-500" /><span>{text}</span></div>)}</div>
          </div>
        </section>

        <section id="partners" className="section-shell border-y border-white/10 bg-[#091522]">
          <div className="site-container">
            <div className="max-w-3xl">
              <div className="section-kicker">Partner ecosystem</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-5xl">Partner with CYRADUCT</h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">Help define the reliability layer for consequential AI systems.</p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">Cyraduct is being built with the teams that have to make AI actions trustworthy in production: the platforms that create them, the enterprises that rely on them, and the researchers who make the protocol inspectable.</p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {[{
                title: "AI Platform Builders",
                text: "Integrate CYRADUCT boundary verification into agent systems.",
                cta: "Become an integration partner",
                type: "AI Platform",
                icon: Network,
              }, {
                title: "Enterprise AI Teams",
                text: "Evaluate AI action reliability and governance readiness.",
                cta: "Request partnership discussion",
                type: "Enterprise AI",
                icon: ShieldCheck,
              }, {
                title: "Researchers and Standards Groups",
                text: "Collaborate on open protocol development.",
                cta: "Collaborate with CYRADUCT",
                type: "Research",
                icon: Code2,
              }].map(({ title, text, cta, type, icon: Icon }) => <article key={title} className="partner-track dark-card p-6"><Icon size={20} className="text-cyan-300" /><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">{text}</p><a href="#partner-form" onClick={() => setPartnerForm((current) => ({ ...current, partner_type: type }))} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white">{cta} <ArrowRight size={15} /></a></article>)}
            </div>
            <div className="mt-10 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
              <div className="dark-card p-6 sm:p-8">
                <div className="section-kicker">What happens next</div>
                <h3 className="mt-3 text-2xl font-semibold">Start with a concrete boundary.</h3>
                <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300">{["Choose one consequential workflow or integration surface.", "Inspect the protocol, public key, fixtures, and reference implementation.", "Define a focused design-partner path with measurable verification outcomes."].map((item, index) => <div key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 text-xs font-bold text-cyan-200">{index + 1}</span><span>{item}</span></div>)}</div>
                <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">No exclusive trust is required: the receipt format, public signing key, standalone verifier, and conformance fixtures remain inspectable.</p>
              </div>
              <form id="partner-form" onSubmit={submitPartnerRequest} className="dark-card p-6 sm:p-8">
                <div className="section-kicker">Partner intake</div>
                <h3 className="mt-3 text-2xl font-semibold">Tell us where the boundary matters.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">A short, specific message helps us route your request to the right integration or research conversation.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[["name", "Full name", "Ada Lovelace", "text"], ["company", "Company", "Your organization", "text"], ["email", "Work email", "you@company.com", "email"], ["role", "Role", "CTO, platform lead, researcher…", "text"]].map(([name, label, placeholder, type]) => <label key={name} className="block text-sm"><span className="font-medium text-slate-200">{label}</span><input required name={name} type={type} value={partnerForm[name as keyof PartnerFormState]} onChange={(event) => setPartnerForm((current) => ({ ...current, [name]: event.target.value }))} placeholder={placeholder} className="partner-input mt-2" /></label>)}
                  <label className="block text-sm sm:col-span-2"><span className="font-medium text-slate-200">Partner type</span><select required name="partner_type" value={partnerForm.partner_type} onChange={(event) => setPartnerForm((current) => ({ ...current, partner_type: event.target.value }))} className="partner-input mt-2"><option>AI Platform</option><option>Enterprise AI</option><option>Research</option><option>Standards Organization</option></select></label>
                  <label className="block text-sm sm:col-span-2"><span className="font-medium text-slate-200">What would you like to explore?</span><textarea required minLength={20} name="message" value={partnerForm.message} onChange={(event) => setPartnerForm((current) => ({ ...current, message: event.target.value }))} placeholder="Describe the workflow, integration surface, or research question…" rows={4} className="partner-input mt-2 resize-y" /></label>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><button type="submit" disabled={partnerStatus === "sending"} className="cta-primary disabled:cursor-wait disabled:opacity-60">{partnerStatus === "sending" ? "Sending…" : "Request Partnership"} <ArrowRight size={17} /></button><span className="text-xs text-slate-500">We will only use these details to respond to this request.</span></div>
                {partnerMessage && <div role="status" className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${partnerStatus === "success" ? "border-cyan-300/20 bg-cyan-300/[.04] text-cyan-100" : "border-red-300/20 bg-red-300/[.04] text-red-100"}`}>{partnerMessage}</div>}
              </form>
            </div>
          </div>
        </section>

        <section id="developers" className="section-shell border-y border-white/10 bg-[#091522]">
          <div className="site-container grid gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
              <div><div className="section-kicker">Build with it</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Self-host the boundary. Verify without trusting Cyraduct.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">Use the reference implementation, run the live demo, inspect OpenAPI, fetch the public signing key, and verify receipts locally. Your sink can enforce the check without trusting Cyraduct’s server at execution time.</p><div className="mt-7 flex flex-wrap gap-3"><a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="cta-primary">Open API docs <ExternalLink size={17} /></a><a href={`${API_URL}/openapi.json`} target="_blank" rel="noreferrer" className="cta-secondary">Open OpenAPI <ExternalLink size={17} /></a><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="cta-secondary">Open GitHub <Github size={17} /></a></div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <a href={`${API_URL}/v1/conformance/fixtures`} target="_blank" rel="noreferrer" className="developer-link"><FileCheck2 size={16} className="text-cyan-300" /><span><b>Conformance fixtures</b><small>Inspect published test vectors.</small></span></a>
                <a href={`${API_URL}/v1/public-key`} target="_blank" rel="noreferrer" className="developer-link"><KeyRound size={16} className="text-cyan-300" /><span><b>Public signing key</b><small>Verify receipts independently.</small></span></a>
                <a href="#verify" className="developer-link"><ShieldCheck size={16} className="text-cyan-300" /><span><b>Verification lab</b><small>Test a receipt at the action boundary.</small></span></a>
                <div className="developer-link developer-link-muted"><Code2 size={16} className="text-slate-500" /><span><b>SDK / CLI</b><small>Planned after the REST contract stabilizes.</small></span></div>
              </div></div>
            <div className="dark-card p-6"><div className="flex items-center gap-3"><Code2 size={19} className="text-cyan-300" /><span className="font-semibold">A different security primitive</span></div><p className="mt-5 text-lg leading-8 text-slate-200">Not “is the model safe?”<br />Not “did the prompt look malicious?”<br />Not “what did the agent do?”</p><div className="my-5 border-t border-white/10" /><p className="text-lg font-semibold leading-8 text-cyan-200">“What evidence must exist before another system is permitted to rely on this action?”</p></div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="site-container"><div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[.09] to-transparent p-8 sm:p-12"><div className="max-w-3xl"><div className="section-kicker">Evaluate the protocol</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-5xl">Don't take the claim on faith.</h2><p className="mt-5 text-base leading-7 text-slate-300">Verify a receipt. Inspect the key. Run the conformance suite. Read the implementation. Then decide whether Cyraduct belongs at your action boundary.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#verify" className="cta-primary">Prove the boundary <ArrowRight size={17} /></a><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="cta-secondary">Read the protocol <Github size={17} /></a></div></div></div></div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#07111f]"><div className="site-container flex flex-col gap-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><img src="/logo-mark.png" alt="Cyraduct" className="h-6 w-auto opacity-90" /><span><span className="font-semibold text-slate-300">Cyraduct</span> · open, vendor-neutral reliance and consequence-boundary protocol for AI agent actions.</span></div><div className="flex gap-5"><a href="#model" className="hover:text-slate-200">Protocol</a><a href="#verify" className="hover:text-slate-200">Verify</a><a href="mailto:hello@cyraduct.com" className="hover:text-slate-200">Contact</a><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-slate-200">GitHub</a></div></div></footer>
    </div>
  );
}

type VerificationState = { status: "idle" | "checking" | "valid" | "invalid" | "error"; title?: string; text?: string; data?: unknown };
type PartnerFormState = { name: string; company: string; email: string; role: string; partner_type: string; message: string };

function VerificationPanel({ state, compact = false }: { state: VerificationState; compact?: boolean }) {
  if (state.status === "idle") return null;
  if (state.status === "checking") return <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">Checking the live verifier…</div>;
  const positive = state.status === "valid";
  const title = state.title ?? "Verification result";
  const text = state.text ?? "";
  const dataText = state.data == null ? null : (JSON.stringify(state.data, null, 2) ?? "");
  return <div className={`mt-5 rounded-xl border p-4 ${positive ? "border-cyan-300/20 bg-cyan-300/[.04]" : "border-red-300/20 bg-red-300/[.04]"}`}><div className="flex items-center gap-2 font-semibold">{positive ? <CircleCheck size={17} className="text-cyan-300" /> : <X size={17} className="text-red-300" />}{title}</div><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>{!compact && dataText !== null && <pre className="mt-4 max-h-56 overflow-auto rounded-lg border border-white/5 bg-black/20 p-3 text-[11px] leading-5 text-slate-400">{dataText}</pre>}</div>;
}

function SectionIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) { return <div className="max-w-3xl"><div className="section-kicker">{kicker}</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h2><p className="mt-4 text-base leading-7 text-slate-400">{text}</p></div>; }
function Stat({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) { return <div className="stat-item"><Icon size={20} className="text-cyan-300" /><div><h3 className="font-semibold text-slate-100">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div></div>; }
function summarizeConformance(result: unknown) { if (!result || typeof result !== "object") return null; const typed = result as { ok?: boolean; data?: unknown }; if (typed.ok === false) return { ok: false, title: "Live suite unavailable", text: "The API could not be reached or returned an error." }; const data = typed.data as Record<string, unknown> | undefined; const passed = data && (data.passed ?? data.passing ?? data.passed_count); const total = data && (data.total ?? data.total_count ?? data.fixtures); if (typeof passed === "number" && typeof total === "number") return { ok: true, title: `Conformance returned ${passed}/${total}`, text: "The live protocol returned a conformance result." }; return { ok: true, title: "Live conformance response received", text: "The protocol returned successfully. The page does not invent fixture results." }; }
