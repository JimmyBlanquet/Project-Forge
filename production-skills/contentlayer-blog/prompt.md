# Contentlayer MDX Blog Skill

## Objective

Implement MDX blog with Contentlayer for:
- Type-safe content management
- Syntax highlighting
- Table of contents
- Multiple content types (blog, docs, guides)
- GitHub Flavored Markdown

## Prerequisites

1. ✅ Next.js 14+ with App Router
2. ✅ TypeScript configured

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add contentlayer2 next-contentlayer2
pnpm add rehype-autolink-headings rehype-pretty-code rehype-slug
pnpm add remark-gfm shiki
pnpm add mdast-util-toc unist-util-visit
```

### Step 2: Configure Next.js

**File: `next.config.js`**

```javascript
const { withContentlayer } = require("next-contentlayer2");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withContentlayer(nextConfig);
```

### Step 3: Create Contentlayer Config

**File: `contentlayer.config.ts`**

```typescript
import {
  ComputedFields,
  defineDocumentType,
  makeSource,
} from "contentlayer2/source-files";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const computedFields: ComputedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
};

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    published: {
      type: "boolean",
      default: true,
    },
    image: {
      type: "string",
    },
    authors: {
      type: "list",
      of: { type: "string" },
    },
  },
  computedFields,
}));

export const Doc = defineDocumentType(() => ({
  name: "Doc",
  filePathPattern: `docs/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    published: {
      type: "boolean",
      default: true,
    },
  },
  computedFields,
}));

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Doc, Page],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          onVisitLine(node) {
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className.push("line--highlighted");
          },
          onVisitHighlightedWord(node) {
            node.properties.className = ["word--highlighted"];
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ["anchor"],
            ariaLabel: "Link to section",
          },
        },
      ],
    ],
  },
});
```

### Step 4: Create Content Directory

```bash
mkdir -p content/blog content/docs content/pages
```

**Example blog post: `content/blog/first-post.mdx`**

```mdx
---
title: My First Post
description: This is my first blog post
date: 2024-01-18
published: true
authors: ["John Doe"]
---

# My First Post

This is **bold** and this is _italic_.

## Code Example

```typescript
function hello(name: string) {
  console.log(`Hello, ${name}!`);
}
```

## Lists

- Item 1
- Item 2
- Item 3
```

### Step 5: Setup TypeScript Config

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "contentlayer/generated": ["./.contentlayer/generated"]
    }
  },
  "include": [
    ".contentlayer/generated"
  ]
}
```

### Step 6: Generate Content

```bash
pnpm contentlayer build
```

This generates:
- `.contentlayer/generated/` with TypeScript types
- Type-safe exports: `allPosts`, `allDocs`, `allPages`

### Step 7: Create Blog Page

**File: `app/blog/page.tsx`**

```typescript
import { allPosts } from "contentlayer/generated";
import Link from "next/link";

export default function BlogPage() {
  const posts = allPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="grid gap-8">
        {posts.map((post) => (
          <article key={post._id} className="border-b pb-8">
            <Link href={post.slug}>
              <h2 className="text-2xl font-semibold mb-2 hover:underline">
                {post.title}
              </h2>
            </Link>
            {post.description && (
              <p className="text-muted-foreground mb-2">{post.description}</p>
            )}
            <time className="text-sm text-muted-foreground">
              {new Date(post.date).toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>
    </div>
  );
}
```

**File: `app/blog/[slug]/page.tsx`**

```typescript
import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import { Mdx } from "@/components/mdx-components";

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slugAsParams,
  }));
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = allPosts.find((post) => post.slugAsParams === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container py-10 prose dark:prose-invert max-w-3xl mx-auto">
      <h1>{post.title}</h1>
      {post.description && <p className="text-xl">{post.description}</p>}
      <time className="text-sm text-muted-foreground">
        {new Date(post.date).toLocaleDateString()}
      </time>

      <hr className="my-8" />

      <Mdx code={post.body.code} />
    </article>
  );
}
```

### Step 8: Create MDX Components

**File: `components/mdx-components.tsx`**

```typescript
import { useMDXComponent } from "next-contentlayer2/hooks";
import Image from "next/image";
import Link from "next/link";

const components = {
  Image,
  Link,
  h1: ({ ...props }) => (
    <h1 className="mt-8 scroll-m-20 text-4xl font-bold tracking-tight" {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className="mt-8 scroll-m-20 text-3xl font-semibold tracking-tight" {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight" {...props} />
  ),
  a: ({ href, ...props }: React.HTMLAttributes<HTMLAnchorElement> & { href?: string }) => (
    <Link href={href ?? ""} className="underline underline-offset-4" {...props} />
  ),
  code: ({ ...props }) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" {...props} />
  ),
};

export function Mdx({ code }: { code: string }) {
  const Component = useMDXComponent(code);

  return (
    <div className="mdx">
      <Component components={components} />
    </div>
  );
}
```

### Step 9: Add Syntax Highlighting Styles

**File: `styles/mdx.css`**

```css
.mdx {
  @apply prose prose-neutral dark:prose-invert max-w-none;
}

.mdx pre {
  @apply overflow-x-auto rounded-lg border bg-muted p-4;
}

.mdx code {
  @apply rounded bg-muted px-1 py-0.5;
}

.mdx pre code {
  @apply bg-transparent p-0;
}

.line--highlighted {
  @apply bg-muted-foreground/20;
}

.word--highlighted {
  @apply rounded-md bg-muted-foreground/20 p-1;
}
```

Import in `globals.css`:

```css
@import "./mdx.css";
```

## Usage Patterns

### Get All Posts

```typescript
import { allPosts } from "contentlayer/generated";

const posts = allPosts.filter((post) => post.published);
```

### Get Post by Slug

```typescript
const post = allPosts.find((post) => post.slugAsParams === slug);
```

### Sort by Date

```typescript
const sortedPosts = allPosts.sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
```

### Generate Static Params

```typescript
export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slugAsParams,
  }));
}
```

## Quality Gates

- ✅ Contentlayer generates types without errors
- ✅ MDX content renders correctly
- ✅ Syntax highlighting works
- ✅ Links and headings are auto-generated
- ✅ Build succeeds (`pnpm build`)

## Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "contentlayer build && next build",
    "contentlayer": "contentlayer build"
  }
}
```

## References

- Contentlayer: https://contentlayer.dev
- MDX: https://mdxjs.com
- Shiki: https://shiki.matsu.io
