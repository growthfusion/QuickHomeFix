import React from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";

const SITE_URL = "https://quickhomefix.pro/";
const COMPANY_LEGAL = "Sharp Ads Inc";
const COMPANY_DBA = "Growth Fusion";
const BRAND = "QuickHomeFix";
const PHONE = "+1 (315) 270-9543";
const EMAIL = "support@quickhomefix.pro";
const LAST_UPDATED = "April 4, 2026";
const EFFECTIVE_DATE = "April 4, 2026";

const linkClass =
  "text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-blue-600/30 hover:decoration-blue-700";

const toc = [
  { id: "who", label: "Who are we?" },
  { id: "categories", label: "What categories of data does QuickHomeFix collect?" },
  { id: "consent", label: "We need your consent to this Privacy Policy" },
  { id: "rights", label: "What rights do you have with regard to your Personal Data?" },
  { id: "california", label: "Special Notice for California Residents" },
  { id: "states", label: "Information for other state residents" },
  { id: "receive", label: "How does QuickHomeFix receive your Personal Data?" },
  { id: "use", label: "How does QuickHomeFix use your Personal Data?" },
  { id: "share", label: "How do we share your Personal Data?" },
  { id: "security", label: "How do we secure your Personal Data?" },
  { id: "international", label: "International transfers" },
  { id: "contact", label: "How to contact us" },
];

function Subheading({ children }) {
  return (
    <h3 className="font-sans text-base font-semibold text-gray-900 mt-8 mb-3">
      {children}
    </h3>
  );
}

