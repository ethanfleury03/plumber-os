const business = require("../config/business");
const { absoluteUrl } = require("./seo");

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.businessName,
    alternateName: business.shortName,
    description: "Practical workflow automation for local businesses in Buffalo, Niagara, and Western New York.",
    url: business.siteUrl,
    logo: absoluteUrl("/assets/wny-automation-icon.svg"),
    sameAs: Object.values(business.socialLinks).filter(Boolean),
  };
}

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: business.businessName,
    url: business.siteUrl,
  };
}

function localBusinessSchema(path = "/") {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.businessName,
    description: "Practical workflow automation for local businesses in Buffalo, Niagara, and Western New York.",
    url: absoluteUrl(path),
    image: absoluteUrl("/assets/wny-automation-icon.svg"),
    email: business.email,
    areaServed: business.serviceArea.map((name) => ({
      "@type": name === "Western New York" ? "AdministrativeArea" : "City",
      name,
    })),
  };

  if (business.phone) {
    schema.telephone = business.phone;
  }

  if (business.address.street || business.address.postalCode) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    };
  }

  return schema;
}

function serviceSchema(service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    provider: {
      "@type": "LocalBusiness",
      name: business.businessName,
      url: business.siteUrl,
    },
    areaServed: business.primaryRegion,
    serviceType: service.primaryKeyword || service.title,
    url: absoluteUrl(`/services/${service.slug}`),
  };
}

function faqPageSchema(faqs = []) {
  if (!faqs.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function breadcrumbSchema(items = []) {
  if (!items.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

function articleSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.metaDescription || post.excerpt,
    datePublished: post.publish_date || post.publishDate,
    dateModified: post.updated_at || post.updatedDate || post.publish_date || post.publishDate,
    author: {
      "@type": "Organization",
      name: post.author || business.businessName,
    },
    publisher: {
      "@type": "Organization",
      name: business.businessName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/wny-automation-icon.svg"),
      },
    },
    image: absoluteUrl(post.image_url || post.featuredImage || "/assets/wny-automation-icon.svg"),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

function compactSchemas(items) {
  return items.filter(Boolean);
}

module.exports = {
  articleSchema,
  breadcrumbSchema,
  compactSchemas,
  faqPageSchema,
  localBusinessSchema,
  organizationSchema,
  serviceSchema,
  websiteSchema,
};
