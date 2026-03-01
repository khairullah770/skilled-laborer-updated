const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const ServiceOffering = require("../models/ServiceOffering");
const JobRating = require("../models/JobRating");
const { calculateNewAverage } = require("../utils/ratingUtils");
const { sendPushNotification } = require("../utils/notificationService");

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name firstName lastName email phone")
      .populate({
        path: "laborer",
        select: "name email phone profileImage categories verificationHistory",
        populate: { path: "categories", select: "name" },
      })
      .sort({ createdAt: -1 });

    // Resolve laborer names from verificationHistory if main name is empty
    const results = bookings.map((b) => {
      const obj = b.toJSON();
      if (obj.laborer && !obj.laborer.name) {
        const history = obj.laborer.verificationHistory;
        if (Array.isArray(history) && history.length > 0) {
          const last = [...history].reverse().find((h) => h.submittedData);
          if (last && last.submittedData) {
            obj.laborer.name =
              last.submittedData.name || obj.laborer.email || "Unknown";
            if (!obj.laborer.profileImage && last.submittedData.profileImage) {
              obj.laborer.profileImage = last.submittedData.profileImage;
            }
          }
        }
      }
      // Resolve customer name fallback
      if (obj.customer && !obj.customer.name) {
        obj.customer.name =
          `${obj.customer.firstName || ""} ${obj.customer.lastName || ""}`.trim() ||
          obj.customer.email ||
          "Unknown";
      }
      return obj;
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a booking (Customer)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const customerId = req.customer?._id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const {
      laborerId,
      service,
      serviceDescription,
      scheduledAt,
      address,
      latitude,
      longitude,
      estimatedDurationMin,
      price,
      offeringId,
    } = req.body;

    if (!laborerId || !service || !scheduledAt || !address || price == null) {
      return res.status(400).json({
        message:
          "laborerId, service, scheduledAt, address and price are required",
      });
    }
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      return res
        .status(400)
        .json({ message: "scheduledAt must be a valid date" });
    }
    const laborer = await User.findById(laborerId).session(session);
    if (!laborer || laborer.role !== "laborer") {
      return res.status(404).json({ message: "Laborer not found" });
    }

    // Prevent duplicate active bookings for the same customer + laborer
    const existingActive = await Booking.findOne({
      customer: customerId,
      laborer: laborerId,
      status: { $in: ["Pending", "Accepted", "In Progress"] },
    }).session(session);

    if (existingActive) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(409).json({
        message: `You already have an active booking (${existingActive.status}) with this laborer. Please wait until it is completed, cancelled, or declined before creating a new one.`,
        existingBookingId: existingActive._id,
      });
    }

    let finalService = service;
    let finalPrice = Number(price);
    if (offeringId) {
      const offering = await ServiceOffering.findById(offeringId)
        .populate("subcategory", "name")
        .session(session);
      if (!offering || offering.laborer.toString() !== laborerId.toString()) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        return res
          .status(400)
          .json({ message: "Invalid service offering selected" });
      }
      finalService = offering.subcategory?.name || service;
      finalPrice = offering.price;
    }

    const [created] = await Booking.create(
      [
        {
          customer: customerId,
          laborer: laborerId,
          service: finalService,
          serviceDescription: serviceDescription || "",
          scheduledAt: when,
          location: { address, latitude, longitude },
          estimatedDurationMin:
            estimatedDurationMin != null ? Number(estimatedDurationMin) : 45,
          compensation: finalPrice,
          status: "Pending",
          log: [
            { action: "created", by: customerId, meta: { price: finalPrice } },
          ],
        },
      ],
      { session },
    );

    await Notification.create(
      [
        {
          recipient: laborerId,
          type: "job_request",
          title: "New Job Request",
          message: `New ${finalService} request scheduled`,
          data: {
            bookingId: created._id,
            customerId,
            service: finalService,
            serviceDescription: serviceDescription || "",
            scheduledAt: when,
            address,
            latitude,
            longitude,
            estimatedDurationMin:
              estimatedDurationMin != null ? Number(estimatedDurationMin) : 45,
            compensation: finalPrice,
          },
        },
      ],
      { session },
    );

    try {
      await sendPushNotification(
        laborerId,
        "New Job Request",
        `New ${finalService} request scheduled`,
      );
    } catch (pushErr) {
      console.error("Push notification failed for booking create:", pushErr);
    }

    await session.commitTransaction();
    session.endSession();
    const populated = await Booking.findById(created._id)
      .populate("customer", "name email profileImage")
      .populate("laborer", "name profileImage phone");
    res.status(201).json(populated || created);
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    res
      .status(400)
      .json({ message: error.message || "Failed to create booking" });
  }
};

