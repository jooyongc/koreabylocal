import { Link } from "react-router-dom";
import PageSEO from "@/components/common/PageSEO";

const UPDATED = "3 October 2026";
const CONTACT = "koreabylocal@gmail.com";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

const Mail = () => (
  <a className="text-primary underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
);

export default function TermsPage() {
  return (
    <>
      <PageSEO
        title="Terms of Service | Korea By Local"
        description="The terms for using Korea by Local: our travel content, paying by PayPal, the e-book, Ask a Local, and refunds."
        path="/terms"
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated {UPDATED}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-gray-700">
          Korea by Local (&ldquo;we&rdquo;) runs koreabylocal.com. These terms cover reading the
          site, buying our e-book, and paying for an Ask a Local question. By using the site or
          buying from us you agree to them. How we handle your personal information is explained
          separately in our <Link className="text-primary underline" to="/privacy">Privacy Policy</Link>.
        </p>

        <Section title="Our travel content">
          <p>
            Our guides are written by locals and checked when they are published, but prices,
            opening hours, transport routes and entry rules in Korea change often. Treat what you read
            as a starting point and confirm anything important — especially visas, entry requirements
            and bookings — with the official source before you rely on it.
          </p>
          <p>
            Places, tours and businesses we mention are run by others. We are not responsible for
            their services, and a recommendation is not a guarantee.
          </p>
        </Section>

        <Section title="Affiliate links">
          <p>
            Some links to booking sites are affiliate links: if you book through one, we may earn a
            commission. It does not change the price you pay, and it never decides what we recommend.
            Your booking is then with that site, under its own terms.
          </p>
        </Section>

        <Section id="payments" title="Payments">
          <p>
            Everything you can buy from us is priced in US dollars and paid through PayPal&rsquo;s
            secure checkout. PayPal handles the payment; we never see or store your card or bank
            details, and PayPal&rsquo;s own terms apply to the payment itself. The price shown on the
            page when you check out is the price you pay.
          </p>
        </Section>

        <Section id="ebook" title="The e-book">
          <p>
            When your payment goes through you get a download link straight away, and we email it
            to the address on your PayPal account. Each link works three times; if you need another,
            email us and we will send a fresh one. Major updates to the guide are free — ask and we
            will send the new edition.
          </p>
          <p>
            The e-book is for your own personal use. Please do not share, resell or republish it,
            in whole or in part.
          </p>
        </Section>

        <Section id="ask-a-local" title="Ask a Local">
          <p>
            Each question costs US$1, paid before it is sent. A person on our team reads it and
            answers by email, usually within a few hours, though we cannot promise a time. Our answer
            is honest, practical travel advice — it is not legal, medical, immigration or financial
            advice.
          </p>
          <p>
            Ask a Local is not an emergency service. In an emergency in Korea call 112 (police) or
            119 (fire and ambulance), or the 1330 Korea Travel Hotline for help in English.
          </p>
        </Section>

        <Section id="refunds" title="Refunds">
          <p>
            <strong>E-book:</strong> if it is not for you, email us within 7 days of buying it and we
            will refund you in full. No reason needed.
          </p>
          <p>
            <strong>Ask a Local:</strong> if we cannot answer your question, we refund the $1 in full.
            If you were charged twice or by mistake, tell us and we will refund the extra charge.
          </p>
          <p>
            To ask for a refund, email <Mail /> from the address you paid with, or include your
            PayPal receipt. Refunds go back through PayPal to the way you paid, usually within a few
            days of our reply. Nothing here takes away any refund right you have under the consumer
            law of the country you live in.
          </p>
        </Section>

        <Section title="Newsletter and free downloads">
          <p>
            If you sign up for the newsletter or a free download, we will email you travel tips and
            news from the site. Every email has a one-click unsubscribe link.
          </p>
        </Section>

        <Section title="Using the site">
          <p>
            You can read, link to and quote short parts of our guides with credit to Korea by Local.
            Please do not copy whole articles or photos, or scrape the site. If you create an
            account, keep your sign-in details to yourself — you are responsible for what is done
            with your account.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            We provide the site and its content as they are, and we do our best to keep them
            accurate. To the extent the law allows, we are not liable for losses that come from
            relying on travel information that has since changed, or from the services of
            businesses we link to, and our total liability to you is limited to what you have paid
            us. Nothing in these terms limits a liability that cannot be limited by law.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are governed by the laws of the Republic of Korea. If you buy from us as a
            consumer, you also keep the protection of the mandatory laws of the country you live in.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms and will change the date at the top when we do. A purchase is
            always covered by the terms in place when you made it.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms, or a refund: <Mail />.
          </p>
        </Section>
      </div>
    </>
  );
}
