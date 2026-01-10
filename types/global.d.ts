import messages from "@/messages/en.json";

type Messages = typeof messages;

declare global {
  // Use type safe message keys with useTranslations
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
