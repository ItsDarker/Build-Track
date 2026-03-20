import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../config/prisma";

const router = Router();

/**
 * GET /api/support/tickets
 * List tickets for the current user
 */
router.get("/tickets", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).user?.userId ?? (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    res.json({ tickets });
  } catch (err) {
    console.error("List tickets error:", err);
    res.status(500).json({ error: "Failed to list tickets" });
  }
});

/**
 * POST /api/support/tickets
 * Create a new ticket
 */
router.post("/tickets", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).user?.userId ?? (req as any).user?.id;
    const { subject, description, priority = "MEDIUM" } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: "Subject and description are required" });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        description,
        priority,
        userId,
        status: "OPEN",
        messages: {
          create: {
            content: description,
            authorId: userId,
            isAdmin: false,
          },
        },
      },
    });

    res.status(201).json({ ticket });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

/**
 * GET /api/support/tickets/:id
 * Get ticket details and messages
 */
router.get("/tickets/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId ?? (req as any).user?.id;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.userId !== userId) {
      // Check if user is admin (optional, for now strictly user-owned)
      // return res.status(403).json({ error: "Access denied" });
    }

    res.json({ ticket });
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ error: "Failed to get ticket" });
  }
});

/**
 * POST /api/support/tickets/:id/messages
 * Add a message to a ticket
 */
router.post("/tickets/:id/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId ?? (req as any).user?.id;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "Content is required" });

    const message = await prisma.supportMessage.create({
      data: {
        content,
        ticketId: id,
        authorId: userId,
        isAdmin: false, // Default to false for user replies
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error("Add message error:", err);
    res.status(500).json({ error: "Failed to add message" });
  }
});

export default router;
