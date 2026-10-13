// Native text presentation of the public Anew notices. No Next/HTML runtime.
export const NATIVE_LEGAL_DOCUMENTS = {
  "terms": {
    "title": "Terms of Use",
    "introduction": "Anew helps adults plan their week, reflect at their own pace, and explore free educational resources. These terms cover the web and installed mobile app. A limited preview is available without creating an account.",
    "sections": [
      {
        "id": "purpose",
        "title": "1. Purpose, audience, and availability",
        "paragraphs": [
          "Anew is an educational self-care tool for people aged 18 or older. The planned release markets are Brazil and the United States. English is the primary language. No identity document, date of birth, diagnosis, or treatment history is required to create an account in this version. An age declaration is not identity verification.",
          "Activities are invitations, not requirements. You may skip, adapt, or stop an activity. Using the app does not create a healthcare or psychologist–client relationship. Educational references from other countries do not mean that their local services are available where you live.",
          "This project is being prepared for release. Account services require configuration, and the service operator and an effective support and privacy contact must be published before public registration is enabled."
        ]
      },
      {
        "id": "saude",
        "title": "2. Health notice and limits",
        "paragraphs": [
          "Anew does not provide psychological assessment, psychological tests, diagnosis, treatment, psychotherapy, medication advice, or clinical scores. Self-reported reflection ratings are personal observations, not validated clinical measurements or conclusions about a condition.",
          "The app is not an emergency service. Entries and AI requests are not monitored by a person to identify risk or arrange help. If you are in immediate danger, contact local emergency services. Seek a qualified healthcare professional for health concerns and before making medical decisions.",
          "Stop an activity if it increases distress. Consider talking to a trusted person or qualified professional. Do not start, stop, or change medication or treatment based on the app. No health outcome is guaranteed."
        ]
      },
      {
        "id": "choices",
        "title": "3. Your perspectives and choices",
        "paragraphs": [
          "You do not have to follow a particular school of psychology, philosophy, or belief to use Anew. Educational resources offer different perspectives with context; listing a resource does not claim that one approach is universally better or appropriate for every person.",
          "Spiritual content is optional, requires an explicit choice, and can be turned off. It is not presented as treatment or a condition for progress. Religious, nonreligious, agnostic, and atheist perspectives receive equal respect."
        ]
      },
      {
        "id": "account",
        "title": "4. Accounts and the limited preview",
        "paragraphs": [
          "The preview lets you explore a limited part of the app without an account. Full personal features may require sign-in, verified email, and current acknowledgements. When configured, Firebase provides the available authentication options. Google sign-in is currently a web option; the installed app uses email and password.",
          "Keep your credentials secure and sign out on shared devices. Passwords are handled by the authentication provider, not stored in your guides or acceptance record. Signing in does not create cloud backup or encrypt your local notes. Someone who controls the device or browser profile may still access local information.",
          "You can edit, export, and delete local records. When account services are configured, the account deletion option is available in the app’s privacy controls and on the Delete account page. It requires confirming your identity. Deleting local records alone does not delete an authentication account. Account deletion still requires testing with the configured service before public release."
        ]
      },
      {
        "id": "ai",
        "title": "5. Optional artificial intelligence",
        "paragraphs": [
          "If enabled, an AI action sends the content identified on its review screen through the app server to Google Gemini. Each action requires a separate choice. Creating an account or accepting these terms does not authorize AI sharing. You can use available manual features without sending content to AI.",
          "Use only impersonal prompts. Do not send names, contact details, identity documents, health information, beliefs, intimate accounts, confidential information, or another person’s data. The provider’s rules depend on the API plan; its unpaid services permit product improvement and human review and prohibit submitting personal, sensitive, or confidential information.",
          "AI output can be inaccurate, biased, or unsuitable. Review it, discard anything unhelpful, and check original sources. It is not professional advice. Do not use AI to generate harmful, abusive, discriminatory, deceptive, or unlawful content. Public AI availability depends on a reviewed service configuration and suitable reporting and safety controls."
        ]
      },
      {
        "id": "records",
        "title": "6. Local records, backups, and resources",
        "paragraphs": [
          "Your personal guides, weekly records, preferences, and saved resources are kept in this browser or the installed app’s local device storage. They are not automatically uploaded to Firebase. Keep an export if you want a separate copy. Device failure, storage clearing, or app removal may cause data loss.",
          "Exports can contain personal information. On mobile, choosing a destination in the system share sheet may send the file to another service. You control that destination and should check its privacy practices. Deleting local data does not erase exported files, other devices, platform backups, or information already sent to an external provider.",
          "External resources have their own terms, privacy policies, licenses, eligibility, and regional availability. A listing does not imply affiliation, institutional approval of Anew, or a guarantee of availability or individual benefit. Free access does not necessarily permit copying or redistribution."
        ]
      },
      {
        "id": "rights",
        "title": "7. Your rights and changes",
        "paragraphs": [
          "These terms do not waive rights provided by applicable law, including Brazilian consumer and data protection rights and relevant United States federal and state protections. The health acknowledgement is not a general release of liability. No mandatory arbitration, class-action waiver, or marketing permission is included in these acknowledgements.",
          "Material changes receive a new document version. Updated acknowledgements may be required before protected features are used. The Privacy Notice explains current data flows and controls and is available without an account."
        ]
      }
    ]
  },
  "privacy": {
    "title": "Privacy Notice",
    "introduction": "This notice covers the web and installed mobile app prepared for adults in Brazil and the United States. Your local records, account services, and optional AI requests follow different paths. Acknowledging this notice is not blanket consent to unrelated processing.",
    "sections": [
      {
        "id": "operator",
        "title": "1. Release status and service operator",
        "paragraphs": [
          "Anew is being prepared for release. Public account registration is not ready until Firebase is configured and the service operator’s identity and effective support and privacy contact are published. The final provider contracts, processing locations, retention periods, and rights request process must also be reviewed before public operation.",
          "This development notice does not name an operator or contact that has not been established. Do not use real personal information for development testing. This notice is not a certification of compliance, a claim of HIPAA coverage, or a substitute for the final service privacy policy."
        ]
      },
      {
        "id": "local",
        "title": "2. Records on your device",
        "paragraphs": [
          "Personal guides, notes, reflection answers, weekly schedules, preferences, and resource favorites are stored locally in your browser or the installed app’s local device storage. Creating an account does not synchronize these records to the cloud. They are not automatically sent to Firebase or Gemini.",
          "Anew does not apply its own encryption or password protection to local records. Device and operating system protections may apply, but people with access to the device or browser profile may still access the information. Signing out does not erase the local copy. Device backups and migration depend on platform settings and must not be assumed to exclude app data.",
          "You can edit local records, export a backup, and delete local data through the app’s controls. A mobile export creates a temporary file for the system share sheet; the app attempts to remove its temporary copy afterward. Files saved or shared to a chosen destination remain under that destination’s control. Local deletion does not erase exports, platform backups, other devices, or previously transmitted information."
        ]
      },
      {
        "id": "account",
        "title": "3. Authentication and acceptance records",
        "paragraphs": [
          "When configured, Firebase Authentication processes your email, password or chosen sign-in provider identifiers and basic profile details supplied by that provider, such as display name. Technical information such as IP address and user-agent details helps authenticate you, verify email, recover access, and prevent abuse. The server validates your access token for protected functions. Your password is not stored in guides or acceptance records.",
          "Cloud Firestore stores five acceptance fields linked to your account identifier: the versions of the Terms of Use, Privacy Notice, and health notice; your adult confirmation; and the server-recorded acceptance time. The current rules permit only that account’s holder to access this record and do not permit journals, guides, or personal preferences in Firestore.",
          "For Brazil, account information necessary to deliver the service you request is considered separately from acceptance evidence and optional sharing. Contract performance and the exercise of rights may be relevant legal bases for these limited purposes; the operator must validate the final purpose-by-purpose assessment. The privacy acknowledgement does not authorize marketing or sensitive-data processing.",
          "Firebase Authentication is processed in the United States. Locations for other Google services depend on service and configuration. The release operator must evaluate provider contracts and an applicable international transfer mechanism before enabling public service in Brazil."
        ]
      },
      {
        "id": "ai",
        "title": "4. Optional sharing with Google Gemini",
        "paragraphs": [
          "If AI is enabled, only the content identified for an action and approved by you is sent through the app server to Google Gemini. Review that content before each request. Signing up, acknowledging this notice, or enabling spiritual content does not authorize sending your records to AI. You may decline and continue with available manual features.",
          "Even a short description can identify someone or reveal sensitive information. Use impersonal content only. Do not include health details, beliefs, intimate accounts, confidential information, names, contact details, identity documents, or other people’s information.",
          "Google’s unpaid API terms permit use of inputs and outputs for product improvement and human review and instruct users not to submit personal, sensitive, or confidential information. Paid-service terms differ. Possession of an API key does not establish an appropriate plan or contract. AI is disabled by default until the release configuration is reviewed.",
          "The provider may process requests outside Brazil. Declining future requests or deleting local history does not undo an earlier transmission or guarantee immediate provider deletion. Retention and provider access depend on the applicable service terms. The operator must verify the plan, contracts, transfer safeguards, and deletion options before public AI availability."
        ]
      },
      {
        "id": "health-data",
        "title": "5. Health information, beliefs, and regional rights",
        "paragraphs": [
          "A reflection can reveal health information or a religious belief, even without a diagnosis or explicit label. These may be sensitive personal data under Brazilian law or consumer health data under applicable United States state law. Such information is not required for registration. The health acknowledgement explains product limits; it is not permission to process sensitive information.",
          "Spiritual content is optional and can be disabled. The preference is local and is not sent to the authentication service. Anew does not offer clinical automated decisions or personality assessment. This version does not connect to HealthKit, Health Connect, medical records, insurers, or healthcare providers.",
          "Your rights depend on the applicable law and circumstances. Brazilian LGPD rights and United States state privacy and consumer health rights may include access, correction, deletion, withdrawal of consent, information about disclosures, and other protections. A release to a state with consumer health privacy requirements needs its own applicability review and, when required, additional notice and separate collection or sharing consent. The general acknowledgements are not a replacement."
        ]
      },
      {
        "id": "technical",
        "title": "6. Technical data and external services",
        "paragraphs": [
          "Hosting and service providers may process technical access and security information to operate the service and prevent abuse. This version does not include advertising or audience analytics SDKs. Session and preference storage may be necessary for app operation. The final store privacy disclosures must include the actual authentication SDK and server data flows.",
          "Resource links open external websites using your browser or an in-app browser surface. Those sites receive technical information about the visit and may use their own cookies. Their policies apply to that visit. Opening a resource is your choice; a link does not automatically share your journal content."
        ]
      },
      {
        "id": "deletion",
        "title": "7. Access, deletion, and retention",
        "paragraphs": [
          "You can access, correct, export, and erase local records in the app. These local controls are available separately from the authentication account. Clearing local storage or uninstalling the app does not delete Firebase authentication data or the acceptance record.",
          "When Firebase is configured, use Delete account in the app’s privacy controls or the Delete account web page. After identity confirmation, the flow removes the acceptance record and requests deletion of the authentication account, then attempts to remove that account’s local records on this device. These operations are not a single atomic deletion: if one fails, follow the error message and retry. If device storage cleanup is blocked, clear this app’s storage in device settings. Downloaded backups, other devices, platform backups, and prior provider submissions are separate.",
          "The deletion page is prepared locally; a working public URL and testing with the configured service are required before store release. The operator must also provide an effective contact for data rights and explain any lawful retention. Signing out or disabling an account is not deletion.",
          "Local records remain until you or the platform remove them. Authentication records follow Firebase’s retention and deletion processes; removing live data does not mean all backups immediately disappear. The operator must set and publish proportionate acceptance-record and technical-log retention periods before public registration. No universal deletion time is promised here.",
          "Depending on applicable law, you may have rights to confirmation and access, correction, portability, deletion, withdrawal of consent, objection, limitation, or an appeal or complaint. Acknowledging this notice does not restrict those rights. The effective request method and any lawful exceptions must be published before launch.",
          "Material changes receive a new version and must be explained before new purposes or sharing begin. The Terms of Use include the educational scope and health notice."
        ]
      }
    ]
  }
} as const