function Section({ id, title, children, top = "mt-14" }) {
  return (
    <section id={id} className={`scroll-mt-28 ${top}`}>
      <h2 className="font-sans text-xl sm:text-[1.35rem] font-semibold text-gray-900 tracking-tight mb-4">
        {title}
      </h2>
      <div className="font-sans space-y-4 text-[17px] leading-[1.65] text-gray-600">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[52px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
            <img
              src={logo}
              alt={BRAND}
              className="h-9 w-auto object-contain shrink-0"
            />
            <span className="font-sans text-[15px] font-semibold text-gray-900 truncate group-hover:text-gray-700">
              {BRAND}
            </span>
          </Link>
          <Link
            to="/"
            className="font-sans text-sm text-blue-600 hover:text-blue-700 font-medium shrink-0"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-[680px] mx-auto px-5 sm:px-6 pt-8 sm:pt-12 pb-20 sm:pb-28">
        <nav
          className="font-sans text-[13px] text-gray-500 mb-8 flex flex-wrap items-center gap-x-1.5 gap-y-1"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-gray-800 transition-colors">
            Home
          </Link>
          <span className="text-gray-300" aria-hidden>
            /
          </span>
          <span className="text-gray-800">Legal</span>
          <span className="text-gray-300" aria-hidden>
            /
          </span>
          <span className="text-gray-600">Privacy Notice</span>
        </nav>

        <article lang="en">
          <h1 className="font-sans text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-gray-900 leading-tight mb-2">
            Privacy Notice
          </h1>
          <p className="font-sans text-sm text-gray-500 mb-2">
            Last updated{" "}
            <time dateTime="2026-04-04" className="text-gray-700">
              {LAST_UPDATED}
            </time>
          </p>
          <p className="font-sans text-sm text-gray-500 mb-10">
            Effective date:{" "}
            <span className="text-gray-700">{EFFECTIVE_DATE}</span>
          </p>

          <p className="font-sans text-[17px] leading-[1.65] text-gray-600 mb-10">
            This Privacy Notice describes how {COMPANY_LEGAL} (doing business as{" "}
            <span className="font-medium text-gray-800">{COMPANY_DBA}</span>),
            operating{" "}
            <span className="font-medium text-gray-800">{BRAND}</span>, collects,
            uses, shares, and protects your personal information when you visit{" "}
            <a
              href={SITE_URL}
              className={`${linkClass} break-all`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {SITE_URL}
            </a>{" "}
            or use our services. Personal data means any information, including
            cookies, that may be used to identify, describe, or be reasonably
            linked to an individual. If you do not agree with our policies and
            practices, please do not use our services.
          </p>

          <div className="mb-12 rounded-2xl bg-gray-50 border border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
            <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Table of contents
            </p>
            <ol className="font-sans grid sm:grid-cols-2 gap-x-8 gap-y-2 text-[15px] list-decimal list-outside ml-5 sm:ml-6 marker:text-gray-500">
              {toc.map((item) => (
                <li key={item.id} className="pl-1">
                  <a href={`#${item.id}`} className={linkClass}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* 1. Who are we? */}
          <Section id="who" title="1. Who are we?" top="mt-0">
            <p>
              {BRAND} is operated by {COMPANY_LEGAL}, doing business as{" "}
              {COMPANY_DBA}. {BRAND} is a platform that connects homeowners with
              home improvement service professionals. We are not a contractor or
              service provider ourselves. We act as a matching service to help
              you find professionals for your home improvement needs.
            </p>
            <p>
              This Privacy Notice applies to all information collected through
              our website at{" "}
              <a
                href={SITE_URL}
                className={`${linkClass} break-all`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {SITE_URL}
              </a>{" "}
              and any related services, communications, or interactions.
            </p>
            <p>
              Our services are intended for users who are at least 18 years of
              age. We do not knowingly collect personal information from anyone
              under 18.
            </p>
          </Section>

          {/* 2. What categories of data? */}
          <Section
            id="categories"
            title="2. What categories of data does QuickHomeFix collect?"
          >
            <p>
              We collect several categories of personal information to provide
              and improve our services:
            </p>
            <Subheading>Identity data</Subheading>
            <p>Your first name and last name.</p>
            <Subheading>Location details</Subheading>
            <p>
              Your physical address, city, state, and zip code associated with
              your home improvement project.
            </p>
            <Subheading>Contact details</Subheading>
            <p>Your email address and phone number.</p>
            <Subheading>Project information</Subheading>
            <p>
              Details about the home improvement services you are interested in,
              such as service type, material preferences, project scope, and
              property details you share through our forms.
            </p>
            <Subheading>Technical information</Subheading>
            <p>
              Information collected automatically, including your IP address,
              browser type and version, operating system, device identifiers,
              pages viewed, referring URL, date and time of access, and general
              location derived from IP address.
            </p>
          </Section>

          {/* 3. Consent */}
          <Section
            id="consent"
            title="3. We need your consent to this Privacy Policy"
          >
            <p>
              By using our website and services, you consent to the collection
              and use of your personal data as described in this Privacy Notice.
              If you do not agree, please discontinue use of our services.
            </p>
            <p>
              When you submit your information through our forms, you expressly
              consent to being contacted by {BRAND} and up to four home
              improvement companies via phone calls, text messages, and emails
              regarding your project. You understand that some may use
              auto-dialers, SMS messages, and artificial or prerecorded voice
              messages to contact you. There is no requirement to purchase
              services.
            </p>
            <p>
              We may update this Privacy Notice from time to time. When we make
              changes, we will update the "Last updated" date at the top. We
              encourage you to review this notice periodically. Your continued
              use of the services after changes constitutes your acceptance of
              the updated Privacy Notice.
            </p>
          </Section>

          {/* 4. Rights */}
          <Section
            id="rights"
            title="4. What rights do you have with regard to your Personal Data?"
          >
            <p>
              Depending on your location, you may have certain rights regarding
              your personal data under applicable privacy laws, including:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-3 pl-1 marker:text-gray-400">
              <li>
                <span className="font-semibold text-gray-900">
                  Right of access:
                </span>{" "}
                You have the right to request information about what personal
                data we hold about you.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Right to rectification:
                </span>{" "}
                You have the right to request correction of inaccurate personal
                data.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Right to deletion:
                </span>{" "}
                You have the right to request deletion of your personal data,
                subject to certain exceptions.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Right to restrict processing:
                </span>{" "}
                You may request that we limit our use of your personal data
                under certain circumstances.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Right to data portability:
                </span>{" "}
                You may request a copy of your personal data in a structured,
                commonly used format.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Right to object:
                </span>{" "}
                You may object to processing of your personal data for direct
                marketing purposes.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>
              . We will verify your identity before processing your request and
              respond within the timeframe required by applicable law.
            </p>
          </Section>

          {/* 5. California */}
          <Section
            id="california"
            title="5. Special Notice for California Residents"
          >
            <p>
              If you are a California resident, you may have additional rights
              under the California Consumer Privacy Act (CCPA) and the
              California Privacy Rights Act (CPRA), including:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-3 pl-1 marker:text-gray-400">
              <li>
                The right to know what personal information we collect, use, and
                disclose about you.
              </li>
              <li>
                The right to request deletion of your personal information,
                subject to certain exceptions.
              </li>
              <li>
                The right to correct inaccurate personal information we hold
                about you.
              </li>
              <li>
                The right to opt out of the "sale" or "sharing" of your personal
                information for cross-context behavioral advertising, where those
                terms apply under California law.
              </li>
              <li>
                The right to limit use and disclosure of sensitive personal
                information.
              </li>
              <li>
                The right not to receive discriminatory treatment for exercising
                your privacy rights.
              </li>
            </ul>
            <p>
              {BRAND} does not sell your personal information to our partners or
              other third parties. We may share your information with service
              partners when you request to be connected for quotes, as described
              at the point of collection and in the consent language you accept.
            </p>
            <p>
              To submit a request, email{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>
              . We may ask for information to verify your identity before
              fulfilling your request. You may designate an authorized agent to
              make a request on your behalf.
            </p>
          </Section>

          {/* 6. Other states */}
          <Section
            id="states"
            title="6. Information for other state residents"
          >
            <p>
              Residents of certain other U.S. states may have additional privacy
              rights under applicable state laws:
            </p>
            <Subheading>New York</Subheading>
            <p>
              New York residents may have certain rights regarding their personal
              data. You may request access to, correction of, or deletion of
              your personal data by contacting us.
            </p>
            <Subheading>Colorado</Subheading>
            <p>
              Colorado residents may have the right to access, correct, delete,
              and obtain a portable copy of their personal data, and to opt out
              of targeted advertising, sales of personal data, and profiling.
            </p>
            <Subheading>Nevada</Subheading>
            <p>
              Nevada residents may opt out of the sale of certain covered
              information by contacting us at{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>
              .
            </p>
            <Subheading>Virginia</Subheading>
            <p>
              Virginia residents have the right to access, correct, and delete
              their personal data, obtain a copy in a portable format, and opt
              out of targeted advertising, sales of personal data, and
              profiling.
            </p>
          </Section>

          {/* 7. How we receive data */}
          <Section
            id="receive"
            title="7. How does QuickHomeFix receive your Personal Data?"
          >
            <Subheading>Information you provide directly</Subheading>
            <p>
              We collect information you voluntarily provide when you fill out
              forms on our website, request quotes, or communicate with us. This
              includes your name, address, phone number, email address, and
              details about your home improvement project.
            </p>
            <Subheading>Information collected automatically</Subheading>
            <p>
              When you visit our website, we may automatically collect technical
              data, including your IP address, browser type and version,
              operating system, device identifiers, pages visited, referring
              URLs, date and time of access, and user interactions with our site
              and forms.
            </p>
            <p>
              We may use cookies, pixels, and similar tracking technologies to
              collect this information. Cookies are small data files stored on
              your device that help us operate and improve our website. You can
              control cookies through your browser settings, but blocking
              cookies may affect certain features.
            </p>
          </Section>

          {/* 8. How we use data */}
          <Section
            id="use"
            title="8. How does QuickHomeFix use your Personal Data?"
          >
            <p>We use your personal data for the following purposes:</p>
            <ul className="list-disc list-outside ml-6 space-y-3 pl-1 marker:text-gray-400">
              <li>
                <span className="font-semibold text-gray-900">
                  Service matching:
                </span>{" "}
                To connect you with home improvement professionals and
                contractors based on your project needs and location.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Lead delivery:
                </span>{" "}
                To deliver your information to partners you have agreed to hear
                from when requesting quotes.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Communications:
                </span>{" "}
                To respond to your inquiries, send administrative information,
                and contact you about your home improvement project via phone,
                email, or text.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Analytics and improvement:
                </span>{" "}
                To analyze usage patterns and improve our website and user
                experience.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Security and fraud prevention:
                </span>{" "}
                To protect the security and integrity of our services and detect
                and prevent fraud.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Legal compliance:
                </span>{" "}
                To comply with legal obligations and enforce our terms.
              </li>
            </ul>
            <p>
              We may also use de-identified or aggregated data for analytics
              purposes. Such data cannot be used to identify you individually.
            </p>
          </Section>

          {/* 9. How we share data */}
          <Section
            id="share"
            title="9. How do we share your Personal Data?"
          >
            <p>
              {BRAND} does not sell your personal information to our partners or
              other third parties. We may share your information in the
              following situations:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-3 pl-1 marker:text-gray-400">
              <li>
                <span className="font-semibold text-gray-900">
                  Service partners:
                </span>{" "}
                With contractors, installers, or home improvement companies when
                you request to be connected for quotes, as described at the
                point of collection and in the consent language you accept.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Service providers:
                </span>{" "}
                With hosting, analytics, advertising, communications, and
                security vendors who assist our operations under confidentiality
                and use restrictions.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Legal requirements:
                </span>{" "}
                When we believe disclosure is necessary to comply with law,
                regulation, legal process, or governmental request.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Business transfers:
                </span>{" "}
                In connection with a merger, acquisition, or sale of assets,
                subject to appropriate safeguards.
              </li>
            </ul>
            <p>
              We may share de-identified or aggregated analytics data with third
              parties. Such data cannot be linked back to individual users.
            </p>
          </Section>

          {/* 10. Security */}
          <Section
            id="security"
            title="10. How do we secure your Personal Data?"
          >
            <p>
              We implement reasonable physical, electronic, and procedural
              safeguards to protect your personal data from unauthorized access,
              use, alteration, and disclosure. However, no method of
              transmission over the internet or electronic storage is completely
              secure, and we cannot guarantee absolute security.
            </p>
            <p>
              Please be aware that any information you share publicly (such as
              in reviews or public forums) may be accessible to others. We are
              not responsible for information you choose to disclose publicly.
            </p>
            <p>
              In the event of a security breach affecting your personal data, we
              will notify you and relevant authorities as required by applicable
              law.
            </p>
          </Section>

          {/* 11. International */}
          <Section id="international" title="11. International transfers">
            <p>
              Our services are primarily directed to users in the United States.
              If you access our services from outside the United States, your
              information may be transferred to and processed in the United
              States, where data protection laws may differ from those in your
              jurisdiction.
            </p>
            <p>
              If we transfer personal information across borders where required,
              we will take steps consistent with applicable law to protect your
              information, including the use of Standard Contractual Clauses or
              other approved transfer mechanisms where appropriate.
            </p>
          </Section>

          {/* 12. Contact */}
          <Section id="contact" title="12. How to contact us">
            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Notice or our data practices, please contact us:
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 not-italic">
              <p className="font-semibold text-gray-900">
                {COMPANY_LEGAL}{" "}
                <span className="font-normal text-gray-600">
                  (dba {COMPANY_DBA})
                </span>
              </p>
              <p className="mt-2">
                <span className="text-gray-500">Phone </span>
                <a
                  href={`tel:${PHONE.replace(/\s/g, "")}`}
                  className={linkClass}
                >
                  {PHONE}
                </a>
              </p>
              <p>
                <span className="text-gray-500">Email </span>
                <a href={`mailto:${EMAIL}`} className={linkClass}>
                  {EMAIL}
                </a>
              </p>
              <p>
                <span className="text-gray-500">Website </span>
                <a
                  href={SITE_URL}
                  className={`${linkClass} break-all`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SITE_URL}
                </a>
              </p>
            </div>
          </Section>

          <p className="mt-14 pt-8 border-t border-gray-200 font-sans text-[15px] text-gray-600">
            For terms governing use of our Services, see our{" "}
            <Link to="/terms-of-service" className={linkClass}>
              Terms of Service
            </Link>
            .
          </p>
        </article>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50/80">
        <div className="max-w-[680px] mx-auto px-5 sm:px-6 py-8">
          <p className="font-sans text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} {COMPANY_DBA}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
