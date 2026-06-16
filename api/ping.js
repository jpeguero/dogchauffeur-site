export default function handler(req, res) {
  // Trigger build to apply new Vercel environment variables
  return res.status(200).json({
    success: true,
    message: "Pawffeur API is live",
    timestamp: new Date().toISOString(),
  });
}
