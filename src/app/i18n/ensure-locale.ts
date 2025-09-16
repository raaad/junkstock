/** Get the current locale from the first segment of the path, ensure that it's in the list of available ones, tweak baseHref to not affect routing */
export function ensureLocale<L extends string>(available: L[], byDefault: L, doc = document, loc = location): L {
  const base = doc.getElementsByTagName('base')?.[0];
  const baseHref = base?.getAttribute('href') ?? '';
  const locale = (loc.pathname.substring(baseHref.length).split('/').shift() ?? '') as L;
  return available.includes(locale) ? (base?.setAttribute('href', `${baseHref}${locale}/`), locale) : byDefault;
}
