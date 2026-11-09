import { Link } from "react-router-dom";
import LegalPage, { Section, List, GitHubLink, linkStyle } from "./LegalPage";

const Terms = () => (
  <LegalPage title="Terms of Service" updated="9 November 2026">
    <Section title="What AuthKit is">
      <p>
        AuthKit is a demo of a login system, built by Aisha Aliyu as a portfolio project. By creating
        an account or signing in, you agree to these terms.
      </p>
    </Section>

    <Section title="Using the demo">
      <List items={[
        "Use it to try the features. Don't store anything important or private in it.",
        "Don't attack or overload the demo, don't try to get into other people's accounts, and don't create accounts in bulk.",
        "If you find a security problem, please report it through GitHub instead of exploiting it.",
      ]} />
    </Section>

    <Section title="No guarantees">
      <List items={[
        "The demo comes as it is, with no promise that it will always be online or free of bugs.",
        "Accounts and data may be reset or deleted at any time, for example when the demo is updated.",
        "Aisha isn't responsible for any loss that comes from using the demo.",
      ]} />
    </Section>

    <Section title="Privacy">
      <p>
        The <Link to="/privacy" style={linkStyle}>Privacy Policy</Link> explains what AuthKit stores
        and why.
      </p>
    </Section>

    <Section title="Contact">
      <p>
        Questions? Reach Aisha through <GitHubLink />.
      </p>
    </Section>
  </LegalPage>
);

export default Terms;
