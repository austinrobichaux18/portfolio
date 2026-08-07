import {defineSecret} from "firebase-functions/params";
import {onRequest} from "firebase-functions/v2/https";
import {Resend} from "resend";
import {setGlobalOptions} from "firebase-functions";
import cors from "cors";

setGlobalOptions({
  maxInstances: 10,
});

const resendApiKey = defineSecret("RESEND_API_KEY");

const turnstileSecret = defineSecret("TURNSTILE_SECRET");

const corsHandler = cors({
  origin: true,
});

export const sendContactEmail = onRequest(
  {
    secrets: [resendApiKey, turnstileSecret],
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const {name, email, company, message, token} = req.body;

        if (!token) {
          res.status(400).json({
            error: "Missing Turnstile token",
          });

          return;
        }

        const verificationResponse = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },

            body: `secret=${turnstileSecret.value()}&response=${token}`,
          },
        );

        const verification = await verificationResponse.json();

        if (!verification.success) {
          res.status(403).json({
            error: "Turnstile verification failed",
          });

          return;
        }

        const resend = new Resend(resendApiKey.value());

        await resend.emails.send({
          from: "onboarding@resend.dev",

          to: "austinrobichaux18+MyWebsitePortfolioForm@gmail.com",

          subject: `Portfolio Contact - ${name}`,

          html: `
                    <h2>New Portfolio Contact</h2>

                    <p>
                        <strong>Name:</strong>
                        ${name}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${email}
                    </p>

                    <p>
                        <strong>Company:</strong>
                        ${company ?? "Not provided"}
                    </p>

                    <p>
                        <strong>Message:</strong>
                    </p>

                    <p>
                        ${message}
                    </p>
                    `,
        });

        res.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Contact email failed:", error);

        res.status(500).json({
          error: "Failed to send email",
        });
      }
    });
  },
);
