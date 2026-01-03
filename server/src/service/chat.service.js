import prisma from "../lib/db.js";

export class ChatService {
  /**
   * Create a new conversation
   * @param {string} userId
   * @param {string} mode
   * @param {string | null} title
   */
  async createConversation(userId, mode = "chat", title = null) {
    return prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} Conversation`,
      },
    });
  }

  /**
   * Get an existing conversation or create a new one
   * @param {string} userId
   * @param {string | null} conversationId
   * @param {string} mode
   */
  async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (conversation) {
        return conversation;
      }
    }

    return this.createConversation(userId, mode);
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId
   * @param {string} role
   * @param {string | object} content
   */
  async addMessage(conversationId, role, content) {
    return prisma.message.create({
      data: {
        conversationId,
        role,
        content:
          typeof content === "string" ? content : JSON.stringify(content),
      },
    });
  }

  /**
   * Get conversation messages
   * @param {string} conversationId
   */
  async getMessages(conversationId) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((msg) => ({
      ...msg,
      content: this.parseContent(msg.content),
    }));
  }

  /**
   * Get all conversations for a user
   * @param {string} userId
   */
  async getUserConversations(userId) {
    return prisma.conversation.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  /**
   * Delete a conversation for a user
   * @param {string} userId
   * @param {string} conversationId
   */
  async deleteConversation(userId, conversationId) {
    return prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }
  /**
   * Update the conversation title
   * @param {string} userId
   * @param {string} conversationId
   * @param {string} title
   */
  async updateTitle(userId, conversationId, title) {
    return prisma.conversation.updateMany({
      where: {
        id: conversationId,
        userId,
      },
      data: {
        title,
      },
    });
  }

  /**
   * Helper to parse content (JSON or string)
   * @param {string} content
   */
  parseContent(content) {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  /**
   * Format messages for the AI SDK
   * @param {Array} messages
   */
  formatMessagesForAI(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    }));
  }
}
