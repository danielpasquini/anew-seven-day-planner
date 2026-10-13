import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal-document'

export const metadata: Metadata = {
  title: 'Terms of Use and health notice · Anew',
  description: 'Understand Anew’s educational purpose, health limits, account terms, and optional AI and spiritual content.',
}

export default function TermsPage() {
  return <LegalDocument
    title="Terms of Use"
    introduction="Anew helps adults plan their week, reflect at their own pace, and explore free educational resources. These terms cover the web and installed mobile app. A limited preview is available without creating an account."
    sections={[
      {
        id: 'purpose', title: '1. Purpose, audience, and availability',
        paragraphs: [
          'Anew is an educational self-care tool for people aged 18 or older. The planned release markets are Brazil and the United States. English is the primary language. No identity document, date of birth, diagnosis, or treatment history is required to create an account in this version. An age declaration is not identity verification.',
          'Activities are invitations, not requirements. You may skip, adapt, or stop an activity. Using the app does not create a healthcare or psychologist–client relationship. Educational references from other countries do not mean that their local services are available where you live.',
          'This project is being prepared for release. Account services require configuration, and the service operator and an effective support and privacy contact must be published before public registration is enabled.',
        ],
      },
      {
        id: 'saude', title: '2. Health notice and limits',
        paragraphs: [
          'Anew does not provide psychological assessment, psychological tests, diagnosis, treatment, psychotherapy, medication advice, or clinical scores. Self-reported reflection ratings are personal observations, not validated clinical measurements or conclusions about a condition.',
          'The app is not an emergency service. Entries and AI requests are not monitored by a person to identify risk or arrange help. If you are in immediate danger, contact local emergency services. Seek a qualified healthcare professional for health concerns and before making medical decisions.',
          'Stop an activity if it increases distress. Consider talking to a trusted person or qualified professional. Do not start, stop, or change medication or treatment based on the app. No health outcome is guaranteed.',
        ],
      },
      {
        id: 'choices', title: '3. Your perspectives and choices',
        paragraphs: [
          'You do not have to follow a particular school of psychology, philosophy, or belief to use Anew. Educational resources offer different perspectives with context; listing a resource does not claim that one approach is universally better or appropriate for every person.',
          'Spiritual content is optional, requires an explicit choice, and can be turned off. It is not presented as treatment or a condition for progress. Religious, nonreligious, agnostic, and atheist perspectives receive equal respect.',
        ],
      },
      {
        id: 'account', title: '4. Accounts and the limited preview',
        paragraphs: [
          'The preview lets you explore a limited part of the app without an account. Full personal features may require sign-in, verified email, and current acknowledgements. When configured, Firebase provides the available authentication options. Google sign-in is currently a web option; the installed app uses email and password.',
          'Keep your credentials secure and sign out on shared devices. Passwords are handled by the authentication provider, not stored in your guides or acceptance record. Signing in does not create cloud backup or encrypt your local notes. Someone who controls the device or browser profile may still access local information.',
          'You can edit, export, and delete local records. When account services are configured, the account deletion option is available in the app’s privacy controls and on the Delete account page. It requires confirming your identity. Deleting local records alone does not delete an authentication account. Account deletion still requires testing with the configured service before public release.',
        ],
      },
      {
        id: 'ai', title: '5. Optional artificial intelligence',
        paragraphs: [
          'If enabled, an AI action sends the content identified on its review screen through the app server to Google Gemini. Each action requires a separate choice. Creating an account or accepting these terms does not authorize AI sharing. You can use available manual features without sending content to AI.',
          'Use only impersonal prompts. Do not send names, contact details, identity documents, health information, beliefs, intimate accounts, confidential information, or another person’s data. The provider’s rules depend on the API plan; its unpaid services permit product improvement and human review and prohibit submitting personal, sensitive, or confidential information.',
          'AI output can be inaccurate, biased, or unsuitable. Review it, discard anything unhelpful, and check original sources. It is not professional advice. Do not use AI to generate harmful, abusive, discriminatory, deceptive, or unlawful content. Public AI availability depends on a reviewed service configuration and suitable reporting and safety controls.',
        ],
      },
      {
        id: 'records', title: '6. Local records, backups, and resources',
        paragraphs: [
          'Your personal guides, weekly records, preferences, and saved resources are kept in this browser or the installed app’s local storage. They are not automatically uploaded to Firebase. Keep an export if you want a separate copy. Device failure, storage clearing, or app removal may cause data loss.',
          'Exports can contain personal information. On mobile, choosing a destination in the system share sheet may send the file to another service. You control that destination and should check its privacy practices. Deleting local data does not erase exported files, other devices, platform backups, or information already sent to an external provider.',
          'External resources have their own terms, privacy policies, licenses, eligibility, and regional availability. A listing does not imply affiliation, institutional approval of Anew, or a guarantee of availability or individual benefit. Free access does not necessarily permit copying or redistribution.',
        ],
      },
      {
        id: 'rights', title: '7. Your rights and changes',
        paragraphs: [
          'These terms do not waive rights provided by applicable law, including Brazilian consumer and data protection rights and relevant United States federal and state protections. The health acknowledgement is not a general release of liability. No mandatory arbitration, class-action waiver, or marketing permission is included in these acknowledgements.',
          'Material changes receive a new document version. Updated acknowledgements may be required before protected features are used. The Privacy Notice explains current data flows and controls and is available without an account.',
        ],
      },
    ]}
  />
}
