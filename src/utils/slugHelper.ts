export function generateSlug(name: string, existingSlugs: string[] = []): string {
  if (!name) return 'hotel';
  let base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  
  if (!base) base = 'hotel';

  let slug = base;
  let counter = 2;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}
