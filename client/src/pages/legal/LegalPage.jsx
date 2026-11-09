import { useEffect } from "react";
import { Link } from "react-router-dom";

export const linkStyle = { color: "var(--color-blush)", fontWeight: 600, textDecoration: "underline" };

const LegalPage = ({ title, updated, children }) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | AuthKit`;
    return () => { document.title = previousTitle; };
  }, [title]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "48px 16px" }}>
      <article style={{
        maxWidth: "720px", margin: "0 auto",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
        padding: "36px 28px",
        color: "var(--color-text-sec)",
        fontSize: "15px", lineHeight: 1.7,
      }}>
        <Link to="/login" style={{ ...linkStyle, fontSize: "13px" }}>
          Back to AuthKit
        </Link>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px",
          color: "var(--color-blush)", letterSpacing: "0.02em", margin: "24px 0 6px",
        }}>
          {title}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-sec)", marginBottom: "28px" }}>
          Last updated: {updated}
        </p>
        {children}
      </article>
    </div>
  );
};

export const Section = ({ title, children }) => (
  <section style={{ marginBottom: "24px" }}>
    <h2 style={{
      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px",
      color: "var(--color-blush)", marginBottom: "8px",
    }}>
      {title}
    </h2>
    {children}
  </section>
);

export const List = ({ items }) => (
  <ul style={{
    listStyle: "disc", paddingLeft: "20px",
    display: "flex", flexDirection: "column", gap: "6px",
  }}>
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

export const GitHubLink = () => (
  <a href="https://github.com/Aisha-Aliyu" target="_blank" rel="noopener noreferrer" style={linkStyle}>
    github.com/Aisha-Aliyu
  </a>
);

export default LegalPage;
