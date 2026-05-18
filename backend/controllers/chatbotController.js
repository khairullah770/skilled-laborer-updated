const ChatbotConversation = require("../models/ChatbotConversation");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const ServiceOffering = require("../models/ServiceOffering");
const Booking = require("../models/Booking");
const User = require("../models/User");

/* ─────────────────────────────────────────────────────────
 *  OpenRouter helper – free models via OpenAI-compatible API
 *  Set OPENROUTER_API_KEY in your .env
 *  Get a key at: https://openrouter.ai/keys
 * ───────────────────────────────────────────────────────── */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Keep model list short for faster failover.
const OPENROUTER_MODELS = [
  "stepfun/step-3.5-flash:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

const CATALOG_CACHE_TTL_MS = 2 * 60 * 1000;
let serviceCatalogCache = {
  expiresAt: 0,
  categoryInfo: "",
  serviceIndex: [],
};

async function callGemini(systemPrompt, conversationHistory, retries = 1) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Some free models don't support system role — prepend system prompt as user context
  const userPreamble = `[INSTRUCTIONS]\n${systemPrompt}\n[END INSTRUCTIONS]\n\n`;
  const history = conversationHistory.map((msg, i) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content:
      i === 0 && msg.role === "user" ? userPreamble + msg.content : msg.content,
  }));

  // If conversation has no user message yet (shouldn't happen), add preamble
  const messagesWithSystem = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
  ];

  // Try each model in the fallback chain
  for (const model of OPENROUTER_MODELS) {
    // Use system role for most models, but fall back to user-preamble for Gemma/others that reject it
    const messages = messagesWithSystem;

    const body = {
      model,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024,
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Skilled Labor App",
          },
          signal: controller.signal,
          body: JSON.stringify(body),
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const text =
            data?.choices?.[0]?.message?.content ||
            "Sorry, I could not process that request. Please try again.";
          console.log(`Chatbot response via model: ${model}`);
          return text;
        }

        if (res.status === 429) {
          console.warn(`${model} rate limited, trying next model...`);
          continue;
        }

        // 401 = auth error, no point trying other models
        if (res.status === 401) {
          const errBody = await res.text();
          console.error(`OpenRouter auth error (401): ${errBody}`);
          throw new Error(
            "OpenRouter API key is invalid or expired. Please update OPENROUTER_API_KEY in your .env file. Get a new key at https://openrouter.ai/keys",
          );
        }

        // 404 = model unavailable, skip to next
        if (res.status === 404) {
          console.warn(`${model} not available, trying next model...`);
          break;
        }

        // 400 = likely doesn't support system instructions → retry with user-preamble
        if (res.status === 400 && body.messages === messagesWithSystem) {
          console.warn(
            `${model} rejected system role, retrying with user-preamble...`,
          );
          body.messages = history;
          continue;
        }

        const errData = await res.text();
        console.error(`OpenRouter error (${model}):`, res.status, errData);
        break;
      } catch (fetchErr) {
        if (fetchErr?.name === "AbortError") {
          console.warn(
            `OpenRouter timeout (${model}), trying next attempt/model...`,
          );
          continue;
        }
        console.error(`Fetch error (${model}):`, fetchErr.message);
        break;
      }
    }
  }

  throw new Error(
    "All AI models are currently unavailable. Please try again in a moment.",
  );
}

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAnyPhrase = (query, phrases = []) =>
  phrases.some((phrase) => query.includes(normalizeText(phrase)));

const buildGenericAppSupportReply = () =>
  "I can help with app-related support: booking steps, booking status, pricing ranges, payment status, laborer availability, location updates, and in-app chat. Ask me a specific question like 'How do I cancel a booking?' or 'What is my latest booking status?' for an exact answer.";

const isAppSupportQuestion = (query) => {
  const appKeywords = [
    "book",
    "booking",
    "status",
    "price",
    "cost",
    "payment",
    "paid",
    "cancel",
    "reschedule",
    "laborer",
    "service",
    "category",
    "availability",
    "online",
    "offline",
    "location",
    "chat",
    "message",
    "account",
    "profile",
    "verification",
    "support",
    "app",
  ];
  return appKeywords.some((keyword) => query.includes(keyword));
};

