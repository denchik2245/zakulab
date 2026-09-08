import { typographic } from "@/lib/typographic";
import { ArrowIcon } from "./review-icons";
import { ContactPopupButton } from "./contact-popup-button";
import styles from "./service-order-button.module.css";

type ServiceOrderButtonProps = {
  serviceTitle: string;
  telegramUrl: string;
  maxUrl: string;
  vkUrl: string;
  popupTitlePrefix: string;
  popupDescription: string;
  popupTitle?: string;
};

function lowerFirst(value: string) {
  return value ? `${value[0].toLocaleLowerCase("ru-RU")}${value.slice(1)}` : value;
}

export function ServiceOrderButton({ serviceTitle, telegramUrl, maxUrl, vkUrl, popupTitlePrefix, popupDescription, popupTitle }: ServiceOrderButtonProps) {
  const resolvedTitle = popupTitle?.trim() || `${popupTitlePrefix} ${lowerFirst(serviceTitle)}`;
  const [titleLead, ...titleRest] = resolvedTitle.split(/\s+/);

  return (
    <ContactPopupButton title={<><span>{typographic(titleLead)}</span>{typographic(titleRest.join(" "))}</>} description={popupDescription} telegramUrl={telegramUrl} maxUrl={maxUrl} vkUrl={vkUrl}>
      <span>{typographic(serviceTitle)}</span>
      <ArrowIcon className={styles.triggerArrow} />
    </ContactPopupButton>
  );
}
