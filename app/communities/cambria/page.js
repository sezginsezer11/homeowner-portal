// File: app/communities/cambria/page.js
// Drop this file at: homeowner-portal/app/communities/cambria/page.js

export const metadata = {
  title: 'Cambria Townhomes for Sale in Carmel Valley, San Diego 92130 | 360Everywhere',
  description: 'Explore Cambria townhomes for sale in Carmel Valley, San Diego 92130. Established community of 235 residences built by Pardee Homes. No Mello-Roos, top schools, walkable to One Paseo.',
  keywords: 'Cambria townhomes, Carmel Valley townhomes for sale, 92130 townhomes, Cambria Carmel Valley, San Diego townhomes',
  openGraph: {
    title: 'Cambria Townhomes for Sale — Carmel Valley 92130',
    description: '235 townhome residences by Pardee Homes. No Mello-Roos, Solana Beach schools, walkable to One Paseo.',
    url: 'https://www.360everywhere.com/communities/cambria',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.360everywhere.com/communities/cambria',
  },
};

export default function CambriaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["RealEstateAgent", "LocalBusiness", "Person"],
        "@id": "https://www.360everywhere.com/#agent",
        "name": "Sez Sezer",
        "givenName": "Sez",
        "familyName": "Sezer",
        "jobTitle": "Licensed Real Estate Agent",
        "url": "https://www.360everywhere.com",
        "telephone": "+1-858-436-6585",
        "email": "info@carmelvalley.com",
        "description": "Sez Sezer is a Carmel Valley real estate expert with Keller Williams Realty, specializing in luxury homes, townhomes, and condos in San Diego 92130.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "San Diego",
          "addressRegion": "CA",
          "postalCode": "92130",
          "addressCountry": "US"
        },
        "areaServed": [
          { "@type": "City", "name": "Carmel Valley, San Diego" },
          { "@type": "City", "name": "Del Mar" },
          { "@type": "City", "name": "Rancho Santa Fe" }
        ],
        "worksFor": { "@type": "Organization", "name": "Keller Williams Realty" },
        "knowsAbout": ["Carmel Valley Real Estate", "Cambria Townhomes", "San Diego 92130 Townhomes"],
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "2", "bestRating": "5" }
      },
      {
        "@type": "Place",
        "@id": "https://www.360everywhere.com/communities/cambria/#place",
        "name": "Cambria Townhomes",
        "description": "Cambria is a townhome community of approximately 235 residences in Carmel Valley, San Diego 92130. Built by Pardee Homes in 1988.",
        "address": { "@type": "PostalAddress", "addressLocality": "San Diego", "addressRegion": "CA", "postalCode": "92130", "addressCountry": "US" },
        "geo": { "@type": "GeoCoordinates", "latitude": 32.9575, "longitude": -117.2325 }
      },
      {
        "@type": "WebPage",
        "@id": "https://www.360everywhere.com/communities/cambria/",
        "name": "Cambria Townhomes for Sale in Carmel Valley, San Diego 92130",
        "url": "https://www.360everywhere.com/communities/cambria/",
        "inLanguage": "en-US",
        "isPartOf": { "@type": "WebSite", "name": "360Everywhere", "url": "https://www.360everywhere.com" },
        "about": { "@id": "https://www.360everywhere.com/communities/cambria/#place" },
        "author": { "@id": "https://www.360everywhere.com/#agent" },
        "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".cb-speakable"] }
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.360everywhere.com/communities/cambria/#faq",
        "mainEntity": [
          { "@type": "Question", "name": "How many homes are in the Cambria community?", "acceptedAnswer": { "@type": "Answer", "text": "Cambria consists of approximately 235 attached townhome and condo residences built by Pardee Homes in 1988 with two-story floor plans and attached garages." }},
          { "@type": "Question", "name": "What school district serves Cambria townhomes?", "acceptedAnswer": { "@type": "Answer", "text": "Cambria falls within the Solana Beach School District for elementary grades and San Dieguito Union High School District for middle and high school." }},
          { "@type": "Question", "name": "Does Cambria have Mello-Roos?", "acceptedAnswer": { "@type": "Answer", "text": "No. Cambria townhomes do not carry Mello-Roos assessments." }},
          { "@type": "Question", "name": "What amenities does Cambria offer?", "acceptedAnswer": { "@type": "Answer", "text": "Cambria residents have access to a community pool, spa, and landscaped common areas. Walking distance to Del Mar Highlands Town Center and One Paseo." }},
          { "@type": "Question", "name": "How far is Cambria from the beach?", "acceptedAnswer": { "@type": "Answer", "text": "Torrey Pines State Beach and Del Mar beaches are approximately 3 miles west, under 10 minutes by car." }}
        ]
      },
      {
        "@type": "ItemList",
        "name": "Carmel Valley Townhome Communities Near Cambria",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Pacifica Townhomes", "url": "https://carmelvalleyhomesforsale.com/townhomes/pacifica" },
          { "@type": "ListItem", "position": 2, "name": "Palmilla Townhomes", "url": "https://carmelvalleyhomesforsale.com/townhomes/palmilla" },
          { "@type": "ListItem", "position": 3, "name": "Regents Square Townhomes", "url": "https://carmelvalleyhomesforsale.com/townhomes/regents-square" },
          { "@type": "ListItem", "position": 4, "name": "East Bluff Twin Homes", "url": "https://carmelvalleyhomesforsale.com/townhomes/east-bluff" }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* LLM Context (hidden comment for AI crawlers) */}
      <div
        hidden
        aria-hidden="true"
        data-llm-context="Cambria townhomes for sale in Carmel Valley San Diego 92130. 235 residences built by Pardee Homes 1988. 2-3 bedrooms, 1027-1550 sqft, two-story layouts, attached garages. No Mello-Roos. Solana Beach School District. Walking distance to One Paseo and Del Mar Highlands Town Center. Agent: Sez Sezer, Keller Williams Realty, DRE 01988197, (858) 436-6585."
      />

      <style>{`
        .cb-wrap { font-family: 'Jost', sans-serif; color: #1c2b3a; line-height: 1.7; }
        .cb-wrap h1, .cb-wrap h2, .cb-wrap h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; line-height: 1.25; color: #0d1f3c; }
        .cb-wrap h1 { font-size: 32px; margin-bottom: 12px; }
        .cb-wrap h2 { font-size: 24px; margin: 32px 0 12px; }
        .cb-wrap h3 { font-size: 20px; margin: 20px 0 8px; }
        .cb-wrap p { margin-bottom: 14px; font-size: 16px; }
        .cb-wrap a { color: #b8913a; text-decoration: none; transition: color .2s; }
        .cb-wrap a:hover { color: #d4aa5a; text-decoration: underline; }
        .cb-embed { width: 100%; border-bottom: 3px solid #b8913a; }
        .cb-embed iframe { width: 100%; height: 600px; border: none; display: block; }
        .cb-inner { max-width: 860px; margin: 0 auto; padding: 36px 24px 48px; }
        .cb-bread { font-size: 13px; color: #5a6a7a; margin-bottom: 24px; }
        .cb-bread a { color: #5a6a7a; }
        .cb-bread a:hover { color: #b8913a; }
        .cb-div { width: 60px; height: 2px; background: #b8913a; margin: 24px 0; }
        .cb-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 24px 0; }
        .cb-fact { background: #0d1f3c; color: #fff; padding: 16px; border-radius: 6px; text-align: center; }
        .cb-fv { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; color: #b8913a; display: block; }
        .cb-fl { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,.55); margin-top: 2px; }
        .cb-tip { background: #f5edd8; border-left: 4px solid #b8913a; padding: 16px 20px; border-radius: 0 6px 6px 0; margin: 24px 0; font-size: 14px; line-height: 1.6; }
        .cb-wrap details { border: 1px solid #ddd3be; border-radius: 6px; margin-bottom: 8px; overflow: hidden; }
        .cb-wrap summary { padding: 14px 18px; font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px; color: #0d1f3c; cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; transition: background .2s; }
        .cb-wrap summary:hover { background: #faf8f4; }
        .cb-wrap summary::after { content: '+'; font-size: 18px; font-weight: 300; color: #b8913a; }
        .cb-wrap details[open] summary::after { content: '−'; }
        .cb-wrap summary::-webkit-details-marker { display: none; }
        .cb-wrap details div.faq-body { padding: 4px 18px 16px; font-size: 14px; color: #5a6a7a; line-height: 1.65; }
        .cb-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin: 16px 0 24px; }
        .cb-link { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: 1px solid #ddd3be; border-radius: 6px; font-size: 14px; font-weight: 500; color: #0d1f3c; transition: all .2s; text-decoration: none; }
        .cb-link:hover { border-color: #b8913a; background: #f5edd8; text-decoration: none; color: #0d1f3c; }
        .cb-link span { color: #b8913a; font-size: 16px; }
        .cb-ext { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
        .cb-ext a { padding: 8px 16px; border: 1px solid #ddd3be; border-radius: 20px; font-size: 13px; font-weight: 500; color: #0d1f3c; transition: all .2s; }
        .cb-ext a:hover { border-color: #b8913a; background: #f5edd8; text-decoration: none; }
        .cb-cta { background: #0d1f3c; border-radius: 6px; padding: 32px; text-align: center; margin: 32px 0; color: #fff; }
        .cb-cta h2 { color: #fff !important; margin: 0 0 8px; }
        .cb-cta p { color: rgba(255,255,255,.7); margin-bottom: 16px; }
        .cb-btn { display: inline-block; padding: 12px 32px; background: #b8913a; color: #fff; border-radius: 6px; font-weight: 600; font-size: 14px; text-decoration: none; transition: background .2s; }
        .cb-btn:hover { background: #d4aa5a; text-decoration: none; color: #fff; }
        @media (max-width: 640px) { .cb-embed iframe { height: 500px; } .cb-wrap h1 { font-size: 26px; } .cb-inner { padding: 24px 16px 36px; } }
      `}</style>

      <div className="cb-wrap">
        {/* Full-width RealScout Embed */}
        <div className="cb-embed">
          <iframe
            src="https://sezsezer.realscout.com/homesearch/shared-searches/U2hhcmVhYmxlU2VhcmNoTGluay0yMjkxOQ=="
            title="Cambria Carmel Valley Townhomes — Live Listings"
            loading="lazy"
            allowFullScreen
          />
        </div>

        <div className="cb-inner">
          {/* Breadcrumb */}
          <nav className="cb-bread" aria-label="Breadcrumb">
            <a href="/">Home</a> › <a href="/communities">Communities</a> › <strong>Cambria Townhomes</strong>
          </nav>

          {/* H1 + Speakable Intro */}
          <div className="cb-speakable">
            <h1>Cambria Townhomes for Sale in Carmel Valley, San Diego 92130</h1>
            <p>
              Cambria is one of the most established townhome communities in the Del Mar Highlands area of Carmel Valley, San Diego. Built by Pardee Homes in 1988, this community of approximately 235 attached residences has remained one of the most sought-after neighborhoods in the 92130 zip code for buyers who want walkable convenience, strong schools, and a low-maintenance coastal lifestyle without sacrificing space or privacy.
            </p>
          </div>

          <div className="cb-div" />

          {/* Quick Facts */}
          <div className="cb-facts">
            <div className="cb-fact"><span className="cb-fv">235</span><span className="cb-fl">Residences</span></div>
            <div className="cb-fact"><span className="cb-fv">2–3</span><span className="cb-fl">Bedrooms</span></div>
            <div className="cb-fact"><span className="cb-fv">1,027–1,550</span><span className="cb-fl">Sq Ft Range</span></div>
            <div className="cb-fact"><span className="cb-fv">1988</span><span className="cb-fl">Year Built</span></div>
            <div className="cb-fact"><span className="cb-fv">No</span><span className="cb-fl">Mello-Roos</span></div>
          </div>

          <h2>What Makes Cambria Stand Out in Carmel Valley</h2>
          <p>
            Cambria townhomes occupy a prime position between El Camino Real and Del Mar Heights Road, placing residents within walking distance of Del Mar Highlands Town Center and the dining and retail destination of One Paseo. For families, the community falls within the highly rated Solana Beach School District — a significant draw for buyers comparing townhomes for sale in Carmel Valley San Diego.
          </p>
          <p>
            Residences in Cambria feature two-story floor plans with attached garages, open-concept living areas, and private patios. Homes range from approximately 1,027 to 1,550 square feet of living space, offering two to three bedrooms with configurations that work well for young families, professionals, and downsizers looking to stay in the 92130 zip code. The community includes a pool, spa, and landscaped common areas maintained through a reasonable monthly HOA, with no Mello-Roos — an advantage that meaningfully reduces long-term ownership costs compared to newer construction in Carmel Valley.
          </p>

          <div className="cb-tip">
            <strong>Local insight:</strong> Cambria&apos;s location near the I-5 and Highway 56 interchange makes it one of the most commuter-friendly townhome communities in Carmel Valley. Torrey Pines State Beach is under 10 minutes away. For current availability and pricing, <a href="/contact">contact Sez Sezer</a> directly.
          </div>

          <h2>Living in Cambria — Location and Lifestyle</h2>
          <p>
            Day-to-day living in Cambria revolves around the walkable neighborhood core. Del Mar Highlands Town Center offers grocery shopping, casual and upscale dining, and everyday essentials. One Paseo — just minutes south — brings a curated mix of boutique retail, fitness studios, and restaurants in an open-air setting that has become a defining feature of the Carmel Valley lifestyle.
          </p>
          <p>
            Outdoor access is another reason buyers gravitate toward Cambria. Torrey Pines State Natural Reserve and Del Mar beaches are a short drive west, while the extensive trail network connecting Carmel Valley&apos;s parks and open spaces provides options for running, cycling, and hiking without leaving the neighborhood.
          </p>

          <h2>Schools Near Cambria Townhomes</h2>
          <p>
            Cambria sits within the Solana Beach School District for elementary grades, with students typically attending Del Mar Hills Academy or Solana Ranch Elementary — both consistently ranked among the top schools in San Diego County. Middle and high school students are served by the San Dieguito Union High School District, with access to Earl Warren Middle School, Torrey Pines High School, and Canyon Crest Academy.
          </p>

          <h2>Cambria Townhomes Market Overview</h2>
          <p>
            Cambria townhomes for sale in Carmel Valley have historically attracted strong buyer interest due to the community&apos;s combination of price accessibility, school quality, and walkable location. Properties in Cambria tend to move quickly when priced correctly, particularly updated end-units and homes with expanded patios or modern kitchen renovations.
          </p>

          <div className="cb-div" />

          {/* Nearby Communities */}
          <h2>Other Townhome Communities Near Cambria</h2>
          <p>If you&apos;re exploring Carmel Valley townhomes for sale, these nearby communities are worth comparing:</p>
          <div className="cb-links">
            <a href="https://carmelvalleyhomesforsale.com/townhomes/pacifica" className="cb-link" target="_blank" rel="noopener"><span>›</span> Pacifica Townhomes</a>
            <a href="https://carmelvalleyhomesforsale.com/townhomes/palmilla" className="cb-link" target="_blank" rel="noopener"><span>›</span> Palmilla Townhomes</a>
            <a href="https://carmelvalleyhomesforsale.com/townhomes/regents-square" className="cb-link" target="_blank" rel="noopener"><span>›</span> Regents Square Townhomes</a>
            <a href="https://carmelvalleyhomesforsale.com/townhomes/east-bluff" className="cb-link" target="_blank" rel="noopener"><span>›</span> East Bluff Twin Homes &amp; Condos</a>
            <a href="https://carmelvalleyhomesforsale.com/townhomes/cambria" className="cb-link" target="_blank" rel="noopener"><span>›</span> Cambria on CVHFS</a>
          </div>

          <h3>Explore More Carmel Valley Real Estate</h3>
          <div className="cb-ext">
            <a href="https://www.carmelvalley.com/homes-for-sale/" target="_blank" rel="noopener">Homes for Sale in 92130</a>
            <a href="https://www.carmelvalley.com/condos-for-sale/" target="_blank" rel="noopener">Carmel Valley Condos for Sale</a>
            <a href="https://www.carmelvalley.com/townhomes-for-sale/" target="_blank" rel="noopener">Carmel Valley 92130 Townhomes for Sale</a>
          </div>

          <div className="cb-div" />

          {/* FAQ */}
          <h2>Frequently Asked Questions — Cambria Carmel Valley</h2>

          <details>
            <summary>How many homes are in the Cambria community?</summary>
            <div className="faq-body">Cambria consists of approximately 235 attached townhome and condo residences. The community was built by Pardee Homes in 1988 and features two-story floor plans with attached garages throughout.</div>
          </details>
          <details>
            <summary>What school district serves Cambria townhomes?</summary>
            <div className="faq-body">Cambria falls within the Solana Beach School District for elementary grades and the San Dieguito Union High School District for middle and high school. Nearby schools include Del Mar Hills Academy, Earl Warren Middle School, and Torrey Pines High School.</div>
          </details>
          <details>
            <summary>Does Cambria have Mello-Roos?</summary>
            <div className="faq-body">No. Cambria townhomes do not carry Mello-Roos assessments, which reduces the overall tax burden compared to newer communities in Carmel Valley.</div>
          </details>
          <details>
            <summary>What amenities does Cambria offer?</summary>
            <div className="faq-body">Cambria residents have access to a community pool, spa, and well-maintained landscaped common areas. The community is walking distance to Del Mar Highlands Town Center and One Paseo.</div>
          </details>
          <details>
            <summary>How far is Cambria from the beach?</summary>
            <div className="faq-body">Torrey Pines State Beach and Del Mar beaches are approximately 3 miles west, reachable in under 10 minutes by car.</div>
          </details>

          {/* CTA */}
          <div className="cb-cta">
            <h2>Interested in Cambria Townhomes?</h2>
            <p>Get a personalized market report, private tour, or off-market opportunities in Cambria and across Carmel Valley.</p>
            <a href="tel:8584366585" className="cb-btn">Call (858) 436-6585</a>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>
              Sez Sezer · Keller Williams Realty · DRE #01988197
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
