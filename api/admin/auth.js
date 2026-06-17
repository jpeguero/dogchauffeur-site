export default async function handler(req, res) {
  console.log("[admin-auth] Request hit");
  
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("[admin-auth] Configuration error: ADMIN_PASSWORD environment variable is missing.");
      return res.status(500).json({
        success: false,
        error: "Authentication server configuration error"
      });
    }

    if (password === adminPassword) {
      const apiToken = process.env.ADMIN_API_TOKEN;
      if (!apiToken) {
        console.error("[admin-auth] Configuration error: ADMIN_API_TOKEN environment variable is missing.");
        return res.status(500).json({
          success: false,
          error: "Authentication server configuration error"
        });
      }
      console.log("[admin-auth] Password validated successfully");
      return res.status(200).json({
        success: true,
        token: apiToken
      });
    } else {
      console.log("[admin-auth] Invalid password attempt");
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }
  } catch (error) {
    console.error("[admin-auth] Fatal error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: error.message
    });
  }
}
