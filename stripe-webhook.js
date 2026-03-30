const https = require("https");
const crypto = require("crypto");

// Environment variables (set in Netlify dashboard)
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FIREBASE_DB_URL = "https://poolside-pro-ca6c6-default-rtdb.firebaseio.com";
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

// ── Minimal JWT for Firebase REST API (no npm dependencies) ──────────
function base64url(data) {
  return Buffer.from(data).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
  }));
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(FIREBASE_PRIVATE_KEY, "base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${payload}.${signature}`;
}

async function getAccessToken() {
  const jwt = createJWT();
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "oauth2.googleapis.com", path: "/token", method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data).access_token); }
        catch (e) { reject(new Error("Token parse error: " + data)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function firebasePut(path, data, token) {
  const jsonBody = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const url = new URL(`${FIREBASE_DB_URL}/${path}.json`);
    const req = https.request({
      hostname: url.hostname, path: `${url.pathname}?access_token=${token}`, method: "PUT",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(jsonBody) },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.write(jsonBody);
    req.end();
  });
}

// ── Stripe signature verification ────────────────────────────────────
function verifyStripeSignature(payload, sigHeader) {
  const parts = {};
  sigHeader.split(",").forEach((item) => {
    const [key, val] = item.split("=");
    parts[key.trim()] = val;
  });
  const timestamp = parts.t;
  const signature = parts.v1;
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", STRIPE_WEBHOOK_SECRET).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ── Main handler ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Verify Stripe signature
  const sig = event.headers["stripe-signature"];
  if (!sig) return { statusCode: 400, body: "No signature" };

  try {
    const isValid = verifyStripeSignature(event.body, sig);
    if (!isValid) return { statusCode: 400, body: "Invalid signature" };
  } catch (e) {
    console.error("Signature verification failed:", e.message);
    return { statusCode: 400, body: "Signature error" };
  }

  const stripeEvent = JSON.parse(event.body);
  console.log("Stripe event:", stripeEvent.type);

  // Handle checkout completion
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const customerEmail = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total; // in cents

    if (!customerEmail) {
      console.error("No customer email in session");
      return { statusCode: 200, body: "No email, skipped" };
    }

    // Determine tier: check if the product name contains "elite", otherwise check amount
    // Payment link metadata or product name is the most reliable
    const displayItems = session.display_items || [];
    const lineDescription = (session.metadata?.tier || "").toLowerCase();
    const isElitePayment = amountTotal >= 3900 || amountTotal >= 14900 
      || lineDescription.includes("elite");
    
    let tier = isElitePayment ? "elite" : "pro";
    
    // If someone is upgrading from Pro to Elite, the amount might be the difference ($20 or $150)
    // Always upgrade if any Elite payment comes through for this user
    const emailKey = customerEmail.replace(/\./g, ",").replace(/@/g, "_at_");

    try {
      const token = await getAccessToken();
      
      // Check existing subscription to handle upgrades
      const existingData = await new Promise((resolve, reject) => {
        const url = new URL(`${FIREBASE_DB_URL}/subscriptions/${emailKey}.json`);
        https.get(`${url.href}?access_token=${token}`, (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(null); } });
        }).on("error", reject);
      });

      // If they already have elite, don't downgrade
      if (existingData?.tier === "elite" && tier === "pro") {
        console.log(`User ${customerEmail} already elite, skipping pro payment`);
        return { statusCode: 200, body: "Already elite" };
      }

      const subscriptionData = {
        tier,
        email: customerEmail,
        stripeSessionId: session.id,
        stripeCustomerId: session.customer,
        subscribedAt: Date.now(),
        upgradedAt: existingData ? Date.now() : null,
        previousTier: existingData?.tier || null,
        active: true,
      };

      await firebasePut(`subscriptions/${emailKey}`, subscriptionData, token);
      console.log(`✅ Subscription recorded: ${customerEmail} → ${tier}${existingData ? ` (upgraded from ${existingData.tier})` : ""}`);
    } catch (e) {
      console.error("Firebase write failed:", e.message);
      return { statusCode: 500, body: "Firebase error" };
    }
  }

  // Handle subscription cancellation
  if (stripeEvent.type === "customer.subscription.deleted") {
    const subscription = stripeEvent.data.object;
    // We'd need the email — for now log it
    console.log("Subscription cancelled:", subscription.id);
  }

  return { statusCode: 200, body: "OK" };
};
