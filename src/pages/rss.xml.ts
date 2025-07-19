import type { AstroGlobal } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import config from 'virtual:config';

const renderContent = async (post: CollectionEntry<'apps'>) => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(post.body);
  return String(file);
};

export const GET = async (context: AstroGlobal) => {
  const allItems = await getCollection('apps');
  
  const allItemsByDate = allItems.sort((a, b) => 
    new Date(b.data.publishDate ?? 0).getTime() - 
    new Date(a.data.publishDate ?? 0).getTime()
  );

  return rss({
    // 基础配置
    title: config.title,
    description: config.description,
    site: context.site?.toString() ?? import.meta.env.SITE,
    trailingSlash: false,
    xmlns: { h: 'http://www.w3.org/TR/html4/' },
    stylesheet: '/scripts/pretty-feed-v3.xsl',

    // 内容项
    items: await Promise.all(
      allItemsByDate.map(async (item) => ({
        title: item.data.title,
        description: item.data.description ?? '',
        pubDate: item.data.publishDate ?? new Date(),
        link: `/apps/${item.id}/`,
        content: await renderContent(item),
        customData: `
          ${item.data.tags?.length ? `<category>${item.data.tags.join(',')}</category>` : ''}
          ${item.data.draft ? '<status>Draft</status>' : ''}
        `
      }))
    )
  });
};