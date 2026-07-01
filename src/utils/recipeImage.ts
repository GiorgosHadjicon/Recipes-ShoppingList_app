export function getRecipeImageUrl(title: string, width = 400, height = 300): string {
  const keywords = title
    .replace(/[^a-zA-Z\s]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(',');
  return `https://loremflickr.com/${width}/${height}/${keywords || 'food'}`;
}