async function getServiceCatalogContext() {
  const now = Date.now();
  if (serviceCatalogCache.expiresAt > now) {
    return serviceCatalogCache;
  }

  const categories = await Category.find().select("name").lean();
  const subcategories = await Subcategory.find()
    .select("name minPrice maxPrice category")
    .lean();

  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(String(cat._id), {
      name: cat.name,
      services: [],
    });
  }

  const serviceIndex = [];
  for (const sub of subcategories) {
    const categoryId = String(sub.category || "");
    const bucket = categoryMap.get(categoryId);
    const priceLabel =
      Number.isFinite(sub.minPrice) && Number.isFinite(sub.maxPrice)
        ? `Rs ${sub.minPrice}-${sub.maxPrice}`
        : "Price on request";

    if (bucket) {
      bucket.services.push(`${sub.name} (${priceLabel})`);
    }

    serviceIndex.push({
      name: sub.name,
      normalizedName: normalizeText(sub.name),
      minPrice: sub.minPrice,
      maxPrice: sub.maxPrice,
      categoryName: bucket?.name || "General",
    });
  }

  const lines = [...categoryMap.values()].map(
    (c) => `• ${c.name}: ${c.services.join(", ") || "No services listed"}`,
  );

  serviceCatalogCache = {
    expiresAt: now + CATALOG_CACHE_TTL_MS,
    categoryInfo:
      lines.join("\n") || "Service information is temporarily unavailable.",
    serviceIndex,
  };

  return serviceCatalogCache;
}

async function buildInstantReply(userMessage, customerId) {
  const query = normalizeText(userMessage);
  const { categoryInfo, serviceIndex } = await getServiceCatalogContext();

  const asksServices = hasAnyPhrase(query, [
    "what services",
    "services do you offer",
    "which services",
    "service list",
    "what can i book",
  ]);

  if (asksServices) {
    return `We currently offer these service groups:\n${categoryInfo}\n\nYou can open any category on the home screen to see available laborers and exact pricing ranges.`;
  }

  const asksBookingFlow = hasAnyPhrase(query, [
    "how do i book",
    "book a laborer",
    "how to book",
    "booking process",
    "how can i place booking",
  ]);

  if (asksBookingFlow) {
    return "To book a laborer: 1) Open Home, 2) Select category and subcategory, 3) Choose a laborer, 4) Pick date/time and confirm. You can also chat with the laborer before confirming.";
  }

  const asksStatus = hasAnyPhrase(query, [
    "booking status",
    "my booking",
    "recent booking",
    "latest booking",
    "where is my booking",
  ]);

  if (asksStatus) {
    const recentBookings = await Booking.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (!recentBookings.length) {
      return "You don't have any recent bookings yet. Go to Home, choose a service, and create your first booking.";
    }

    const lines = recentBookings.map(
      (b) => `- ${b.service}: ${b.status} (Rs ${b.compensation || "N/A"})`,
    );
    return `Here are your latest bookings:\n${lines.join("\n")}`;
  }

  const asksPrice =
    query.includes("price") ||
    query.includes("cost") ||
    query.includes("charges");
  if (asksPrice) {
    const matched = serviceIndex.find((s) => query.includes(s.normalizedName));
    if (
      matched &&
      Number.isFinite(matched.minPrice) &&
      Number.isFinite(matched.maxPrice)
    ) {
      return `${matched.name} usually ranges around Rs ${matched.minPrice}-${matched.maxPrice} in ${matched.categoryName}. Actual cost may vary by job complexity and location.`;
    }
    return "Pricing depends on the selected subcategory and laborer. Open a service to view the current min/max price range before booking.";
  }

  const asksPayment = hasAnyPhrase(query, [
    "payment",
    "paid",
    "bill",
    "invoice",
    "who confirms payment",
  ]);
  if (asksPayment) {
    return "Payment updates after job completion. In this app flow, laborer confirmation and booking completion update payment state to customers/admin. You can check payment status in booking details.";
  }

  const asksAvailability = hasAnyPhrase(query, [
    "availability",
    "online",
    "offline",
    "go online",
  ]);
  if (asksAvailability) {
    return "Laborers can only go Online after adding a valid current location (latitude, longitude, and address). Customers see laborers based on availability and location filters.";
  }

  const asksLocation = hasAnyPhrase(query, [
    "set location",
    "update location",
    "current location",
    "share location",
  ]);
  if (asksLocation) {
    return "To update location: go to your home screen, open location edit, pin/search your place, and save. Accurate location helps with nearby laborer matching and job routing.";
  }

  const asksCancelOrReschedule = hasAnyPhrase(query, [
    "cancel booking",
    "reschedule",
    "change booking time",
  ]);
  if (asksCancelOrReschedule) {
    return "Open Bookings, select the target booking, and use available actions for cancel/reschedule based on current status. If action is unavailable, contact support from the app.";
  }

  if (isAppSupportQuestion(query)) {
    return buildGenericAppSupportReply();
  }

  return null;
}

