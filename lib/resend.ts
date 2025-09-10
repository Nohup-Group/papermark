import { JSXElementConstructor, ReactElement } from "react";

import { render } from "@react-email/components";
import { Resend } from "resend";

import { log, nanoid } from "@/lib/utils";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const sendEmail = async ({
  to,
  subject,
  react,
  from,
  marketing,
  system,
  verify,
  test,
  cc,
  replyTo,
  scheduledAt,
  unsubscribeUrl,
}: {
  to: string;
  subject: string;
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  from?: string;
  marketing?: boolean;
  system?: boolean;
  verify?: boolean;
  test?: boolean;
  cc?: string | string[];
  replyTo?: string;
  scheduledAt?: string;
  unsubscribeUrl?: string;
}) => {
  if (!resend) {
    // Throw an error if resend is not initialized
    throw new Error("Resend not initialized");
  }

  const plainText = await render(react, { plainText: true });

  // Determine default FROM address with environment overrides for self-hosting
  // Priority: explicit `from` param > RESEND_FROM > EMAIL_FROM > NEXTAUTH_EMAIL_FROM > AUTH_EMAIL_FROM
  const envFrom =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    process.env.NEXTAUTH_EMAIL_FROM ||
    process.env.AUTH_EMAIL_FROM;

  const fromAddress =
    from ??
    envFrom ??
    (marketing
      ? "Marc from Papermark <marc@ship.papermark.io>"
      : system
        ? "Papermark <system@papermark.io>"
        : verify
          ? "Papermark <system@verify.papermark.io>"
          : !!scheduledAt
            ? "Marc Seitz <marc@papermark.io>"
            : "Marc from Papermark <marc@papermark.io>");

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: test ? "delivered@resend.dev" : to,
      cc: cc,
      // Prefer provided replyTo, else optional env override, else undefined
      replyTo: replyTo || process.env.RESEND_REPLY_TO || undefined,
      subject,
      react,
      scheduledAt,
      text: plainText,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
        ...(unsubscribeUrl ? { "List-Unsubscribe": unsubscribeUrl } : {}),
      },
    });

    // Check if the email sending operation returned an error and throw it
    if (error) {
      log({
        message: `Resend returned error when sending email: ${error.name} \n\n ${error.message}`,
        type: "error",
        mention: true,
      });
      throw error;
    }

    // If there's no error, return the data
    return data;
  } catch (exception) {
    // Log and rethrow any caught exceptions for upstream handling
    log({
      message: `Unexpected error when sending email: ${exception}`,
      type: "error",
      mention: true,
    });
    throw exception; // Rethrow the caught exception
  }
};
