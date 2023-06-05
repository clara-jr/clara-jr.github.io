import rss, { pagesGlobToRssItems } from '@astrojs/rss'

export async function get() {
  return rss({
    title: "Clara's Blog",
    description: "Clara's Blog",
    site: 'https://clara-jr.github.io',
    items: await pagesGlobToRssItems(import.meta.glob('./**/*.md*')),
    customData: `<language>es-es</language>`,
  })
}
