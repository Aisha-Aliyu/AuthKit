import { Link } from "react-router-dom";
import LegalPage, { Section, List, GitHubLink, linkStyle } from "./LegalPage";

const Privacy = () => (
  <LegalPage title="Privacy Policy" updated="9 November 2026">
    <Section title="About this demo">
      <p>
        AuthKit is a portfolio project by Aisha Aliyu that shows how a secure login system works.
        You're welcome to try it, but please don't reuse a password you use anywhere else.
      </p>
    </Section>

    <Section title="What AuthKit stores">
      <List items={[
        "Your email address and display name, an optional profile picture link, and your Google or GitHub account ID if you sign in with one of them.",
        "Your password, kept only as a bcrypt hash. AuthKit never stores it as plain text.",
        "Your role, and whether your account is active or locked.",
        "If you start setting up two-factor authentication, the secret your authenticator app uses.",
        "For each session: your IP address, browser and device, and when the session started and was last used.",
        "A security log of account events, such as sign-ins, failed sign-ins and password changes, with the IP address and browser used. Failed sign-in attempts are logged with the email that was typed, even when no account exists for it.",
      ]} />
    </Section>

    <Section title="Why it stores it">
      <p>
        To sign you in, keep your account safe, show you your own sessions and security log, and,
        when email is set up, send verification and password reset emails. AuthKit doesn't sell
        your data, show ads, or share your data with anyone for marketing.
      </p>
    </Section>

    <Section title="Where it's kept">
      <List items={[
        "The database runs on Neon. Short-lived security data, such as signed-out tokens and pending two-factor sign-ins, sits on Upstash.",
        "The server runs on Render and the website on Vercel.",
        "If you sign in with Google or GitHub, they send AuthKit your email, name, profile picture and account ID. Their own privacy policies cover what they do with your data.",
        "The site loads its fonts from Google Fonts, so Google sees your IP address when a page loads.",
        "When email is switched on, your email address goes through the email service that sends AuthKit's messages.",
        "Your browser keeps your login session in local storage until you sign out.",
      ]} />
    </Section>

    <Section title="Who can see it">
      <p>
        Aisha, as the developer, can see account details in the database. Admin and moderator
        accounts, which only Aisha gives out, can see every user's email, name, role and account
        status, the IP address and device of active sessions, and every user's security log.
      </p>
    </Section>

    <Section title="How long it's kept">
      <p>
        Your account and its security log stay until you ask for them to be deleted or the demo is
        reset. Because this is a demo, the database may be cleared at any time.
      </p>
    </Section>

    <Section title="Your choices">
      <List items={[
        "You can sign out of any of your sessions from the Sessions page.",
        "To delete your account and its security log, or to ask what's stored about you, email Aisha at the address on her GitHub profile.",
      ]} />
      <p style={{ marginTop: "10px" }}>
        <GitHubLink />
      </p>
    </Section>

    <Section title="Changes">
      <p>
        If this policy changes, the date at the top changes too. See also the{" "}
        <Link to="/terms" style={linkStyle}>Terms of Service</Link>.
      </p>
    </Section>
  </LegalPage>
);

export default Privacy;
