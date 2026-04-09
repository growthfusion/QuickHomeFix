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
  { id: "general", label: "General provisions" },
  { id: "functionality", label: "Main functionality" },
  { id: "userreps", label: "User's representation and guarantees" },
  { id: "ip", label: "Intellectual property" },
  { id: "restrictions", label: "Restrictions for website usage" },
  { id: "liability", label: "Limitations on availability and liability, disclaimers and indemnification" },
  { id: "modifications", label: "Modifications" },
  { id: "california", label: "Notice to California residents" },
  { id: "law", label: "Governing law and choice of forum" },
  { id: "misc", label: "Miscellaneous" },
  { id: "communications", label: "Communications with you about your home repair needs" },
  { id: "contact", label: "Contact us" },
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

function TermsOfService() {
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
          <span className="text-gray-600">Terms of Use</span>
        </nav>

        <article lang="en">
          <h1 className="font-sans text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-gray-900 leading-tight mb-2">
            Terms of Use
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
            These Terms of Use ("Terms") govern your access to and use of the
            website and services operated by {COMPANY_LEGAL}, doing business as{" "}
            {COMPANY_DBA} ("Company," "we," "us," "our"), operating{" "}
            <span className="font-medium text-gray-800">{BRAND}</span> at{" "}
            <a
              href={SITE_URL}
              className={`${linkClass} break-all`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {SITE_URL}
            </a>{" "}
            (the "Site") and related offerings that reference these Terms
            (collectively, the "Services"). By accessing or using the Services,
            you agree to be bound by these Terms. If you do not agree, do not
            use the Services.
          </p>

          <div className="mb-12 rounded-2xl bg-gray-50 border border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
            <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              On this page
            </p>
            <ul className="font-sans grid sm:grid-cols-2 gap-x-8 gap-y-2 text-[15px]">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={linkClass}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 1. General provisions */}
          <Section id="general" title="1. General provisions" top="mt-0">
            <p>
              {BRAND} is operated by {COMPANY_LEGAL}, doing business as{" "}
              {COMPANY_DBA}. {BRAND} functions as a search engine and matching
              platform for home repair and improvement services. We do not
              provide repair services directly, nor do we act as a contractor,
              installer, or service provider.
            </p>
            <p>
              The use of the Site and its services is free for users. Our
              partners (service providers, contractors, and home improvement
              companies) may pay fees for leads or referrals generated through
              our platform.
            </p>
            <p>
              By accessing or using the Services, you acknowledge that you have
              read, understood, and agree to be bound by these Terms, as well as
              our{" "}
              <Link to="/privacy-policy" className={linkClass}>
                Privacy Notice
              </Link>
              .
            </p>
          </Section>

          {/* 2. Main functionality */}
          <Section id="functionality" title="2. Main functionality">
            <p>
              {BRAND} allows users to submit information about their home
              improvement projects to receive quotes and be connected with
              service professionals. When you submit a request, we collect your
              contact information (name, phone number, email address) and
              project details (address, service type, preferences).
            </p>
            <p>
              By submitting a quote request, you authorize {BRAND} and up to
              four home improvement companies to contact you via phone calls,
              text messages, and emails to discuss your project. You understand
              that some may use auto-dialers, SMS messages, and artificial or
              prerecorded voice messages to contact you. There is no requirement
              to purchase services.
            </p>
            <p>
              {BRAND} does not investigate, verify credentials, endorse, or
              guarantee the qualifications, services, or pricing of any partner
              or service provider. You assume all risk in selecting and engaging
              with any partner. We are not responsible for the quality,
              timeliness, legality, or any other aspect of services provided by
              our partners.
            </p>
          </Section>

          {/* 3. User representations */}
          <Section
            id="userreps"
            title="3. User's representation and guarantees"
          >
            <p>By using the Services, you represent and warrant that:</p>
            <ol className="list-decimal list-outside ml-6 space-y-3 pl-1 marker:text-gray-500">
              <li>You are at least 18 years of age.</li>
              <li>
                You have the legal capacity to enter into and agree to these
                Terms.
              </li>
              <li>
                All information you provide is true, accurate, current, and
                complete.
              </li>
              <li>
                You understand that {BRAND} does not investigate or endorse any
                partner or service provider.
              </li>
              <li>
                You will not access the Services through unauthorized automated
                means.
              </li>
              <li>
                You will not use the Services for any illegal or unauthorized
                purpose.
              </li>
              <li>
                Your use of the Services will comply with all applicable laws
                and regulations.
              </li>
            </ol>
            <p>
              If any information you provide is untrue, inaccurate, or
              incomplete, we may suspend or terminate your access to the
              Services.
            </p>
          </Section>

          {/* 4. Intellectual property */}
          <Section id="ip" title="4. Intellectual property">
            <p>
              We own or license all intellectual property in the Services,
              including software, designs, text, images, audio, video, graphics
              ("Content"), and our trademarks, service marks, and logos
              ("Marks"). Content and Marks are protected by copyright,
              trademark, and other applicable laws.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable
              license to access and use the Services for personal,
              non-commercial purposes only. You may not copy, reproduce,
              distribute, modify, create derivative works from, publicly
              display, or mirror any Content or Marks without our prior written
              consent.
            </p>
            <p>
              If you believe that any content on the Site infringes your
              intellectual property rights, please contact us at{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>{" "}
              with details of the alleged infringement.
            </p>
          </Section>

          {/* 5. Restrictions */}
          <Section id="restrictions" title="5. Restrictions for website usage">
            <p>
              You may use the Services only for their intended purpose. You
              agree not to:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-3 pl-1 marker:text-gray-400">
              <li>
                Use the Services for any illegal activity or in violation of any
                applicable law or regulation.
              </li>
              <li>
                Attempt to gain unauthorized access to the Services, other user
                accounts, or computer systems or networks connected to the
                Services.
              </li>
              <li>
                Engage in any automated use of the system, including using
                scripts, bots, spiders, scrapers, or similar data gathering
                tools without our authorization.
              </li>
              <li>
                Interfere with, disrupt, or create an undue burden on the
                Services or connected networks.
              </li>
              <li>
                Upload or transmit viruses, malware, or other harmful code.
              </li>
              <li>
                Attempt to impersonate another user or person.
              </li>
              <li>
                Collect or harvest user information, including email addresses
                or phone numbers, to send unsolicited communications.
              </li>
              <li>
                Reverse engineer, decompile, disassemble, or otherwise attempt
                to derive the source code of the Services, except as permitted
                by law.
              </li>
              <li>
                Copy, reproduce, or redistribute the Services or Content without
                our written permission.
              </li>
              <li>
                Use the Services to advertise or offer to sell goods or services
                without our prior written consent.
              </li>
              <li>
                Harass, abuse, threaten, or intimidate any user, employee, or
                agent.
              </li>
            </ul>
          </Section>

          {/* 6. Liability */}
          <Section
            id="liability"
            title="6. Limitations on availability and liability, disclaimers and indemnification"
          >
            <Subheading>Disclaimer</Subheading>
            <p className="text-sm sm:text-[15px] leading-7 text-gray-700 uppercase tracking-wide">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE
              FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
              EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
              THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE ARE
              NOT RESPONSIBLE FOR THIRD-PARTY PRODUCTS, SERVICES, OR LINKS.
            </p>
            <Subheading>Limitation of liability</Subheading>
            <p className="text-sm sm:text-[15px] leading-7 text-gray-700 uppercase tracking-wide">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE AND OUR OFFICERS,
              DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              OR LOST PROFITS OR DATA, ARISING FROM YOUR USE OF THE SERVICES.
              OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THE SERVICES SHALL
              NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE
              (12) MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US
              $100). SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; IN
              THOSE CASES, OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT
              PERMITTED BY LAW.
            </p>
            <Subheading>Indemnification</Subheading>
            <p>
              You agree to defend, indemnify, and hold harmless {COMPANY_LEGAL},{" "}
              {COMPANY_DBA}, and our affiliates, officers, agents, and employees
              from claims, damages, losses, and expenses (including reasonable
              attorneys' fees) arising from your use of the Services, your
              breach of these Terms, or your violation of third-party rights or
              law. We may assume exclusive defense of any matter subject to
              indemnification, at your expense, and you agree to cooperate.
            </p>
          </Section>

          {/* 7. Modifications */}
          <Section id="modifications" title="7. Modifications">
            <p>
              We reserve the right to change, modify, suspend, or discontinue
              any aspect of the Services at any time without prior notice. We
              are not obligated to maintain or update information on the
              Services. We are not liable for any modification, suspension, or
              discontinuation of the Services.
            </p>
            <p>
              We may update these Terms by changing the "Last updated" date.
              Continued use of the Services after changes means you accept the
              revised Terms. We recommend keeping a copy for your records.
            </p>
          </Section>

          {/* 8. California */}
          <Section
            id="california"
            title="8. Notice to California residents"
          >
            <p>
              If a complaint is not resolved to your satisfaction, California
              residents may contact the Complaint Assistance Unit of the
              Division of Consumer Services of the California Department of
              Consumer Affairs in writing at 1625 North Market Blvd., Suite N
              112, Sacramento, CA 95834, or by telephone at (800) 952-5210 or
              (916) 445-1254.
            </p>
          </Section>

          {/* 9. Governing law */}
          <Section id="law" title="9. Governing law and choice of forum">
            <Subheading>Governing law</Subheading>
            <p>
              These Terms and your use of the Services are governed by the laws
              of the State of New York, without regard to conflict-of-law
              principles, except where preempted by U.S. federal law.
            </p>
            <Subheading>Binding arbitration</Subheading>
            <p>
              Any dispute arising out of or relating to these Terms may, at
              either party's election, be resolved by binding arbitration
              administered by a recognized arbitration provider, with one (1)
              arbitrator, conducted in the English language. The seat of
              arbitration shall be New York, New York, unless otherwise required
              by applicable law. Judgment on the award may be entered in any
              court of competent jurisdiction.
            </p>
            <Subheading>Class action waiver</Subheading>
            <p>
              To the fullest extent permitted by law, disputes must be brought
              in an individual capacity, not as a plaintiff or class member in
              any class or representative proceeding. You waive any right to
              participate in a class action lawsuit or class-wide arbitration.
            </p>
            <Subheading>Exceptions</Subheading>
            <p>
              Either party may seek injunctive relief in court for intellectual
              property or unauthorized use claims. If any part of this dispute
              section is unenforceable, the remainder stays in effect to the
              maximum extent permitted.
            </p>
          </Section>

          {/* 10. Miscellaneous */}
          <Section id="misc" title="10. Miscellaneous">
            <p>
              These Terms and policies posted on the Services are the entire
              agreement between you and us. Failure to enforce a provision is
              not a waiver. If a provision is invalid, the remaining provisions
              remain in effect. We may assign our rights and obligations. There
              is no joint venture, partnership, employment, or agency
              relationship created by these Terms. You waive any defense based
              on the electronic form of these Terms.
            </p>
            <p>
              Any dispute or claim relating to these Terms must be commenced
              within one (1) year after the cause of action arises; otherwise,
              such cause of action is permanently barred. The prevailing party
              in any action or proceeding to enforce these Terms shall be
              entitled to recover reasonable attorneys' fees.
            </p>
          </Section>

          {/* 11. Communications */}
          <Section
            id="communications"
            title="11. Communications with you about your home repair needs"
          >
            <p>
              By submitting your information through our Services, you expressly
              authorize {BRAND} and its partners to contact you regarding your
              home improvement project via:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-3 pl-1 marker:text-gray-400">
              <li>
                Phone calls, including calls made using an automatic telephone
                dialing system (ATDS) or artificial and prerecorded voice
                messages.
              </li>
              <li>
                Text messages (SMS), including messages sent using automated
                technology.
              </li>
              <li>Email communications.</li>
            </ul>
            <p>
              You may withdraw your consent to receive such communications at
              any time by emailing us at{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>{" "}
              or by following the unsubscribe instructions in any communication
              you receive.
            </p>
          </Section>

          {/* 12. Contact */}
          <Section id="contact" title="12. Contact us">
            <p>
              For questions about these Terms or the Services, contact:
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
            </div>
          </Section>
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

export default TermsOfService;
