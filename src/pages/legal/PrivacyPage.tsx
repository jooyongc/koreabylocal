import PageSEO from "@/components/common/PageSEO";

const UPDATED = "20 September 2026";
const CONTACT = "koreabylocal@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-medium text-gray-800" : "text-gray-600"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PageSEO
        title="Privacy Policy | Korea By Local"
        description="What Korea by Local collects, why, who we share it with, and how to get it deleted."
        path="/privacy"
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated {UPDATED}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-gray-700">
          Korea by Local (&ldquo;we&rdquo;) runs koreabylocal.com. This page explains what we collect
          when you read the guidebook, subscribe, ask a question or buy something,
          why we hold it, and who else sees it. We collect as little as the service needs,
          and we do not sell your data to anyone.
        </p>

        <Section title="What we collect">
          <Table
            head={["When you…", "We store", "Why"]}
            rows={[
              ["Read the site", "A one-way hash of your IP address, and the page viewed", "To count views without keeping an identifiable record of who you are"],
              ["Subscribe to the newsletter", "Email address, name if given, language, and where you signed up", "To send the newsletter and any download you asked for"],
              ["Ask a Local", "Name, email, category, your question, and any file you attach", "To answer you, and to keep a record of the answer"],
              ["Buy an e-book or product", "Name, email, order details and a payment reference", "To deliver the purchase, handle refunds, and meet tax and accounting obligations"],
              ["Create an account", "Email, name, and optionally a phone number and avatar", "To sign you in and show your orders"],
            ]}
          />
          <p>
            We never receive or store your full card number or bank details. Payments are handled
            entirely by the payment provider named below.
          </p>
        </Section>

        <Section title="Who we share it with">
          <p>
            We use a small number of service providers to run the site. They only receive what they
            need for their part, and may only use it to provide their service to us.
          </p>
          <Table
            head={["Provider", "Receives", "Purpose"]}
            rows={[
              ["Supabase", "Everything above", "Database, file storage and sign-in"],
              ["Cloudflare", "Your IP address and request details", "Website hosting and protection against abuse"],
              ["Google (Gmail API)", "Your email address and the message we send you", "Sending email from our own account"],
              ["PayPal", "Name, email and the amount", "Taking payment"],
              ["TypeSafe", "The text of your Ask a Local question only", "Sorting incoming questions (see below)"],
            ]}
          />
        </Section>

        <Section title="Automated sorting of Ask a Local questions">
          <p>
            When you send a paid question, the text of that question is sent to TypeSafe, an
            automated text-classification service, so we can see what it is about, whether you are
            travelling imminently, and whether we have already published a guide that answers it.
            This helps us reply faster and avoid sending you something you could have read already.
          </p>
          <p>
            <strong>Your name and email address are not sent.</strong> Only the question text is,
            and the result is only a suggestion shown to our team — it never generates an automatic
            reply, and a person reads and answers every question. TypeSafe does not use what we send
            to train its models. If you would rather your question were not processed this way,
            say so in your message or email us and we will handle it manually.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Newsletter details are kept until you unsubscribe. Questions and their answers are kept
            for two years so we can refer back to them. Order records are kept for five years,
            because tax rules require it. Account details are kept until you ask us to close the
            account. View hashes are kept for one year.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to
            delete it. Every newsletter has a one-click unsubscribe link. To make any other request,
            email <a className="text-primary underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> and
            we will respond within 30 days.
          </p>
          <p>
            If you are in the EU or UK you may also complain to your local data protection
            authority. If you are in Korea you may raise a complaint with the Personal Information
            Protection Commission.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use cookies that are needed to keep you signed in and to remember your preferences.
            We do not use advertising cookies.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The site is not intended for children under 14, and we do not knowingly collect their
            information. If you believe a child has sent us their details, email us and we will
            delete them.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we change how we handle your information we will update this page and the date at
            the top. Material changes will be announced in the newsletter.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy: <a className="text-primary underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </Section>
      </div>
    </>
  );
}
