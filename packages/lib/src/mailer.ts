import nodemailer from "nodemailer";

import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const QQ_SMTP_HOST = "smtp.qq.com";
const QQ_SMTP_PORT = 465;

type QqSmtpConfig = {
  account: string;
  authCode: string;
  fromName: string;
};

function getQqSmtpConfig(): QqSmtpConfig | null {
  const account = process.env.SMTP_QQ_EMAIL?.trim().toLowerCase() ?? "";
  const authCode = process.env.SMTP_QQ_AUTH_CODE?.trim() ?? "";
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "xu-novel";

  if (!account || !authCode) return null;
  if (!account.endsWith("@qq.com")) {
    throw new Error("当前仅支持 QQ 邮箱 SMTP，请使用 @qq.com 发件邮箱。");
  }

  return {
    account,
    authCode,
    fromName,
  };
}

function getTransport() {
  const config = getQqSmtpConfig();
  if (!config) {
    throw new Error("未配置 QQ SMTP。请设置 SMTP_QQ_EMAIL 和 SMTP_QQ_AUTH_CODE。");
  }

  return {
    config,
    transport: nodemailer.createTransport({
      host: QQ_SMTP_HOST,
      port: QQ_SMTP_PORT,
      secure: true,
      auth: {
        user: config.account,
        pass: config.authCode,
      },
    }),
  };
}

function formatFromAddress(config: QqSmtpConfig) {
  const escapedName = config.fromName.replaceAll('"', "");
  return `${escapedName} <${config.account}>`;
}

export function isMailConfigured() {
  return Boolean(getQqSmtpConfig());
}

export async function sendRegisterVerificationEmail(params: {
  code: string;
  email: string;
  expiresInMinutes: number;
}) {
  const { config, transport } = getTransport();

  await transport.sendMail({
    from: formatFromAddress(config),
    to: params.email,
    subject: "xu-novel 注册验证码",
    text: [
      "你正在注册 xu-novel。",
      `验证码：${params.code}`,
      `验证码 ${params.expiresInMinutes} 分钟内有效，请勿泄露给他人。`,
    ].join("\n"),
    html: [
      "<div style=\"font-family:'PingFang SC','Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.7;color:#1c1917\">",
      "<h2 style=\"margin:0 0 16px\">xu-novel 注册验证码</h2>",
      "<p style=\"margin:0 0 12px\">你正在注册 xu-novel，请使用下面的验证码完成注册。</p>",
      `<p style="margin:16px 0;font-size:28px;font-weight:700;letter-spacing:0.35em;color:#b45309">${params.code}</p>`,
      `<p style="margin:0;color:#57534e">验证码 ${params.expiresInMinutes} 分钟内有效，请勿泄露给他人。</p>`,
      "</div>",
    ].join(""),
  });
}
