/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://www.eighthandswork.com",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  
  exclude: ["/admin/*", "/dashboard/*"], // বাদ দিতে চাও এমন রুট
  
  additionalPaths: async (config) => [
    await config.transform(config, "/privacy-policy"),
    await config.transform(config, "/terms-of-service"),
  ],

  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "Googlebot", disallow: ["/admin"] },
    ],
  },
};

export default config;
