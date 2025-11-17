import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>("SMTP_HOST"),
        port: this.configService.get<number>("SMTP_PORT"),
        secure: this.configService.get<boolean>("SMTP_SECURE", false),
        auth: {
          user: this.configService.get<string>("SMTP_USER"),
          pass: this.configService.get<string>("SMTP_PASSWORD"),
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.logger.log("Email transporter created successfully");
    } catch (error) {
      this.logger.error("Failed to create email transporter", error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from = this.configService.get<string>(
        "EMAIL_FROM",
        "noreply@recipt-system.com"
      );

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000"
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이메일 인증</title>
  <style>
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0ea5e9;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background-color: #0ea5e9;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: #0284c7;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 15px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ 광남동성당 예결산 관리 시스템</h1>
    </div>

    <div class="content">
      <p><strong>${name}</strong>님, 안녕하세요!</p>

      <p>광남동성당 청소년위원회 예결산 관리 시스템에 가입해 주셔서 감사합니다.</p>

      <p>아래 버튼을 클릭하여 이메일 주소를 인증해 주세요:</p>

      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">이메일 인증하기</a>
      </div>

      <p style="font-size: 14px; color: #666;">
        버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:<br>
        <a href="${verificationUrl}" style="word-break: break-all;">${verificationUrl}</a>
      </p>

      <div class="warning">
        ⚠️ <strong>보안 안내:</strong><br>
        • 이 링크는 24시간 동안 유효합니다.<br>
        • 본인이 가입하지 않았다면 이 이메일을 무시해 주세요.<br>
        • 다른 사람과 이 링크를 공유하지 마세요.
      </div>
    </div>

    <div class="footer">
      <p>광남동성당 청소년위원회<br>
      이 이메일은 자동으로 발송되었습니다. 회신하지 말아 주세요.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${name}님, 안녕하세요!

광남동성당 청소년위원회 예결산 관리 시스템에 가입해 주셔서 감사합니다.

아래 링크를 클릭하여 이메일 주소를 인증해 주세요:
${verificationUrl}

이 링크는 24시간 동안 유효합니다.
본인이 가입하지 않았다면 이 이메일을 무시해 주세요.

광남동성당 청소년위원회
    `;

    return this.sendEmail({
      to: email,
      subject: "[광남동성당] 이메일 인증을 완료해 주세요",
      html,
      text,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000"
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정</title>
  <style>
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0ea5e9;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background-color: #ef4444;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: #dc2626;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
    .warning {
      background-color: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 12px;
      margin: 15px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ 광남동성당 예결산 관리 시스템</h1>
    </div>

    <div class="content">
      <p><strong>${name}</strong>님, 안녕하세요!</p>

      <p>비밀번호 재설정 요청을 받았습니다.</p>

      <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해 주세요:</p>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
      </div>

      <p style="font-size: 14px; color: #666;">
        버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:<br>
        <a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a>
      </p>

      <div class="warning">
        ⚠️ <strong>보안 안내:</strong><br>
        • 이 링크는 1시간 동안 유효합니다.<br>
        • 본인이 요청하지 않았다면 이 이메일을 무시하고 즉시 관리자에게 연락해 주세요.<br>
        • 다른 사람과 이 링크를 공유하지 마세요.
      </div>
    </div>

    <div class="footer">
      <p>광남동성당 청소년위원회<br>
      이 이메일은 자동으로 발송되었습니다. 회신하지 말아 주세요.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${name}님, 안녕하세요!

비밀번호 재설정 요청을 받았습니다.

아래 링크를 클릭하여 새로운 비밀번호를 설정해 주세요:
${resetUrl}

이 링크는 1시간 동안 유효합니다.
본인이 요청하지 않았다면 이 이메일을 무시하고 즉시 관리자에게 연락해 주세요.

광남동성당 청소년위원회
    `;

    return this.sendEmail({
      to: email,
      subject: "[광남동성당] 비밀번호 재설정 요청",
      html,
      text,
    });
  }
}
