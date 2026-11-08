/**
 * Site copy that depends on AACMA facts. Items marked CONFIRM must be checked
 * by Meleph/AACMA before release (spec WEB-02, §2.1): nothing here may be invented.
 * See docs/content-to-confirm.md.
 */
export const AGENCY = {
  /** CONFIRM: official English name of the agency. */
  name: "Addis Ababa City Cleansing Management Agency",
  short: "AACMA",
  shortTagline: "Addis Ababa City Cleansing Management Agency",
};

export const MAIN_NAV = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "News & Updates", href: "/#news" },
  { label: "Publications", href: "/#publications" },
  { label: "Contact", href: "/#contact" },
  { label: "Training Centre", href: "/training" },
];

export const TRAINING_NAV = [
  { label: "Courses", href: "/training#courses" },
  { label: "Learners", href: "/training#learners" },
  { label: "How it works", href: "/training#features" },
  { label: "AACMA website", href: "/" },
];