// @desc    Get current customer's bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const principalId = req.customer?._id || req.user?._id;
    if (!principalId)
      return res.status(401).json({ message: "Not authorized" });
    const items = await Booking.find({ customer: principalId })
      .populate("laborer", "name profileImage phone")
      .sort({ scheduledAt: 1 });

    const normalize = (status) =>
      (status || "").toString().toLowerCase().trim();

    const classifyPending = (status) => {
      const s = normalize(status);
      return (
        s === "pending" ||
        s === "waiting for laborer approval" ||
        s === "waiting_for_laborer_approval" ||
        s === "waiting for approval"
      );
    };

    const isUpcoming = (status) => {
      const s = normalize(status);
      return (
        classifyPending(status) ||
        s === "accepted" ||
        s === "in progress" ||
        s === "rescheduled"
      );
    };

    const isPast = (status) => {
      const s = normalize(status);
      return s === "completed" || s === "cancelled";
    };

    const upcoming = items
      .filter((b) => isUpcoming(b.status))
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
    const past = items
      .filter((b) => isPast(b.status))
      .sort((a, b) => b.scheduledAt - a.scheduledAt);
    res.json({ upcoming, past });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current laborer's jobs
// @route   GET /api/bookings/laborer
// @access  Private
const getMyJobs = async (req, res) => {
  try {
    const items = await Booking.find({ laborer: req.user._id })
      .populate("customer", "name profileImage phone email")
      .sort({ scheduledAt: 1 });
    const upcoming = items.filter((b) =>
      ["Pending", "Accepted", "In Progress", "Rescheduled"].includes(b.status),
    );
    const completed = items.filter((b) => b.status === "Completed");
    res.json({ upcoming, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Laborer accepts booking
// @route   PUT /api/bookings/:id/accept
// @access  Private (Laborer)
const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.laborer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (booking.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be accepted" });
    }
    booking.status = "Accepted";
    booking.acceptedAt = new Date();
    booking.log.push({
      action: "accepted",
      by: req.user._id,
      meta: { at: booking.acceptedAt },
    });
    await booking.save();
    const laborerName = req.user.name || "your laborer";
    await Notification.create({
      recipient: booking.customer,
      type: "job_request",
      title: "Job Accepted",
      message: `Your job has been accepted by ${laborerName}`,
      data: {
        bookingId: booking._id,
        status: booking.status,
        laborerName,
        acceptedAt: booking.acceptedAt,
        service: booking.service,
        scheduledAt: booking.scheduledAt,
        address: booking.location?.address,
        compensation: booking.compensation,
      },
    });
    try {
      await sendPushNotification(
        booking.customer,
        "Job Accepted",
        `Your job has been accepted by ${laborerName}`,
      );
    } catch (pushErr) {
      console.error("Push notification failed for booking accept:", pushErr);
    }
    await booking.populate("customer", "name profileImage phone email");
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Laborer cancels booking
// @route   PUT /api/bookings/:id/decline
// @access  Private (Laborer)
const declineBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.laborer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (booking.status === "Completed" || booking.status === "Cancelled") {
      return res.status(400).json({
        message: "Completed or cancelled bookings cannot be cancelled again",
      });
    }
    booking.status = "Cancelled";
    booking.cancelledAt = new Date();
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    const meta = reason ? { reason } : {};
    booking.log.push({
      action: "cancelled_by_laborer",
      by: req.user._id,
      meta,
    });
    await booking.save();
    await Notification.create({
      recipient: booking.customer,
      type: "job_request",
      title: "Job Cancelled",
      message: "Your job has been cancelled by the laborer",
      data: {
        bookingId: booking._id,
        status: booking.status,
        reason: reason || undefined,
      },
    });
    try {
      await sendPushNotification(
        booking.customer,
        "Job Cancelled",
        "Your job has been cancelled by the laborer",
      );
    } catch (pushErr) {
      console.error("Push notification failed for booking decline:", pushErr);
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Laborer starts job (mark In Progress)
// @route   PUT /api/bookings/:id/start
// @access  Private (Laborer)
const startBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.laborer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status !== "Accepted") {
      return res
        .status(400)
        .json({ message: "Only accepted bookings can be started" });
    }
    booking.status = "In Progress";
    booking.startedAt = new Date();
    booking.log.push({
      action: "started",
      by: req.user._id,
      meta: { at: booking.startedAt },
    });
    await booking.save();
    const laborerName = req.user.name || "your laborer";
    await Notification.create({
      recipient: booking.customer,
      type: "job_request",
      title: "Job In Progress",
      message: `Your job has been started by ${laborerName}`,
      data: {
        bookingId: booking._id,
        status: booking.status,
        laborerName,
        startedAt: booking.startedAt,
        service: booking.service,
        scheduledAt: booking.scheduledAt,
        address: booking.location?.address,
        compensation: booking.compensation,
      },
    });
    try {
      await sendPushNotification(
        booking.customer,
        "Job In Progress",
        `Your job has been started by ${laborerName}`,
      );
    } catch (pushErr) {
      console.error("Push notification failed for booking start:", pushErr);
    }
    await booking.populate("customer", "name profileImage phone email");
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Laborer completes job (mark Completed and paid)
// @route   PUT /api/bookings/:id/complete
// @access  Private (Laborer)
const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.laborer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status !== "In Progress") {
      return res
        .status(400)
        .json({ message: "Only in-progress bookings can be completed" });
    }
    booking.status = "Completed";
    booking.paymentStatus = "Paid";
    booking.log.push({ action: "completed", by: req.user._id });
    await booking.save();

    // Deactivate the chat for this booking
    await Chat.updateOne(
      { booking: booking._id },
      { $set: { isActive: false } },
    );

    // Increment the laborer's completed jobs count
    await User.updateOne(
      { _id: booking.laborer },
      { $inc: { completedJobs: 1 } },
    );
    const laborerName = req.user.name || "your laborer";
    await Notification.create({
      recipient: booking.customer,
      type: "job_request",
      title: "Job Completed",
      message: `Your job has been completed by ${laborerName}`,
      data: {
        bookingId: booking._id,
        status: booking.status,
        laborerName,
        service: booking.service,
        scheduledAt: booking.scheduledAt,
        address: booking.location?.address,
        compensation: booking.compensation,
      },
    });
    try {
      await sendPushNotification(
        booking.customer,
        "Job Completed",
        `Your job has been completed by ${laborerName}`,
      );
    } catch (pushErr) {
      console.error("Push notification failed for booking complete:", pushErr);
    }
    await booking.populate("customer", "name profileImage phone email");
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const rateBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const principalId = req.customer?._id || req.user?._id;
    if (!principalId) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(401).json({ message: "Not authorized" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("customer", "firstName lastName name")
      .session(session);
    if (!booking) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingCustomerId = booking.customer?._id || booking.customer;
    if (
      !bookingCustomerId ||
      bookingCustomerId.toString() !== principalId.toString()
    ) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res
        .status(403)
        .json({ message: "Not authorized to rate this job" });
    }

    const statusNorm = (booking.status || "").toString().toLowerCase();
    if (statusNorm !== "completed") {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res
        .status(400)
        .json({ message: "Only completed jobs can be rated" });
    }

    const existing = await JobRating.findOne({
      booking: booking._id,
      customer: booking.customer,
    }).session(session);
    if (existing) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res
        .status(400)
        .json({ message: "You have already rated this job" });
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = await JobRating.findOne({
      customer: booking.customer,
      createdAt: { $gte: oneMinuteAgo },
    }).session(session);
    if (recent) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res
        .status(429)
        .json({ message: "You can only submit one rating per minute" });
    }

    const ratingRaw = Number(req.body.rating);
    if (!Number.isFinite(ratingRaw) || ratingRaw < 0.5 || ratingRaw > 5) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res
        .status(400)
        .json({ message: "Rating must be between 0.5 and 5" });
    }
    const ratingValue = Math.round(ratingRaw * 10) / 10;

    let comment = "";
    if (typeof req.body.comment === "string") {
      comment = req.body.comment.trim();
      if (comment && comment.length < 10) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        return res
          .status(400)
          .json({ message: "Comment must be at least 10 characters" });
      }
      if (comment.length > 500) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        return res
          .status(400)
          .json({ message: "Comment must be at most 500 characters" });
      }
      comment = comment.replace(/</g, "").replace(/>/g, "");
    }

    const stats = await JobRating.aggregate([
      { $match: { laborer: booking.laborer } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$rating" },
        },
      },
    ]).session(session);

    const prevCount = stats[0]?.count || 0;
    const prevTotal = stats[0]?.total || 0;

    const [ratingDoc] = await JobRating.create(
      [
        {
          booking: booking._id,
          laborer: booking.laborer,
          customer: booking.customer,
          rating: ratingValue,
          comment,
        },
      ],
      { session },
    );

    const avg = calculateNewAverage(prevTotal, prevCount, ratingValue);

    await User.updateOne(
      { _id: booking.laborer },
      { $set: { rating: avg } },
      { session },
    );

    const laborer = await User.findById(booking.laborer).session(session);

    const customerName =
      booking.customer.firstName ||
      (booking.customer.name
        ? booking.customer.name.split(" ")[0]
        : "Customer");

    await Notification.create(
      [
        {
          recipient: booking.laborer,
          type: "rating_received",
          title: "New Rating Received",
          message: `${customerName} rated you ${ratingValue} star${ratingValue === 1 ? "" : "s"}`,
          data: {
            bookingId: booking._id,
            rating: ratingValue,
            comment,
            customerName,
          },
        },
      ],
      { session },
    );

    let pushStatus = "skipped";
    try {
      if (!laborer || laborer.notificationsEnabled === false) {
        pushStatus = "disabled";
      } else {
        await sendPushNotification(
          booking.laborer,
          "New Rating Received",
          `${customerName} rated you ${ratingValue} star${ratingValue === 1 ? "" : "s"}`,
        );
        pushStatus = "sent";
      }
    } catch (pushErr) {
      pushStatus = "failed";
      console.error("Push notification failed for rating:", pushErr);
    }

    console.log(
      "Rating notification attempt",
      JSON.stringify({
        laborerId: booking.laborer.toString(),
        bookingId: booking._id.toString(),
        rating: ratingValue,
        status: pushStatus,
      }),
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      ratingId: ratingDoc._id,
      rating: ratingDoc.rating,
      comment: ratingDoc.comment,
      averageRating: avg,
      createdAt: ratingDoc.createdAt,
    });
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    if (error && error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already rated this job" });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get booking by id (authorized: customer, laborer or admin)
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name profileImage phone email")
      .populate("laborer", "name profileImage phone");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const uid = req.user?._id ? req.user._id.toString() : undefined;
    const cid = req.customer?._id ? req.customer._id.toString() : undefined;

    const customerId = booking.customer?._id
      ? booking.customer._id.toString()
      : undefined;
    const laborerId = booking.laborer?._id
      ? booking.laborer._id.toString()
      : undefined;

    const isCustomer = !!customerId && customerId === (cid || uid);
    const isLaborer = !!uid && !!laborerId && laborerId === uid;
    const isAdmin = !!req.user && req.user.role === "admin";

    if (!isCustomer && !isLaborer && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let myRating = null;
    if (isCustomer) {
      const ratingDoc = await JobRating.findOne({
        booking: booking._id,
        customer: booking.customer?._id,
      }).lean();
      if (ratingDoc) {
        myRating = {
          rating: ratingDoc.rating,
          comment: ratingDoc.comment || "",
          createdAt: ratingDoc.createdAt,
        };
      }
    }

    const payload = booking.toObject();
    if (myRating) {
      payload.myRating = myRating;
    }
    res.json(payload);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Customer cancels booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const principalId = req.customer?._id || req.user?._id;
    if (!principalId || booking.customer.toString() !== principalId.toString())
      return res.status(403).json({ message: "Not authorized" });
    const statusNorm = (booking.status || "").toString().toLowerCase();
    if (
      statusNorm === "accepted" ||
      statusNorm === "in progress" ||
      statusNorm === "completed"
    ) {
      return res.status(400).json({
        message: "Cannot cancel a booking that has been accepted or completed",
      });
    }

    // Send cancellation notification to the laborer
    await Notification.create({
      recipient: booking.laborer,
      type: "job_request",
      title: "Booking Cancelled",
      message: `A ${booking.service} booking was cancelled by the customer`,
      data: { bookingId: booking._id },
    });

    // If the booking was never approved (Pending/Rescheduled), delete it entirely
    if (
      statusNorm === "pending" ||
      statusNorm === "rescheduled" ||
      statusNorm === "waiting for laborer approval" ||
      statusNorm === "waiting_for_laborer_approval"
    ) {
      await Booking.findByIdAndDelete(booking._id);
      return res.json({
        message: "Booking cancelled and removed",
        deleted: true,
      });
    }

    // Fallback: mark as Cancelled for any other pre-accepted status
    booking.status = "Cancelled";
    booking.log.push({ action: "cancelled", by: principalId });
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Customer reschedules booking
// @route   PUT /api/bookings/:id/reschedule
// @access  Private (Customer)
const rescheduleBooking = async (req, res) => {
  try {
    const { scheduledAt, address, latitude, longitude } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const principalId = req.customer?._id || req.user?._id;
    if (!principalId || booking.customer.toString() !== principalId.toString())
      return res.status(403).json({ message: "Not authorized" });
    const statusNorm = (booking.status || "").toString().toLowerCase();
    if (
      statusNorm === "accepted" ||
      statusNorm === "in progress" ||
      statusNorm === "completed"
    ) {
      return res.status(400).json({
        message:
          "Cannot reschedule a booking that has been accepted or completed",
      });
    }
    if (scheduledAt) booking.scheduledAt = new Date(scheduledAt);
    if (address) booking.location.address = address;
    if (latitude != null) booking.location.latitude = latitude;
    if (longitude != null) booking.location.longitude = longitude;
    booking.status = "Rescheduled";
    booking.log.push({
      action: "rescheduled",
      by: principalId,
      meta: { scheduledAt },
    });
    await booking.save();
    await Notification.create({
      recipient: booking.laborer,
      type: "job_request",
      title: "Booking Rescheduled",
      message: `A ${booking.service} booking was rescheduled`,
      data: { bookingId: booking._id, scheduledAt: booking.scheduledAt },
    });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @route   GET /api/bookings/check-accepted/:laborerId
 * @desc    Check if the current customer has an accepted (or in-progress / completed) booking with a laborer
 * @access  Private (customer)
 */
const checkAcceptedBooking = async (req, res) => {
  try {
    const customerId = req.customer?._id || req.user?._id;
    if (!customerId) return res.status(401).json({ hasAcceptedBooking: false });

    const booking = await Booking.findOne({
      customer: customerId,
      laborer: req.params.laborerId,
      status: { $in: ["Accepted", "In Progress", "Completed"] },
    })
      .select("_id status")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      hasAcceptedBooking: !!booking,
      bookingId: booking?._id || null,
      bookingStatus: booking?.status || null,
    });
  } catch (err) {
    console.error("[checkAcceptedBooking]", err);
    return res.status(500).json({ hasAcceptedBooking: false });
  }
};

/**
 * @route   POST /api/bookings/:id/photos
 * @desc    Attach work photos uploaded by customer to a booking
 * @access  Private (customer)
 */
const uploadBookingPhotos = async (req, res) => {
  try {
    const customerId = req.customer?._id || req.user?._id;
    if (!customerId) return res.status(401).json({ message: "Not authorized" });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the booking owner can upload photos
    if (booking.customer.toString() !== customerId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    booking.workPhotos.push(...urls);
    await booking.save();

    return res.json({ workPhotos: booking.workPhotos });
  } catch (err) {
    console.error("[uploadBookingPhotos]", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBookings,
  updateBookingStatus,
  createBooking,
  getMyBookings,
  getMyJobs,
  acceptBooking,
  declineBooking,
  startBooking,
  completeBooking,
  rateBooking,
  cancelBooking,
  rescheduleBooking,
  getBookingById,
  checkAcceptedBooking,
  uploadBookingPhotos,
};