/* ─────────────────────────────────────────────────────────
 *  Build a system prompt that gives the AI full context
 * ───────────────────────────────────────────────────────── */
async function buildSystemPrompt(customer, extraContext = {}) {
  let categoryInfo = "Service information is temporarily unavailable.";
  try {
    const catalog = await getServiceCatalogContext();
    categoryInfo = catalog.categoryInfo;
  } catch {}

  // Fetch recent bookings for context
  let bookingInfo = "";
  try {
    const recentBookings = await Booking.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("laborer", "name rating")
      .lean();

    if (recentBookings.length > 0) {
      bookingInfo = recentBookings
        .map(
          (b) =>
            `- ${b.service} | Status: ${b.status} | Rs ${b.compensation} | Laborer: ${b.laborer?.name || "N/A"}`,
        )
        .join("\n");
    } else {
      bookingInfo = "No previous bookings.";
    }
  } catch {
    bookingInfo = "Booking history unavailable.";
  }

  // Location
  const loc = extraContext.location || customer.currentLocation;
  const locationStr = loc?.address
    ? `${loc.address}`
    : loc?.latitude
      ? `Lat: ${loc.latitude}, Lng: ${loc.longitude}`
      : "Not set";

  return `You are a helpful AI assistant for the "Skilled Labor" mobile app — a platform that connects customers with verified skilled laborers (plumbers, electricians, carpenters, painters, AC technicians, etc.) in Pakistan.

Your name is "Skilled Labor Assistant". Be friendly, concise, and helpful. Use simple English or Urdu-Roman if the user writes in Urdu. Keep replies under 150 words unless more detail is needed.

CUSTOMER CONTEXT:
- Name: ${customer.firstName || customer.name || "Customer"}
- Location: ${locationStr}
- Recent Bookings:
${bookingInfo}

AVAILABLE SERVICES (Category: Services):
${categoryInfo}

CAPABILITIES — You can help with:
1. Finding the right service category or laborer for a task
2. Answering questions about service pricing (min/max ranges)
3. Explaining how to book a laborer
4. Providing booking status updates from their recent history
5. Suggesting nearby laborers based on the customer's location
6. General home maintenance tips and advice

BOOKING GUIDANCE:
- To book: Select a category → choose a subcategory → pick a laborer → set date/time → confirm
- Laborers shown are filtered by distance, rating, price, and availability
- Customers can message laborers before booking via the in-app chat

IMPORTANT RULES:
- Never make up laborer names, prices, or availability — only reference real data provided above
- If you don't know something specific, direct them to browse the app or contact support
- Do not discuss topics unrelated to home services, repairs, or the app
- Be respectful and professional at all times
- When suggesting a service, mention the price range if available`;
}

/* ─────────────────────────────────────────────────────────
 *  Controller: Send a message to the chatbot
 *  POST /api/chatbot/message
 * ───────────────────────────────────────────────────────── */
