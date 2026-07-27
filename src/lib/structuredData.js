/**
 * Generates multi-type JSON-LD structured data graph for StretchNow
 */
export function getStructuredDataJSON() {
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://stretchnow.vercel.app/#organization",
        "name": "StretchNow",
        "url": "https://stretchnow.vercel.app/",
        "logo": "https://stretchnow.vercel.app/icon-512.png",
        "description": "Creator of ergonomic stretching and wellness tools for remote workers and office professionals."
      },
      {
        "@type": "WebSite",
        "@id": "https://stretchnow.vercel.app/#website",
        "url": "https://stretchnow.vercel.app/",
        "name": "StretchNow",
        "publisher": {
          "@id": "https://stretchnow.vercel.app/#organization"
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "WebApplication",
        "@id": "https://stretchnow.vercel.app/#webapp",
        "url": "https://stretchnow.vercel.app/",
        "name": "StretchNow",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "StretchNow helps developers, office workers, and remote employees stay healthy with desk stretch reminders, water intake tracking, posture guidance, and wellness insights.",
        "featureList": [
          "Desk stretch reminders & timer",
          "Water intake tracking & daily goals",
          "Posture & ergonomic stretch library",
          "Habit analytics & streak tracking",
          "Offline PWA support & cloud sync"
        ]
      }
    ]
  };

  return JSON.stringify(schemaGraph);
}
