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
        "Your email address, plus your name and profile picture if you sign in with Google or GitHub.",
        "Your password, kept only as a bcrypt hash. AuthKit never stores it as plain text.",
        "Your role, and whether your account is active or locked.",
        "If you turn on two-factor authentication, the secret your authenticator app uses.",
        "For each session: your IP address, browser and device, and when the session started and was last used.",
        "A security log of account events, such as sign-ins, failed sign-ins and password changes, with the IP address and browser used.",
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
        "The database runs on Neon. Short-lived security data, such as failed sign-in counts and signed-out tokens, sits on Upstash.",
        "The server runs on Render and the website on Vercel.",
        "If you sign in with Google or GitHub, they send AuthKit your email, name and profile picture. Their own privacy policies cover what they do with your data.",
        "Your browser keeps your login session in local storage until you sign out.",
      ]} />
    </Section>

    <Section title="Who can see it">
      <p>
        Aisha, as the developer, can see account details in the database. Admin accounts, which only
        the developer gives out, can see the list of users and their email addresses.
      </p>
    </Section>

    <Section title="How long it's kept">
      <p>
        Your account stays until you ask for it to be deleted or the demo is reset. Because this is a
        demo, the database may be cleared at any time.
      </p>
    </Section>

    <Section title="Your choices">
      <List items={[
        "You can sign out of any of your sessions from the Sessions page.",
        "To delete your account and its data, or to ask what's stored about you, contact Aisha through her GitHub profile.",
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