const sendMessage = async (req, res) => {
  try {
    const customer = req.customer;
    if (!customer) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { message, context } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const userMessage = message.trim().slice(0, 2000); // Limit input length

    // Find or create active conversation
    let conversation = await ChatbotConversation.findOne({
      customer: customer._id,
      isActive: true,
    });

    if (!conversation) {
      conversation = await ChatbotConversation.create({
        customer: customer._id,
        messages: [],
        context: context || {},
      });
    }

    // Update context if provided
    if (context) {
      if (context.location) conversation.context.location = context.location;
      if (context.lastCategory)
        conversation.context.lastCategory = context.lastCategory;
      if (context.lastSubcategory)
        conversation.context.lastSubcategory = context.lastSubcategory;
    }

    // Add user message
    conversation.messages.push({ role: "user", content: userMessage });

    // Keep only last 20 messages for context window
    const recentMessages = conversation.messages.slice(-20);

    // Fast path for common app-specific questions.
    let instantReply = null;
    try {
      instantReply = await buildInstantReply(userMessage, customer._id);
    } catch (instantErr) {
      console.error(
        "Instant chatbot reply error:",
        instantErr.message || instantErr,
      );
      instantReply = buildGenericAppSupportReply();
    }
    if (instantReply) {
      conversation.messages.push({ role: "assistant", content: instantReply });
      if (conversation.messages.length > 50) {
        conversation.messages = conversation.messages.slice(-50);
      }
      await conversation.save();

      return res.json({
        reply: instantReply,
        conversationId: conversation._id,
      });
    }

    // Build system prompt with full context
    const systemPrompt = await buildSystemPrompt(customer, {
      location: conversation.context.location,
    });

    // Call API
    let aiReply;
    try {
      aiReply = await callGemini(systemPrompt, recentMessages);
      if (!aiReply || !String(aiReply).trim()) {
        aiReply = buildGenericAppSupportReply();
      }
    } catch (aiError) {
      console.error("AI call failed:", aiError.message);
      if (aiError.message.includes("rate limit")) {
        aiReply =
          "I'm receiving a lot of requests right now. Please wait about 30 seconds and try again. In the meantime, you can browse services from the home screen! 🙂";
      } else if (aiError.message.toLowerCase().includes("timeout")) {
        aiReply =
          "The assistant is taking too long right now. Please try again in a few seconds, or browse services directly while I reconnect.";
      } else {
        aiReply =
          "I'm having trouble connecting right now. Please try again in a moment, or browse our services directly from the home screen.";
      }
    }

    if (!aiReply || !String(aiReply).trim()) {
      aiReply = buildGenericAppSupportReply();
    }

    // Add assistant reply
    conversation.messages.push({ role: "assistant", content: aiReply });

    // Trim stored messages to 50 max to keep DB lean
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50);
    }

    await conversation.save();

    res.json({
      reply: aiReply,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Chatbot sendMessage error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
 *  Controller: Get chat history
 *  GET /api/chatbot/history
 * ───────────────────────────────────────────────────────── */
const getHistory = async (req, res) => {
  try {
    const customer = req.customer;
    if (!customer) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const conversation = await ChatbotConversation.findOne({
      customer: customer._id,
      isActive: true,
    });

    if (!conversation) {
      return res.json({ messages: [] });
    }

    res.json({
      conversationId: conversation._id,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    });
  } catch (error) {
    console.error("Chatbot getHistory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
 *  Controller: Clear / reset conversation
 *  DELETE /api/chatbot/history
 * ───────────────────────────────────────────────────────── */
const clearHistory = async (req, res) => {
  try {
    const customer = req.customer;
    if (!customer) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await ChatbotConversation.updateMany(
      { customer: customer._id, isActive: true },
      { $set: { isActive: false } },
    );

    res.json({ message: "Conversation cleared" });
  } catch (error) {
    console.error("Chatbot clearHistory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
 *  Controller: Get quick suggestions
 *  GET /api/chatbot/suggestions
 * ───────────────────────────────────────────────────────── */
const getSuggestions = async (req, res) => {
  try {
    const customer = req.customer;

    const suggestions = [
      "What services do you offer?",
      "Find me a plumber nearby",
      "How do I book a laborer?",
      "Show my recent bookings",
    ];

    // Add contextual suggestions based on recent activity
    try {
      const lastBooking = await Booking.findOne({ customer: customer._id })
        .sort({ createdAt: -1 })
        .lean();

      if (lastBooking) {
        if (
          lastBooking.status === "Pending" ||
          lastBooking.status === "Accepted"
        ) {
          suggestions.unshift(
            `What's the status of my ${lastBooking.service} booking?`,
          );
        }
        if (lastBooking.status === "Completed") {
          suggestions.push(`Book ${lastBooking.service} again`);
        }
      }
    } catch {}

    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
  getSuggestions,
};
