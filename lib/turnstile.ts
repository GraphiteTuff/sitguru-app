export type TurnstileVerificationResult = {
  success: boolean;
  errorCodes: string[];
  action?: string;
  hostname?: string;
  challengeTs?: string;
  message?: string;
};

type CloudflareTurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
  hostname?: string;
  challenge_ts?: string;
};

type VerifyTurnstileTokenOptions = {
  token: string;
  remoteIp?: string | null;
  expectedAction?: string;
};

export async function verifyTurnstileToken({
  token,
  remoteIp,
  expectedAction,
}: VerifyTurnstileTokenOptions): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return {
      success: false,
      errorCodes: ["missing-secret-key"],
      message: "Turnstile secret key is not configured.",
    };
  }

  if (!token || !token.trim()) {
    return {
      success: false,
      errorCodes: ["missing-token"],
      message: "Turnstile token is missing.",
    };
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token.trim());

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );

    if (!response.ok) {
      return {
        success: false,
        errorCodes: [`http-${response.status}`],
        message: "Turnstile verification request failed.",
      };
    }

    const data = (await response.json()) as CloudflareTurnstileResponse;

    const result: TurnstileVerificationResult = {
      success: Boolean(data.success),
      errorCodes: data["error-codes"] || [],
      action: data.action,
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    };

    if (!result.success) {
      return {
        ...result,
        message: "Turnstile verification failed.",
      };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return {
        success: false,
        errorCodes: ["action-mismatch"],
        action: data.action,
        hostname: data.hostname,
        challengeTs: data.challenge_ts,
        message: "Turnstile action did not match the expected login action.",
      };
    }

    return result;
  } catch {
    return {
      success: false,
      errorCodes: ["verification-error"],
      message: "Turnstile verification could not be completed.",
    };
  }
}