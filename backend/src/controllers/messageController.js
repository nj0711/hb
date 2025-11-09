// backend/controllers/messageController.js
import Message from "../models/Message.js";
import Property from "../models/Property.js";
import User from "../models/User.js";

/**
 * ✅ Send a message
 */
export const sendMessage = async (req, res) => {
  try {
    const { receiver, property, message } = req.body;

    const sender = await User.findById(req.user.id);
    const receiverUser = await User.findById(receiver);

    if (!receiverUser) {
      return res.status(404).json({ success: false, error: "Receiver not found" });
    }

    // ---- RULES ----
    // Rule 1: Client ↔ Admin
    if (
      (sender.role === "client" && receiverUser.role === "admin") ||
      (sender.role === "admin" && receiverUser.role === "client")
    ) {
      // allowed
    }

    // Rule 2: Owner ↔ Admin
    else if (
      (sender.role === "property_owner" && receiverUser.role === "admin") ||
      (sender.role === "admin" && receiverUser.role === "property_owner")
    ) {
      // allowed
    }

    // Rule 3: Client ↔ Owner (property optional now)
    else if (
      (sender.role === "client" && receiverUser.role === "property_owner") ||
      (sender.role === "property_owner" && receiverUser.role === "client")
    ) {
      if (property) {
        // if propertyId provided, verify ownership
        const propertyData = await Property.findById(property);
        if (
          !propertyData ||
          propertyData.owner.toString() !==
            (sender.role === "property_owner"
              ? sender._id.toString()
              : receiverUser._id.toString())
        ) {
          return res.status(403).json({
            success: false,
            error: "This owner does not own the specified property",
          });
        }
        req.body.property = property;
      } else {
        // ✅ allow free chat without property
        req.body.property = null;
      }
    }

    // Rule 4: Forbidden
    else {
      return res.status(403).json({ success: false, error: "Messaging not allowed" });
    }

    // ✅ Save message
    const newMessage = new Message({
      sender: sender._id,
      receiver,
      property: req.body.property || null,
      message,
      isRead: false,
    });

    await newMessage.save();

    const populated = await newMessage.populate([
      { path: "sender", select: "name role" },
      { path: "receiver", select: "name role" },
    ]);

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("SendMessage error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ✅ Get conversation between logged-in user and another user
 */
export const getConversation = async (req, res) => {
  try {
    const userId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort("createdAt");

    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ✅ Admin: get all conversations grouped by users (with unread count)
 */
export const getAdminConversations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can view this" });
    }

    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .populate("sender", "name role email")
      .populate("receiver", "name role email")
      .sort("-createdAt");

    const conversations = {};
    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === req.user.id ? msg.receiver : msg.sender;

      if (!conversations[otherUser._id]) {
        conversations[otherUser._id] = {
          user: otherUser,
          lastMessage: msg.message,
          lastAt: msg.createdAt,
          unread: 0,
        };
      }

      if (msg.receiver._id.toString() === req.user.id && !msg.isRead) {
        conversations[otherUser._id].unread += 1;
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ Client/Owner: get all conversations grouped by users (with unread count)
 */
export const getUserConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .populate("sender", "name role email")
      .populate("receiver", "name role email")
      .sort("-createdAt");

    const conversations = {};
    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === req.user.id ? msg.receiver : msg.sender;

      if (!conversations[otherUser._id]) {
        conversations[otherUser._id] = {
          user: otherUser,
          lastMessage: msg.message,
          lastAt: msg.createdAt,
          unread: 0,
        };
      }

      if (msg.receiver._id.toString() === req.user.id && !msg.isRead) {
        conversations[otherUser._id].unread += 1;
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ Mark all messages from userId as read
 */
export const markMessagesRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { sender: userId, receiver: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
