// For static export, we need to return at least one path
// Since we can't know all possible transaction hashes at build time,
// we'll return an empty array which means no pages will be pre-rendered
export async function generateStaticParams() {
  return [];
}

// Set to false to return 404 for unknown dynamic routes
export const dynamicParams = false;
