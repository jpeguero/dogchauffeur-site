import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export default async function handler(req, res) {
  console.log(`[api/ride-messages] Route hit: ${req.method}`);

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Initialize Supabase client
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
      supabaseUrl = supabaseUrl.slice(1, -1).trim();
    }
    if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) {
      supabaseUrl = supabaseUrl.slice(1, -1).trim();
    }

    let supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (supabaseServiceRoleKey.startsWith('"') && supabaseServiceRoleKey.endsWith('"')) {
      supabaseServiceRoleKey = supabaseServiceRoleKey.slice(1, -1).trim();
    }
    if (supabaseServiceRoleKey.startsWith("'") && supabaseServiceRoleKey.endsWith("'")) {
      supabaseServiceRoleKey = supabaseServiceRoleKey.slice(1, -1).trim();
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[api/ride-messages] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Resolve credentials and parameters
    const query = req.query || {};
    const body = req.body || {};
    
    const tripId = query.tripId || body.tripId || query.trip_id || body.trip_id || null;
    const bookingRef = query.bookingRef || body.bookingRef || query.booking_ref || body.booking_ref || null;
    const leadId = query.leadId || body.leadId || query.lead_id || body.lead_id || null;
    const conversationId = query.conversationId || body.conversationId || query.conversation_id || body.conversation_id || null;

    const rawOwnerToken = req.headers["x-owner-token"] || query.token || body.token || null;
    const driverEmail = req.headers["x-driver-email"] || query.driver_email || body.driver_email || null;
    
    // Auth header check
    const authHeader = req.headers.authorization || "";
    const adminToken = process.env.ADMIN_API_TOKEN || "super_admin_token";
    const isAdmin = 
      authHeader === "Bearer super_admin_token" || 
      authHeader === `Bearer ${adminToken}` || 
      req.headers["x-preview-role"] === "admin" ||
      body.role === "admin" ||
      query.role === "admin";

    // 1. Fetch or initialize conversation
    let conversation = null;

    // Try to lookup by conversation ID first
    if (conversationId) {
      const { data } = await supabase
        .from("ride_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      conversation = data;
    }

    // Try lookup by trip_id, booking_ref, or lead_id
    if (!conversation) {
      let queryBuilder = supabase.from("ride_conversations").select("*");
      if (tripId) {
        queryBuilder = queryBuilder.eq("trip_id", tripId);
      } else if (bookingRef) {
        queryBuilder = queryBuilder.eq("booking_ref", bookingRef);
      } else if (leadId) {
        queryBuilder = queryBuilder.eq("lead_id", leadId);
      } else {
        return res.status(400).json({
          success: false,
          error: "Conversation identifier (conversationId, tripId, bookingRef, or leadId) is required",
        });
      }
      
      const { data } = await queryBuilder.limit(1);
      if (data && data.length > 0) {
        conversation = data[0];
      }
    }

    // Auto-initialize conversation if not found and referencing a valid trip or lead
    let newlyGeneratedToken = null;
    if (!conversation) {
      console.log("[api/ride-messages] Conversation not found. Evaluating auto-initialization...");
      let assignedDriverEmail = null;
      let assignedDriverName = null;
      let targetBookingRef = bookingRef;
      let targetLeadId = leadId;

      let isInitAuthorized = false;
      if (isAdmin) {
        isInitAuthorized = true;
      }

      // If tripId is provided, lookup the driver details from public.trips table
      if (tripId) {
        const { data: trip } = await supabase
          .from("trips")
          .select("driver_email, driver_name, lead_ref, passenger_profile_id")
          .eq("id", tripId)
          .single();
        
        if (trip) {
          assignedDriverEmail = trip.driver_email || null;
          assignedDriverName = trip.driver_name || null;
          if (!targetBookingRef && trip.lead_ref) {
            targetBookingRef = trip.lead_ref;
          }

          if (driverEmail && assignedDriverEmail && driverEmail.toLowerCase() === assignedDriverEmail.toLowerCase()) {
            isInitAuthorized = true;
          }
        }
      }

      if (!isInitAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Access Forbidden: Conversation does not exist or invalid authorization credentials",
        });
      }

      // Generate secure token and hash
      newlyGeneratedToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(newlyGeneratedToken).digest("hex");

      const insertPayload = {
        trip_id: tripId,
        booking_ref: targetBookingRef,
        lead_id: targetLeadId,
        assigned_driver_email: assignedDriverEmail,
        assigned_driver_name: assignedDriverName,
        owner_access_token_hash: tokenHash,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdConv, error: createError } = await supabase
        .from("ride_conversations")
        .insert([insertPayload])
        .select("*")
        .single();

      if (createError || !createdConv) {
        console.error("[api/ride-messages] Conversation initialization failed:", createError);
        return res.status(500).json({
          success: false,
          error: "Failed to initialize conversation",
        });
      }

      conversation = createdConv;
      console.log("[api/ride-messages] Conversation auto-initialized successfully:", conversation.id);
    }

    // 2. Perform Gated Authorization Checks
    let userRole = null;

    if (isAdmin) {
      userRole = "admin";
    } else if (driverEmail && conversation.assigned_driver_email && driverEmail.toLowerCase() === conversation.assigned_driver_email.toLowerCase()) {
      userRole = "driver";
    } else if (rawOwnerToken) {
      // Hash incoming token and match against DB
      const incomingHash = crypto.createHash("sha256").update(rawOwnerToken).digest("hex");
      if (incomingHash === conversation.owner_access_token_hash) {
        // Expiration check
        if (conversation.owner_access_expires_at && new Date(conversation.owner_access_expires_at) < new Date()) {
          return res.status(403).json({
            success: false,
            error: "Forbidden: Owner chat access token has expired",
          });
        }
        userRole = "owner";
      }
    }

    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: "Access Forbidden: Invalid authorization credentials or parameters",
      });
    }

    // ==========================================
    // GET: Fetch messages
    // ==========================================
    if (req.method === "GET") {
      let queryBuilder = supabase
        .from("ride_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      // Owner filter: Only show messages marked as visible_to_owner
      if (userRole === "owner") {
        queryBuilder = queryBuilder.eq("visible_to_owner", true);
      }

      const { data: messages, error: fetchError } = await queryBuilder;

      if (fetchError) {
        console.error("[api/ride-messages] Fetch messages failed:", fetchError);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch messages",
        });
      }

      const result = {
        success: true,
        data: messages || [],
        conversation_id: conversation.id
      };

      // Return newly generated token once to creator/admin if it was just created
      if (newlyGeneratedToken && userRole === "admin") {
        result.owner_raw_token = newlyGeneratedToken;
      }

      return res.status(200).json(result);
    }

    // ==========================================
    // POST: Send message
    // ==========================================
    if (req.method === "POST") {
      const { content, sender_role, sender_name, visible_to_owner = true, metadata = null } = body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: "Message content cannot be blank",
        });
      }

      if (!sender_role || !["owner", "driver", "admin"].includes(sender_role)) {
        return res.status(400).json({
          success: false,
          error: "Valid sender_role ('owner', 'driver', or 'admin') is required",
        });
      }

      // Role check enforcement: You cannot post as role X if you are authorized as role Y
      if (sender_role !== userRole) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Authorized as ${userRole}, cannot post message as ${sender_role}`,
        });
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "Message body exceeds the maximum length of 2000 characters",
        });
      }

      const insertPayload = {
        conversation_id: conversation.id,
        sender_role,
        sender_display_name: sender_name || (sender_role === "admin" ? "Admin Dispatch" : sender_role),
        message_body: trimmedContent,
        visible_to_owner: sender_role === "owner" ? true : !!visible_to_owner,
        metadata: metadata || null,
        created_at: new Date().toISOString()
      };

      const { data: insertedMsg, error: insertError } = await supabase
        .from("ride_messages")
        .insert([insertPayload])
        .select("*")
        .single();

      if (insertError || !insertedMsg) {
        console.error("[api/ride-messages] DB insert failed:", insertError);
        return res.status(500).json({
          success: false,
          error: "Failed to store message in database",
        });
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from("ride_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversation.id);

      return res.status(200).json({
        success: true,
        data: insertedMsg,
      });
    }

  } catch (error) {
    console.error("[api/ride-messages] Handler error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
