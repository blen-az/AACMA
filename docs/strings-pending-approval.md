# Assistant strings pending approval

Appendix B (Amharic) is used **verbatim** (`AM_APPROVED` in `lib/i18n/strings.ts`, locked by `tests/strings.test.ts`). Sentences are only split at sentence boundaries so they can be combined per step.

The strings below are **drafts** the UI needs that Appendices A/B do not cover. Please approve or correct them.

## 1. New Amharic strings (`AM_PENDING`)

| Key | Draft Amharic | English | Where it appears |
|---|---|---|---|
| question_prompt | እሺ፣ ጥያቄዎን ይጻፉ። | Sure — what would you like to know? | After "ጥያቄ አለኝ" |
| edit_photo | እባክዎ አዲሱን ፎቶ ያያይዙ። | Please attach the new photo. | Editing / removing the photo |
| photo_replace | ፎቶ ቀይር | Replace photo | Under the attached photo |
| photo_remove | ፎቶ አስወግድ | Remove photo | Under the attached photo |
| gps_locating | ቦታዎን በመፈለግ ላይ… | Finding your location… | While GPS runs |
| gps_accuracy | ትክክለኛነት | accuracy | GPS result card |
| gps_map_link | በካርታ ይመልከቱ | View on map | GPS result / review |
| location_current | አሁን ያለሁበት ቦታ | Current location | Review card (GPS) |
| input_placeholder | መልዕክትዎን ይጻፉ… | Type your message… | Input box |
| send / restart / close | ላክ / እንደገና ጀምር / ዝጋ | Send / Start again / Close | Buttons (screen-reader labels) |
| assistant_title | የAACMA AI ረዳት | AACMA AI Assistant | Panel header |
| assistant_subtitle | በአማርኛ ወይም በእንግሊዝኛ ይጠይቁ | English or Amharic | Panel header |
| ai_down_banner | AI ረዳቱ ለጊዜው አይገኝም። የሪፖርት ሂደቱ ግን ይቀጥላል። | The AI assistant is temporarily unavailable. Report intake still works. | When OpenAI is unreachable |
| sources | ምንጮች | Sources | Under grounded answers |
| demo_badge | የሙከራ ማሳያ | Demo | Panel header |
| thinking | በማሰብ ላይ… | Thinking… | Typing indicator (screen readers) |
| attach_photo | ፎቶ አያይዝ | Attach photo | (reserved) |

## 2. English strings not in Appendix A (drafted)

Appendix A wording is used where it exists (`EN_APPENDIX_A_KEYS`). Drafted English equivalents of Appendix B turns:

- Chips: "I have a question", "Report a cleaning problem", "Take photo", "Choose from phone", "Share my location", "Yes, that's right", "No, change location", "Yes, start again", "No, continue"
- "Photo received. Now let's identify the location."
- "To find your location, please allow access to your device's location."
- "Location found. Is this where the problem is?"
- "For example: Bole sub-city, near [landmark]."
- "Thank you." · "Is this information correct?"
- Field labels: Name, Phone, Location, Description, Attached photo
- Errors (B §11–16): "We couldn't get your location. That's fine — you can describe where the problem is instead." · "The photo couldn't be attached. Please try again." · "That phone number doesn't look right. Please check it and enter it again." · "A few details are still needed to complete the report. Please provide: [missing]." · "I couldn't find enough verified information to answer that accurately right now." · "Would you like to rephrase your question?" · "Sorry, I can't process your request right now. Please try again in a little while."
- "Sure — which detail would you like to change?" · "Would you like to start the conversation again?"

## 3. Photo-analysis labels (`lib/i18n/vision-strings.ts`)

All English + Amharic drafts: the "What waste is this? (photo)" chip, "Analysing the photo…", the staff assessment card (title, "For AACMA staff — shown here for demonstration", Priority Low/Medium/High/Urgent → ዝቅተኛ/መካከለኛ/ከፍተኛ/አስቸኳይ, Visible waste, Estimated volume, Why, Risks, Suggested action, Confidence) and the waste categories (Organic, Plastic, Paper & cardboard, Metal, Glass, Textile, Electronic, Hazardous, Construction debris, Mixed household, Other). Please review the Amharic.

## 4. Model-generated Amharic

Free-form answers are written by the model and are **not** fixed strings. They need runtime QA by an Amharic reader (spec §11.3) once the knowledge base is loaded — use `npm run eval` and review `docs/evidence/`.
