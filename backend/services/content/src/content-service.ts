import { PrismaClient, Prisma, ContentType, ContentStatus } from '@prisma/client';

export interface CreateContentInput {
  title: string;
  slug?: string;
  contentType: ContentType;
  status?: ContentStatus;
  excerpt?: string;
  content: string;
  rawContent?: any;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  category?: string;
  tags?: string[];
  featuredImage?: string;
  mediaIds?: string[];
  authorId: string;
  authorName: string;
  coAuthors?: string[];
  publishedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  isPublic?: boolean;
  allowComments?: boolean;
  language?: string;
}

export interface UpdateContentInput {
  title?: string;
  slug?: string;
  status?: ContentStatus;
  excerpt?: string;
  content?: string;
  rawContent?: any;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  category?: string;
  tags?: string[];
  featuredImage?: string;
  mediaIds?: string[];
  coAuthors?: string[];
  publishedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  isPublic?: boolean;
  allowComments?: boolean;
  language?: string;
}

export interface ContentFilters {
  contentType?: ContentType;
  status?: ContentStatus;
  authorId?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ContentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by appending a number if needed
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.content.findUnique({
        where: { slug },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Create a new content item
   */
  async createContent(input: CreateContentInput) {
    const {
      slug,
      status = 'DRAFT',
      version = 1,
      isPublic = true,
      allowComments = false,
      language = 'en',
      metaKeywords = [],
      tags = [],
      mediaIds = [],
      coAuthors = [],
      ...rest
    } = input;

    // Generate slug if not provided
    const baseSlug = slug || this.generateSlug(input.title);
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    // Set publishedAt if status is PUBLISHED
    const publishedAt = status === 'PUBLISHED' ? new Date() : input.publishedAt || null;

    const content = await this.prisma.content.create({
      data: {
        ...rest,
        slug: uniqueSlug,
        contentType: input.contentType,
        status,
        version: 1,
        excerpt: input.excerpt || null,
        content: input.content,
        rawContent: input.rawContent || null,
        metaTitle: input.metaTitle || null,
        metaDescription: input.metaDescription || null,
        metaKeywords,
        category: input.category || null,
        tags,
        featuredImage: input.featuredImage || null,
        mediaIds,
        authorId: input.authorId,
        authorName: input.authorName,
        coAuthors,
        publishedAt,
        scheduledAt: input.scheduledAt || null,
        expiresAt: input.expiresAt || null,
        isPublic,
        allowComments,
        language,
        viewCount: 0,
        likeCount: 0,
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    // Create initial version
    await this.prisma.contentVersion.create({
      data: {
        contentId: content.id,
        version: 1,
        title: content.title,
        content: content.content,
        excerpt: content.excerpt,
        authorId: content.authorId,
        authorName: content.authorName,
      },
    });

    return content;
  }

  /**
   * Get content by ID
   */
  async getContentById(id: string, userId?: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
        },
        media: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!content) return null;

    // Check access permissions
    if (!content.isPublic && content.authorId !== userId) {
      // Check if user is co-author or has editor/admin role
      if (!content.coAuthors.includes(userId || '')) {
        return null;
      }
    }

    return content;
  }

  /**
   * Get content by slug
   */
  async getContentBySlug(slug: string) {
    return await this.prisma.content.findUnique({
      where: { slug },
      include: {
        media: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * List content with filters
   */
  async listContent(filters: ContentFilters = {}) {
    const {
      contentType,
      status,
      authorId,
      category,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const where: Prisma.ContentWhereInput = {};

    if (contentType) {
      where.contentType = contentType;
    }

    if (status) {
      where.status = status;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          media: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update content
   */
  async updateContent(id: string, userId: string, input: UpdateContentInput) {
    // Check if content exists and user has permission
    const existing = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Content not found');
    }

    // Check permissions: author, co-author, or editor/admin
    const isAuthor = existing.authorId === userId;
    const isCoAuthor = existing.coAuthors.includes(userId);
    
    if (!isAuthor && !isCoAuthor) {
      // TODO: Check if user has editor/admin role
      throw new Error('Unauthorized: You do not have permission to edit this content');
    }

    // If slug is being updated, ensure it's unique
    let slug = input.slug || existing.slug;
    if (input.slug && input.slug !== existing.slug) {
      slug = await this.ensureUniqueSlug(input.slug, id);
    }

    // If title changed and no slug provided, regenerate slug
    if (input.title && input.title !== existing.title && !input.slug) {
      const newSlug = this.generateSlug(input.title);
      slug = await this.ensureUniqueSlug(newSlug, id);
    }

    // Increment version if content changed
    const contentChanged = input.content && input.content !== existing.content;
    const newVersion = contentChanged ? existing.version + 1 : existing.version;

    // Set publishedAt if status changed to PUBLISHED
    let publishedAt = existing.publishedAt;
    if (input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      publishedAt = new Date();
    } else if (input.status && input.status !== 'PUBLISHED') {
      publishedAt = null;
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        ...input,
        slug,
        version: newVersion,
        publishedAt,
        updatedAt: new Date(),
      },
    });

    // Create version snapshot if content changed
    if (contentChanged) {
      await this.prisma.contentVersion.create({
        data: {
          contentId: id,
          version: newVersion,
          title: updated.title,
          content: updated.content,
          excerpt: updated.excerpt,
          authorId: userId,
          authorName: existing.authorName, // Keep original author name
        },
      });
    }

    return updated;
  }

  /**
   * Publish content
   */
  async publishContent(id: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Check permissions
    const isAuthor = content.authorId === userId;
    const isCoAuthor = content.coAuthors.includes(userId);
    
    if (!isAuthor && !isCoAuthor) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.content.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Unpublish content
   */
  async unpublishContent(id: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Check permissions
    const isAuthor = content.authorId === userId;
    const isCoAuthor = content.coAuthors.includes(userId);
    
    if (!isAuthor && !isCoAuthor) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.content.update({
      where: { id },
      data: {
        status: 'DRAFT',
      },
    });
  }

  /**
   * Delete content
   */
  async deleteContent(id: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Only author or admin can delete
    if (content.authorId !== userId) {
      throw new Error('Unauthorized: Only the author can delete this content');
    }

    await this.prisma.content.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get content statistics
   */
  async getContentStats(authorId?: string) {
    const where: Prisma.ContentWhereInput = authorId ? { authorId } : {};

    const [total, published, draft, byType] = await Promise.all([
      this.prisma.content.count({ where }),
      this.prisma.content.count({ where: { ...where, status: 'PUBLISHED' } }),
      this.prisma.content.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.content.groupBy({
        by: ['contentType'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      published,
      draft,
      review: await this.prisma.content.count({ where: { ...where, status: 'REVIEW' } }),
      archived: await this.prisma.content.count({ where: { ...where, status: 'ARCHIVED' } }),
      byType: byType.reduce((acc, item) => {
        acc[item.contentType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get version history
   */
  async getVersionHistory(contentId: string) {
    return await this.prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Restore content to a specific version
   */
  async restoreVersion(contentId: string, version: number, userId: string) {
    const versionData = await this.prisma.contentVersion.findUnique({
      where: {
        contentId_version: {
          contentId,
          version,
        },
      },
    });

    if (!versionData) {
      throw new Error('Version not found');
    }

    // Check permissions
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    const isAuthor = content.authorId === userId;
    const isCoAuthor = content.coAuthors.includes(userId);
    
    if (!isAuthor && !isCoAuthor) {
      throw new Error('Unauthorized');
    }

    // Restore content
    const updated = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        title: versionData.title,
        content: versionData.content,
        excerpt: versionData.excerpt,
        version: content.version + 1,
      },
    });

    // Create new version snapshot
    await this.prisma.contentVersion.create({
      data: {
        contentId,
        version: updated.version,
        title: updated.title,
        content: updated.content,
        excerpt: updated.excerpt,
        authorId: userId,
        authorName: content.authorName,
      },
    });

    return updated;
  }
}

