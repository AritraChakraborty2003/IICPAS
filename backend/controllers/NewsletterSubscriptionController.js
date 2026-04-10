import NewsletterSubscription from "../models/NewsletterSubscription.js";
import EmailCampaign from "../models/EmailCampaign.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Subscribe to newsletter
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email, name, phone, source = "newsletter" } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    // Check if email already exists
    const existingSubscription = await NewsletterSubscription.findOne({ email: email.toLowerCase() });
    
    if (existingSubscription) {
      if (existingSubscription.status === "unsubscribed") {
        // Reactivate subscription
        existingSubscription.status = "active";
        existingSubscription.subscribedAt = new Date();
        existingSubscription.unsubscribedAt = undefined;
        if (name) existingSubscription.name = name;
        if (phone) existingSubscription.phone = phone;
        existingSubscription.source = source;
        existingSubscription.ipAddress = req.ip;
        existingSubscription.userAgent = req.get('User-Agent');
        await existingSubscription.save();
        
        return res.status(200).json({
          success: true,
          message: "Welcome back! You've been resubscribed to our newsletter.",
          subscription: existingSubscription
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "This email is already subscribed to our newsletter."
        });
      }
    }

    // Create new subscription
    const subscription = new NewsletterSubscription({
      email: email.toLowerCase(),
      name: name || "",
      phone: phone || "",
      source: source,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to newsletter!",
      subscription: {
        email: subscription.email,
        subscribedAt: subscription.subscribedAt
      }
    });

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe to newsletter. Please try again."
    });
  }
};

// Get all subscriptions (admin only)
export const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const subscriptions = await NewsletterSubscription
      .find(filter)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NewsletterSubscription.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions"
    });
  }
};

// Get subscription stats (admin only)
export const getSubscriptionStats = async (req, res) => {
  try {
    const total = await NewsletterSubscription.countDocuments();
    const active = await NewsletterSubscription.countDocuments({ status: "active" });
    const unsubscribed = await NewsletterSubscription.countDocuments({ status: "unsubscribed" });
    const bounced = await NewsletterSubscription.countDocuments({ status: "bounced" });

    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await NewsletterSubscription.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo }
    });

    // Get subscriptions by source
    const bySource = await NewsletterSubscription.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        unsubscribed,
        bounced,
        recent,
        bySource
      }
    });

  } catch (error) {
    console.error("Get subscription stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription stats"
    });
  }
};

// Update subscription status (admin only)
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const subscription = await NewsletterSubscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    subscription.status = status;
    if (notes) subscription.notes = notes;
    
    if (status === "unsubscribed") {
      subscription.unsubscribedAt = new Date();
    } else if (status === "active") {
      subscription.unsubscribedAt = undefined;
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription status updated successfully",
      subscription
    });

  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription"
    });
  }
};

// Unsubscribe from newsletter
export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const subscription = await NewsletterSubscription.findOne({ 
      email: email.toLowerCase() 
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Email not found in our subscription list"
      });
    }

    if (subscription.status === "unsubscribed") {
      return res.status(400).json({
        success: false,
        message: "Email is already unsubscribed"
      });
    }

    subscription.status = "unsubscribed";
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from newsletter"
    });

  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsubscribe"
    });
  }
};

// Delete subscription (admin only)
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await NewsletterSubscription.findByIdAndDelete(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully"
    });

  } catch (error) {
    console.error("Delete subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete subscription"
    });
  }
};

