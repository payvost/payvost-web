
export type ArticleStatus = 'Published' | 'Draft' | 'Archived';

export interface ArticleVersion {
    version: number;
    content: string;
    author: string;
    date: string; // ISO 8601
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  content: string; // The current, published content
  category: string;
  tags: string[];
  status: ArticleStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  author: string;
  versionHistory: ArticleVersion[];
}
