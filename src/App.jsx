import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import votersData from "./data/voters.json";
import bannerUrl from "./assets/LOGO.jpg";
import bannerUrl1 from "./assets/awe.jpeg";
import bannerUrl2 from "./assets/banner.jpeg";
import bannerUrl23 from "./assets/imagebanner.jpg";
import resultPhoto from "./assets/mama.jpeg";
import new1 from "./assets/new2.jpg";
import new2 from "./assets/new3.jpg";
import new4 from "./assets/new4.jpg";

const CAMPAIGN_TITLE = `🌸 मतदान करा बापू तुकाराम महाजन यांना 🌸
💪 विकास आणि जनसेवेच्या वाटचालीसाठी तुमचा एक मत द्या!

✨ आपल्या भागाचा सर्वांगीण विकास, शिक्षण, रोजगार, आणि स्वच्छतेसाठी —
एकत्र येऊया, बदल घडवूया!

🙏 चला, बापू तुकाराम महाजन यांना आपला पाठिंबा द्या.
आपले मत द्या — उज्वल भविष्यासाठी एक पाऊल पुढे टाका!

#विकासासाठीबापू #जनतेचाआवाज #आपलाबापूमहाजन`;

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);

  // snapshot state
  const [snapshotLoadingFor, setSnapshotLoadingFor] = useState(null);
  const [snapshotMessage, setSnapshotMessage] = useState("");

  // debounce + fuzzy search
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      const q = query.trim();
      if (!q || q.length < 1) {
        setResults([]);
        return;
      }

      const qLower = q.toLocaleLowerCase();

      const filtered = votersData.filter((voter) => {
        const ne = (voter.name_english || "").toLocaleLowerCase();
        const nm = (voter.name_marathi || "").toLocaleLowerCase();
        const re = (voter.relative_name_english || "").toLocaleLowerCase();
        const rm = (voter.relative_name_marathi || "").toLocaleLowerCase();
        const id = (voter.voter_id || "").toLocaleLowerCase();

        return (
          fuzzyIncludes(nm, qLower) ||
          fuzzyIncludes(rm, qLower) ||
          fuzzyIncludes(ne, qLower) ||
          fuzzyIncludes(re, qLower) ||
          fuzzyIncludes(id, qLower)
        );
      });

      setResults(filtered);
    }, 160);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    document.getElementById("voter-search-input")?.focus();
  };

  // Carousel
  const carouselImages = [new2, bannerUrl, new1, new4, bannerUrl1];
  const [slide, setSlide] = useState(0);
  const isPausedRef = useRef(false);
  const AUTO_ADVANCE_MS = 1500;

  useEffect(() => {
    const id = setInterval(() => {
      if (!isPausedRef.current)
        setSlide((s) => (s + 1) % carouselImages.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [carouselImages.length]);

  const goTo = (i) =>
    setSlide(
      ((i % carouselImages.length) + carouselImages.length) %
        carouselImages.length
    );
  const prevSlide = () =>
    setSlide((s) => (s - 1 + carouselImages.length) % carouselImages.length);
  const nextSlide = () => setSlide((s) => (s + 1) % carouselImages.length);

  // Utility: extract a simple house number (first digits sequence) from address
  const extractHouseNumber = (addr = "") => {
    if (!addr) return "—";
    const m = String(addr).match(/\d+[A-Za-z\/\-]*/);
    return m ? m[0] : "—";
  };

  // -------------------------
  // Marathi / Indic fuzzy helpers
  // -------------------------
  function normalizeIndic(s = "") {
    if (!s) return "";
    return s
      .normalize("NFC")
      .toLocaleLowerCase()
      .replace(/[़ँंः]/g, "")
      .replace(/[ू]/g, "ु")
      .replace(/[ी]/g, "ि")
      .replace(/[\u0964\u0965]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripMatras(s = "") {
    return (s || "")
      .replace(/[ ािीुूेैोौृॉॅ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a = "", b = "") {
    const al = a.length;
    const bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
    for (let i = 0; i <= al; i++) dp[i][0] = i;
    for (let j = 0; j <= bl; j++) dp[0][j] = j;
    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[al][bl];
  }

  function fuzzyIncludes(field = "", q = "") {
    if (!field || !q) return false;
    if (field.includes(q)) return true;

    const nf = normalizeIndic(field);
    const nq = normalizeIndic(q);
    if (nf.includes(nq)) return true;

    const sf = stripMatras(nf);
    const sq = stripMatras(nq);
    if (sf && sq && sf.includes(sq)) return true;

    const maxAllowed = Math.max(1, Math.floor(Math.max(nq.length * 0.3, 2)));
    const dist = levenshtein(nf, nq);
    if (dist <= maxAllowed) return true;

    return false;
  }

  // Share card as image (uses html2canvas). Must be async and defined inside the component.
  const shareCardWithInfo = async (voter, e) => {
    // prevent card click toggling
    if (e && e.stopPropagation) e.stopPropagation();

    const cardId = `card-${
      voter.voter_id || `${voter.box_number}-${voter.part_no}`
    }`;
    const node = document.getElementById(cardId);
    if (!node) return;

    setSnapshotLoadingFor(cardId);
    setSnapshotMessage("Preparing image...");

    try {
      node.classList.add("snapshot-active");

      const canvas = await html2canvas(node, {
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      node.classList.remove("snapshot-active");

      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );

      if (!blob) throw new Error("Failed to create image blob");

      const nameForFile = (voter.name_marathi || voter.name_english || "voter")
        .replace(/\s+/g, "-")
        .slice(0, 40);
      const fileName = `${nameForFile}-card.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // 1) Preferred: Web Share API with files
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: "Voter Card" });
          setSnapshotMessage("Shared!");
          setTimeout(() => setSnapshotLoadingFor(null), 900);
          return;
        } catch (err) {
          console.warn("navigator.share with files failed:", err);
        }
      }

      // 2) Clipboard fallback: try to write image to clipboard (secure contexts)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setSnapshotMessage("Image copied to clipboard — paste into chat.");
          setTimeout(() => setSnapshotLoadingFor(null), 1600);
          return;
        } catch (err) {
          console.warn("clipboard image write failed:", err);
        }
      }

      // 3) Final fallback: open the image in a new tab (user can save/attach manually)
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");

      setSnapshotMessage("Image opened in new tab — save & attach manually.");
      setTimeout(() => setSnapshotLoadingFor(null), 1800);
    } catch (err) {
      console.error(err);
      setSnapshotMessage("Failed to prepare image. Check console.");
      setTimeout(() => setSnapshotLoadingFor(null), 1500);
    }
  };
  // Inline style objects
  const footerWrap = {
    marginTop: 24,
    padding: "18px 20px",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
    background:
      "linear-gradient(90deg, rgba(255,246,238,1) 0%, rgba(255,241,245,0.8) 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    position: "relative",
    overflow: "hidden",
    willChange: "transform",
    animation: "float 6s ease-in-out infinite",
  };

  const topRight = {
    alignSelf: "stretch",
    textAlign: "right",
    color: "#475569",
    fontSize: 13,
    marginBottom: 2,
  };

  const marqueeContainer = {
    width: "100%",
    maxWidth: 720,
    overflow: "hidden",
    whiteSpace: "nowrap",
    display: "block",
    borderRadius: 10,
    padding: "6px 12px",
    boxSizing: "border-box",
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.15))",
    backdropFilter: "saturate(140%) blur(6px)",
    border: "1px solid rgba(255,255,255,0.35)",
  };

  const marqueeText = {
    display: "inline-block",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.2px",
    textTransform: "none",
    transform: "translateX(100%)",
    animation: "marquee 12s linear infinite",
    willChange: "transform",
  };

  const heart = {
    display: "inline-block",
    marginLeft: 10,
    transformOrigin: "center",
    animation: "pulse 1.2s ease-in-out infinite",
    fontSize: 18,
  };

  const copyright = {
    fontSize: 13,
    color: "#334155",
    marginTop: 6,
    display: "flex",
    gap: 6,
    alignItems: "center",
  };

  const tinyHeart = {
    display: "inline-block",
    animation: "tinyPulse 1.6s ease-in-out infinite",
    transformOrigin: "center",
    fontSize: 14,
    marginLeft: 6,
  };
  return (
    <div
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, Roboto, Arial, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f8fafc 0%, #f1f5f9 100%)",
        color: "#0f172a",
        paddingBottom: 40,
      }}
    >
      {/* (UI markup identical to previous file) */}

      <style>{`
        :root{ --surface:#ffffff; --muted:#94a3b8; --accent:#0b57d0; --soft:#eef2ff; --card-shadow: 0 12px 36px rgba(2,6,23,0.06); --gap:18px; }
        .site-shell { max-width:1200px; margin:0 auto; padding:28px 20px; }

        .hero{ width:100%; border-radius:16px; overflow:hidden; position:relative; display:flex; align-items:center; margin-bottom:36px }
        .hero { height: clamp(220px, 30vh, 420px) }
        .carousel{ position:relative; width:100%; height:100%; }
        .carousel-track{ display:flex; height:100%; transition: transform 480ms cubic-bezier(.22,.9,.28,1); }
        .carousel-slide{ min-width:100%; height:100%; position:relative; flex:0 0 100%; }
        .carousel-slide img{ width:100%; height:100%; object-fit:cover; display:block }
        .carousel-overlay{ position:absolute; inset:0; background: linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.38) 100%); pointer-events:none }
        .carousel-dots{ position:absolute; left:50%; transform:translateX(-50%); bottom:12px; display:flex; gap:8px; z-index:5 }
        .dot{ width:10px; height:10px; border-radius:999px; background:rgba(255,255,255,0.6); border:1px solid rgba(2,6,23,0.06); cursor:pointer }
        .dot[aria-current='true']{ background:#fff; box-shadow:0 6px 18px rgba(2,6,23,0.12) }

        .search-wrap{ width:100%; max-width:980px; margin:-28px auto 0; padding:12px; display:flex; gap:12px; align-items:center; z-index:3 }
        .search-box{ flex:1; background:var(--surface); border-radius:14px; padding:12px 14px; display:flex; align-items:center; gap:12px; box-shadow:var(--card-shadow); border:1px solid rgba(223, 237, 236, 0.04); }
        .search-box input{ border:0; outline:0; width:100%; font-size:clamp(14px, 1.6vw, 15px); background-color: transparent; color: #0f172a; caret-color: var(--accent); }
        .search-box input::placeholder { color: #94a3b8; opacity: 1; }

        .btn-clear { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; border:0; background: var(--accent); color: #fff; box-shadow: 0 8px 20px rgba(11,87,208,0.18); transition: transform .12s ease, box-shadow .12s ease, opacity .12s; }
        .btn-clear:active{ transform: translateY(1px) }
        .btn-clear[disabled]{ opacity: .6; cursor: default }

        .results{ margin-top:28px; display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:var(--gap); align-items:start }

        .card{ background:var(--surface); border-radius:12px; overflow:hidden; border:1px solid rgba(2,6,23,0.04); box-shadow:var(--card-shadow); transition: transform .18s ease, box-shadow .18s ease; display:flex; flex-direction:column; position:relative; border-left: 4px solid transparent; }
        .card:hover{ transform: translateY(-6px); box-shadow: 0 18px 48px rgba(2,6,23,0.08); border-left-color: rgba(11,87,208,0.9); }

        .card-header{ position:relative; width:100%; height: clamp(88px, 18vw, 160px); overflow:hidden; background:#f1f5f9 }
        .card-header img.banner{ width:100%; height:150%; object-fit:cover; display:block; vertical-align:middle; filter: saturate(1.03) contrast(0.98); }

        .snapshot-overlay {
          position: absolute;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(2,6,23,0.42);
          color: #fff;
          font-weight:700;
          z-index: 40;
          border-radius: 12px;
          pointer-events: none;
        }

        .snapshot-active { transform: none !important; }

        .card-body{ padding:18px 14px 14px 14px; display:flex; gap:12px; flex-direction:column; flex:1 }

        .share-btn { display:inline-flex; align-items:center; gap:8px; padding:0px 10px; border-radius:10px; font-weight:600; font-size:13px; cursor:pointer; border:0; background:transparent; color:var(--accent); }
        .share-icon { width:18px; height:18px; display:inline-block; }

        @media(max-width:900px){
          .results{ grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        }

        @media(max-width:640px){
          .site-shell{ padding:18px 12px }
          .hero{ margin-bottom:18px }
          .search-wrap{ max-width:100%; margin-top:12px; padding:10px }
          .results{ gap:12px; grid-template-columns: 1fr; }
          .card-body{ padding:14px 10px 10px 10px }
        }
      `}</style>
      <div className="site-shell">
        <section className="hero" aria-label="Campaign banner">
          <div
            className="carousel"
            onMouseEnter={() => (isPausedRef.current = true)}
            onMouseLeave={() => (isPausedRef.current = false)}
          >
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {carouselImages.map((src, idx) => (
                <div className="carousel-slide" key={idx}>
                  <img
                    src={src}
                    alt={`Banner ${idx + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = bannerUrl;
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
            </div>

            <div className="carousel-overlay" aria-hidden />

            <div
              className="carousel-dots"
              role="tablist"
              aria-label="Slide dots"
            >
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  className="dot"
                  aria-current={i === slide}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className="search-wrap"
            role="search"
            style={{
              boxShadow: "0 12px 36px rgba(2,6,23,0.04)",
              background: "transparent",
            }}
          >
            <div className="search-box" style={{ minWidth: 0 }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                focusable="false"
              >
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="#94a3b8"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="#94a3b8"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></circle>
              </svg>

              <input
                id="voter-search-input"
                placeholder="उदा: महाजन बापु OR Bapu Tukaram OR voter id XWU2254902"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search voters by name or voter ID"
                inputMode="text"
                autoComplete="off"
                style={{
                  color: "#0f172a",
                  fontSize: 15,
                  lineHeight: "20px",
                }}
              />

              {query && (
                <button
                  aria-label="Clear query"
                  title="Clear"
                  onClick={() => setQuery("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 18,
                    padding: 8,
                  }}
                >
                  ✖
                </button>
              )}
            </div>

            <div className="controls" aria-hidden>
              {query ? (
                <button
                  className="btn-clear"
                  onClick={clearSearch}
                  title="Clear search"
                >
                  Clear
                </button>
              ) : (
                <button
                  className="btn secondary"
                  onClick={clearSearch}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "white",
                    border: "1px solid rgba(2,6,23,0.06)",
                    boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
                    cursor: "pointer",
                    opacity: 0.0,
                    pointerEvents: "none",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <main>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <div style={{ color: "#475569", fontSize: 14 }}>
              {query && query.trim().length >= 3 ? (
                <>
                  <strong>{results.length}</strong>{" "}
                  {results.length === 1 ? " record found" : " records found"}
                </>
              ) : (
                <span style={{ color: "var(--muted)" }}>
                  Type at least 3 characters to search
                </span>
              )}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}></div>
          </div>

          <div className="results" aria-live="polite">
            {query && query.trim().length > 0 && query.trim().length < 3 && (
              <div
                style={{ gridColumn: "1/-1", padding: 12, color: "#64748b" }}
              >
                Please type at least 3 characters to start searching.
              </div>
            )}

            {query && query.trim().length >= 3 && results.length === 0 && (
              <div
                style={{ gridColumn: "1/-1", padding: 12, color: "#64748b" }}
              >
                No records matched your search.
              </div>
            )}

            {results.map((voter) => {
              const nameEn = voter.name_english || "—";
              const nameMr = voter.name_marathi || "—";
              const photo = voter.photo || resultPhoto;
              const ward =
                voter.ward ||
                voter.ward_no ||
                voter.wardNumber ||
                voter.part_no ||
                7;

              const cardBanner =
                voter.card_banner || voter.header_image || bannerUrl2;

              const cardId = `card-${
                voter.voter_id || `${voter.box_number}-${voter.part_no}`
              }`;

              return (
                <article
                  key={voter.voter_id || `${voter.box_number}-${voter.part_no}`}
                  className="card"
                  id={cardId}
                  aria-label={`Voter ${nameEn || nameMr}`}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    padding: 0,
                    background: "#fff",
                    backgroundImage:
                      "linear-gradient(180deg, rgba(11,87,208,0.02), rgba(255,255,255,0))",
                    position: "relative",
                  }}
                >
                  {snapshotLoadingFor === cardId && (
                    <div className="snapshot-overlay" aria-hidden>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14 }}>{snapshotMessage}</div>
                      </div>
                    </div>
                  )}

                  <div className="card-header" aria-hidden>
                    <img
                      className="banner"
                      src={cardBanner}
                      alt={`Banner for ${nameEn}`}
                      loading="lazy"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = bannerUrl;
                      }}
                    />
                  </div>

                  <div className="card-body">
                    <div
                      style={{
                        marginBottom: 6,
                        textAlign: "center",
                        position: "relative",
                      }}
                    >
                      <div className="header-text" style={{ color: "#0f172a" }}>
                        <span style={{ fontSize: 15, color: "#334155" }}>
                          Ward 7 ( {ward} )
                        </span>
                        <div
                          className="name-en"
                          title={nameEn}
                          style={{ fontSize: 16, fontWeight: 700 }}
                        >
                          {nameEn}
                        </div>
                        <div
                          className="name-mr"
                          title={nameMr}
                          style={{ fontSize: 15, color: "#334155" }}
                        >
                          {nameMr}
                        </div>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          right: 8,
                          top: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {/* SINGLE BUTTON: prepares & shares image only for now */}
                        <button
                          onClick={() => shareCardWithInfo(voter)}
                          title="Share full card (image only)"
                          style={{
                            marginLeft: 6,
                            padding: "0px 10px",
                            borderRadius: 10,
                            border: "1px solid rgba(11,87,208,0.12)",
                            background: "#fff",
                            cursor: "pointer",
                            fontWeight: 700,
                            color: "#0b57d0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                          aria-label="Share full card (image only)"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12c0 1.94.56 3.74 1.53 5.25L2 22l4.9-1.49A9.9 9.9 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
                              fill="#25D366"
                            />
                            <path
                              d="M17.6 14.2c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.36.22-.66.08-.3-.15-1.27-.47-2.42-1.48-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.14-.14.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2 0-.38-.02-.53-.02-.15-.68-1.64-.93-2.25-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.3-.28.23-1.08 1.05-1.08 2.56 0 1.5 1.1 2.95 1.25 3.16.15.2 2.16 3.3 5.23 4.63 3.07 1.33 3.07.89 3.62.83.55-.06 1.78-.72 2.03-1.41.25-.69.25-1.27.18-1.4-.07-.13-.25-.2-.55-.35z"
                              fill="#fff"
                            />
                          </svg>
                          Share
                        </button>
                      </div>
                    </div>

                    <div
                      className="details"
                      style={{ fontSize: 13, color: "#334155" }}
                    >
                      <div
                        className="meta"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>
                            <strong>Relative:</strong>{" "}
                            {voter.relative_name_english || "—"} /{" "}
                            {voter.relative_name_marathi || "—"}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13 }}>
                            <strong>Voter ID:</strong> {voter.voter_id || "—"}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13 }}>
                            <strong>Part No:</strong> {voter.part_no || "—"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right", minWidth: 86 }}>
                          <div
                            style={{
                              background: "var(--soft)",
                              color: "#1e3a8a",
                              padding: "6px 10px",
                              borderRadius: 10,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                            className="pill"
                          >
                            अनु क्र.{voter.box_number ?? "—"}
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              color: "#64748b",
                              fontSize: 13,
                            }}
                          >
                            {voter.age ?? "—"} yrs • {voter.gender || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="address" style={{ marginTop: 8 }}>
                        <strong>Address:</strong> {voter.address || "N/A"}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        <footer style={footerWrap}>
          {/* Keyframes must be in a style block; everything else uses inline styles */}
          <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes tinyPulse {
          0% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 0.95; }
        }
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }

        /* Optional little shimmer on hover for the marquee */
        .marqueeHover:hover { box-shadow: 0 10px 30px rgba(2,6,23,0.08); transform: translateY(-3px); transition: transform 300ms ease, box-shadow 300ms ease; }

        /* Make marquee pause on hover (nice for long screens) */
        .marqueeText:hover { animationPlayState: paused; cursor: default; }
      `}</style>

          <div style={topRight}>
            Total Records: <strong>{votersData.length}</strong>
          </div>

          <div
            style={marqueeContainer}
            className="marqueeHover"
            aria-hidden={false}
            aria-live="polite"
          >
            {/* Marathi phrase - change this text if you want different spelling */}
            <div style={marqueeText} className="marqueeText">
              एकच वादा करण दादा
              <span style={heart} aria-hidden="true">
                ❤️
              </span>
              <br />
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 6,
                  fontWeight: 600,
                }}
              >
                राजा वही बनेगा जो हकदार होगा
              </span>
            </div>
          </div>
          <div
            id="post-footer-banner"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 12,
              padding: "0 20px",
            }}
          >
            <img
              src={bannerUrl23}
              alt="Footer banner"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.src = bannerUrl;
              }}
              style={{
                width: "100%",
                maxWidth: 1100,
                height: "auto",
                borderRadius: 12,
                boxShadow: "0 12px 36px rgba(2,6,23,0.06)",
                display: "block",
              }}
            />
          </div>
          <div style={copyright}>
            <span style={{ fontSize: 13, color: "#475569" }}>
              © {new Date().getFullYear()} Voter Search — built with{" "}
              <strong style={{ color: "#e11d48", fontWeight: 600 }}>
                Lalit Mali
              </strong>{" "}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 300,
                  color: "#16a34a",
                  marginLeft: 6,
                  letterSpacing: "0.5px",
                }}
              >
                7775025688
              </span>
            </span>

            <span style={tinyHeart} aria-hidden="true">
              ❤️
            </span>
          </div>
          <div
            id="post-footer-banner"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 12,
              padding: "0 20px",
            }}
          >
            <img
              src={bannerUrl1}
              alt="Footer banner"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.src = bannerUrl;
              }}
              style={{
                width: "100%",
                maxWidth: 1100,
                height: "auto",
                borderRadius: 12,
                boxShadow: "0 12px 36px rgba(2,6,23,0.06)",
                display: "block",
              }}
            />
          </div>
        </footer>

        {/* POST-FOOTER BANNER (visible after the footer) */}
      </div>
    </div>
  );
}