// Email sending utility
const sendEmail = async (to, subject, html, trackingId = null) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Add tracking pixel if trackingId is provided
  if (trackingId) {
    const trackingPixel = `<img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/track-email/${trackingId}" width="1" height="1" style="display:none;" />`;
    html += trackingPixel;
  }

  await transporter.sendMail({
    from: `"IICPA Institute" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// Create and send bulk email campaign (admin only)
export const sendBulkEmail = async (req, res) => {
  try {
    const { 
      title, 
      subject, 
      content, 
      htmlContent, 
      targetAudience = "all", 
      customFilters = {},
      template = "newsletter",
      scheduledAt 
    } = req.body;

    if (!title || !subject || !content || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, content, and HTML content are required"
      });
    }

    // Get target subscribers based on audience
    let filter = {};
    
    switch (targetAudience) {
      case "active":
        filter.status = "active";
        break;
      case "recent":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filter.subscribedAt = { $gte: thirtyDaysAgo };
        filter.status = "active";
        break;
      case "custom":
        if (customFilters.status) filter.status = { $in: customFilters.status };
        if (customFilters.source) filter.source = { $in: customFilters.source };
        if (customFilters.tags) filter.tags = { $in: customFilters.tags };
        if (customFilters.subscribedAfter) filter.subscribedAt = { $gte: new Date(customFilters.subscribedAfter) };
        if (customFilters.subscribedBefore) filter.subscribedAt = { ...filter.subscribedAt, $lte: new Date(customFilters.subscribedBefore) };
        break;
      default: // "all"
        filter.status = "active";
    }

    const subscribers = await NewsletterSubscription.find(filter);
    
    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subscribers found for the selected criteria"
      });
    }

    // Create email campaign
    const campaign = new EmailCampaign({
      title,
      subject,
      content,
      htmlContent,
      sender: req.user.id,
      targetAudience,
      customFilters,
      template,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? "scheduled" : "draft",
      recipients: subscribers.map(sub => ({
        email: sub.email,
        name: sub.name,
        trackingId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
      stats: {
        totalRecipients: subscribers.length
      }
    });

    await campaign.save();

    // If not scheduled, send immediately
    if (!scheduledAt) {
      campaign.status = "sending";
      await campaign.save();

      // Send emails in batches to avoid overwhelming the email service
      const batchSize = 10;
      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        const emailPromises = batch.map(async (subscriber, index) => {
          const recipientIndex = i + index;
          const recipient = campaign.recipients[recipientIndex];
          
          try {
            await sendEmail(
              subscriber.email, 
              subject, 
              htmlContent, 
              recipient.trackingId
            );
            
            recipient.status = "sent";
            recipient.sentAt = new Date();
            sentCount++;
            
          } catch (error) {
            console.error(`Failed to send email to ${subscriber.email}:`, error);
            recipient.status = "failed";
            recipient.errorMessage = error.message;
            failedCount++;
          }
        });

        await Promise.all(emailPromises);
        
        // Update campaign stats
        campaign.stats.sent = sentCount;
        campaign.stats.failed = failedCount;
        await campaign.save();

        // Small delay between batches
        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      campaign.status = "sent";
      campaign.sentAt = new Date();
      await campaign.save();
    }

    res.status(201).json({
      success: true,
      message: scheduledAt ? "Email campaign scheduled successfully" : "Bulk email sent successfully",
      campaign: {
        id: campaign._id,
        title: campaign.title,
        subject: campaign.subject,
        status: campaign.status,
        totalRecipients: campaign.stats.totalRecipients,
        sent: campaign.stats.sent,
        failed: campaign.stats.failed,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt
      }
    });

  } catch (error) {
    console.error("Send bulk email error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send bulk email"
    });
  }
};

// Get email campaigns (admin only)
export const getEmailCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;

    const campaigns = await EmailCampaign
      .find(filter)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmailCampaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error("Get email campaigns error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email campaigns"
    });
  }
};

// Get email campaign details (admin only)
export const getEmailCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await EmailCampaign
      .findById(id)
      .populate('sender', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Email campaign not found"
      });
    }

    res.status(200).json({
      success: true,
      campaign
    });

  } catch (error) {
    console.error("Get email campaign details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email campaign details"
    });
  }
};

// Track email open (public endpoint)
export const trackEmailOpen = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const campaign = await EmailCampaign.findOne({
      "recipients.trackingId": trackingId
    });

    if (!campaign) {
      return res.status(404).send("Tracking not found");
    }

    const recipient = campaign.recipients.find(r => r.trackingId === trackingId);
    if (recipient && recipient.status === "sent") {
      recipient.status = "opened";
      recipient.openedAt = new Date();
      campaign.stats.opened = (campaign.stats.opened || 0) + 1;
      await campaign.save();
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    
    res.send(pixel);

  } catch (error) {
    console.error("Track email open error:", error);
    res.status(500).send("Error");
  }
};
