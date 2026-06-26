const fs = require('fs');
const path = require('path');

// Base Config
const BASE_URL = 'https://mohammadielectronics.com';
const API_URL = 'https://mohammadielectronics.com/api/products';
const DIST_PATHS = [
  path.join(__dirname, 'dist', 'mohammadi-electronics', 'browser'),
  path.join(__dirname, 'dist', 'mohammadi-electronics'),
  path.join(__dirname, 'dist')
];

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  const currentDate = new Date().toISOString().split('T')[0];

  // Core static routes (Priority: 1.0 for home, 0.8 for forms, changefreq monthly for forms)
  const staticUrls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/feedback', changefreq: 'monthly', priority: '0.8' },
    { loc: '/service-requests', changefreq: 'monthly', priority: '0.8' },
    { loc: '/product-demands', changefreq: 'monthly', priority: '0.8' }
  ];

  let dynamicUrls = [];

  try {
    console.log(`Fetching live products from ${API_URL}...`);
    // Node.js global fetch is available on Node.js 18+
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    if (Array.isArray(products)) {
      dynamicUrls = products
        .filter(p => p.slug)
        .map(p => ({
          loc: `/product/${p.slug}`,
          changefreq: 'weekly',
          priority: '0.9'
        }));
      console.log(`Successfully fetched ${dynamicUrls.length} products.`);
    } else {
      console.warn('Backend API did not return an array of products. Using static routes only.');
    }
  } catch (error) {
    console.warn(`Warning: Could not fetch products from backend (${error.message}). Falling back to static routes only.`);
  }

  const allUrls = [...staticUrls, ...dynamicUrls];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of allUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${url.loc}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  // Write to all output paths
  let writtenCount = 0;
  for (const distPath of DIST_PATHS) {
    try {
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      const filePath = path.join(distPath, 'sitemap.xml');
      fs.writeFileSync(filePath, xml, 'utf8');
      console.log(`Saved sitemap.xml to: ${filePath}`);
      writtenCount++;
    } catch (err) {
      console.error(`Failed to write sitemap to ${distPath}: ${err.message}`);
    }
  }

  if (writtenCount > 0) {
    console.log('Sitemap generation completed successfully!');
  } else {
    throw new Error('Sitemap could not be saved to any build directory.');
  }
}

generateSitemap().catch(err => {
  console.error('Sitemap generation failed:', err.message);
  process.exit(1);
});
