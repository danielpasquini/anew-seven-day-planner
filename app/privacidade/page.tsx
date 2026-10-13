import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal-document'

export const metadata: Metadata = {
  title: 'Privacy Notice · Anew',
  description: 'Understand local device records, Firebase accounts and acceptance data, optional Gemini requests, and your privacy choices.',
}

export default function PrivacyPage() {
  return <LegalDocument
    title="Privacy Notice"
    introduction="This notice covers the web and installed mobile app prepared for adults in Brazil and the United States. Your local records, account services, and optional AI requests follow different paths. Acknowledging this notice is not blanket consent to unrelated processing."
    sections={[
      {
        id: 'operator', title: '1. Release status and service operator',
        paragraphs: [
          'Anew is being prepared for release. Public account registration is not ready until Firebase is configured and the service operator’s identity and effective support and privacy contact are published. The final provider contracts, processing locations, retention periods, and rights request process must also be reviewed before public operation.',
          'This development notice does not name an operator or contact that has not been established. Do not use real personal information for development testing. This notice is not a certification of compliance, a claim of HIPAA coverage, or a substitute for the final service privacy policy.',
        ],
      },
      {
        id: 'local', title: '2. Records on your device',
        paragraphs: [
          'Personal guides, notes, reflection answers, weekly schedules, preferences, and resource favorites are stored locally in your browser or the installed app’s webview storage. Creating an account does not synchronize these records to the cloud. They are not automatically sent to Firebase or Gemini.',
          'Anew does not apply its own encryption or password protection to local records. Device and operating system protections may apply, but people with access to the device or browser profile may still access the information. Signing out does not erase the local copy. Device backups and migration depend on platform settings and must not be assumed to exclude app data.',
          'You can edit local records, export a backup, and delete local data through the app’s controls. A mobile export creates a temporary file for the system share sheet; the app attempts to remove its temporary copy afterward. Files saved or shared to a chosen destination remain under that destination’s control. Local deletion does not erase exports, platform backups, other devices, or previously transmitted information.',
        ],
      },
      {
        id: 'account', title: '3. Authentication and acceptance records',
        paragraphs: [
          'When configured, Firebase Authentication processes your email, password or chosen sign-in provider identifiers and basic profile details supplied by that provider, such as display name. Technical information such as IP address and user-agent details helps authenticate you, verify email, recover access, and prevent abuse. The server validates your access token for protected functions. Your password is not stored in guides or acceptance records.',
          'Cloud Firestore stores five acceptance fields linked to your account identifier: the versions of the Terms of Use, Privacy Notice, and health notice; your adult confirmation; and the server-recorded acceptance time. The current rules permit only that account’s holder to access this record and do not permit journals, guides, or personal preferences in Firestore.',
          'For Brazil, account information necessary to deliver the service you request is considered separately from acceptance evidence and optional sharing. Contract performance and the exercise of rights may be relevant legal bases for these limited purposes; the operator must validate the final purpose-by-purpose assessment. The privacy acknowledgement does not authorize marketing or sensitive-data processing.',
          'Firebase Authentication is processed in the United States. Locations for other Google services depend on service and configuration. The release operator must evaluate provider contracts and an applicable international transfer mechanism before enabling public service in Brazil.',
        ],
      },
      {
        id: 'ai', title: '4. Optional sharing with Google Gemini',
        paragraphs: [
          'If AI is enabled, only the content identified for an action and approved by you is sent through the app server to Google Gemini. Review that content before each request. Signing up, acknowledging this notice, or enabling spiritual content does not authorize sending your records to AI. You may decline and continue with available manual features.',
          'Even a short description can identify someone or reveal sensitive information. Use impersonal content only. Do not include health details, beliefs, intimate accounts, confidential information, names, contact details, identity documents, or other people’s information.',
          'Google’s unpaid API terms permit use of inputs and outputs for product improvement and human review and instruct users not to submit personal, sensitive, or confidential information. Paid-service terms differ. Possession of an API key does not establish an appropriate plan or contract. AI is disabled by default until the release configuration is reviewed.',
          'The provider may process requests outside Brazil. Declining future requests or deleting local history does not undo an earlier transmission or guarantee immediate provider deletion. Retention and provider access depend on the applicable service terms. The operator must verify the plan, contracts, transfer safeguards, and deletion options before public AI availability.',
        ],
      },
      {
        id: 'health-data', title: '5. Health information, beliefs, and regional rights',
        paragraphs: [
          'A reflection can reveal health information or a religious belief, even without a diagnosis or explicit label. These may be sensitive personal data under Brazilian law or consumer health data under applicable United States state law. Such information is not required for registration. The health acknowledgement explains product limits; it is not permission to process sensitive information.',
          'Spiritual content is optional and can be disabled. The preference is local and is not sent to the authentication service. Anew does not offer clinical automated decisions or personality assessment. This version does not connect to HealthKit, Health Connect, medical records, insurers, or healthcare providers.',
          'Your rights depend on the applicable law and circumstances. Brazilian LGPD rights and United States state privacy and consumer health rights may include access, correction, deletion, withdrawal of consent, information about disclosures, and other protections. A release to a state with consumer health privacy requirements needs its own applicability review and, when required, additional notice and separate collection or sharing consent. The general acknowledgements are not a replacement.',
        ],
      },
      {
        id: 'technical', title: '6. Technical data and external services',
        paragraphs: [
          'Hosting and service providers may process technical access and security information to operate the service and prevent abuse. This version does not include advertising or audience analytics SDKs. Session and preference storage may be necessary for app operation. The final store privacy disclosures must include the actual authentication SDK and server data flows.',
          'Resource links open external websites using your browser or an in-app browser surface. Those sites receive technical information about the visit and may use their own cookies. Their policies apply to that visit. Opening a resource is your choice; a link does not automatically share your journal content.',
        ],
      },
      {
        id: 'deletion', title: '7. Access, deletion, and retention',
        paragraphs: [
          'You can access, correct, export, and erase local records in the app. These local controls are available separately from the authentication account. Clearing local storage or uninstalling the app does not delete Firebase authentication data or the acceptance record.',
          'When Firebase is configured, use Delete account in the app’s privacy controls or the Delete account web page. After identity confirmation, the flow removes the acceptance record and requests deletion of the authentication account, then attempts to remove that account’s local records on this device. These operations are not a single atomic deletion: if one fails, follow the error message and retry. If device storage cleanup is blocked, clear this app’s storage in device settings. Downloaded backups, other devices, platform backups, and prior provider submissions are separate.',
          'The deletion page is prepared locally; a working public URL and testing with the configured service are required before store release. The operator must also provide an effective contact for data rights and explain any lawful retention. Signing out or disabling an account is not deletion.',
          'Local records remain until you or the platform remove them. Authentication records follow Firebase’s retention and deletion processes; removing live data does not mean all backups immediately disappear. The operator must set and publish proportionate acceptance-record and technical-log retention periods before public registration. No universal deletion time is promised here.',
          'Depending on applicable law, you may have rights to confirmation and access, correction, portability, deletion, withdrawal of consent, objection, limitation, or an appeal or complaint. Acknowledging this notice does not restrict those rights. The effective request method and any lawful exceptions must be published before launch.',
          'Material changes receive a new version and must be explained before new purposes or sharing begin. The Terms of Use include the educational scope and health notice.',
        ],
      },
    ]}
  />
}
