import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, any>;
}

export interface EmailJob {
  id: string;
  options: EmailOptions;
  status: "PENDING" | "SENDING" | "SENT" | "FAILED";
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private emailQueue: Map<string, EmailJob> = new Map();
  private processing: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
    this.startQueueProcessor();
  }

  // 이메일 전송 설정 초기화
  private initializeTransporter() {
    const host = this.configService.get<string>("SMTP_HOST") || "smtp.gmail.com";
    const port = this.configService.get<number>("SMTP_PORT") || 587;
    const secure = this.configService.get<boolean>("SMTP_SECURE") || false;
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    console.log(`Email service initialized (${host}:${port})`);
  }

  // 이메일 전송 큐에 추가
  async sendEmail(options: EmailOptions): Promise<EmailJob> {
    const jobId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const job: EmailJob = {
      id: jobId,
      options,
      status: "PENDING",
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.emailQueue.set(jobId, job);
    console.log(`Email queued: ${jobId} to ${options.to}`);

    return job;
  }

  // 큐 프로세서 시작
  private async startQueueProcessor() {
    if (this.processing) return;

    this.processing = true;
    console.log("Email queue processor started");

    while (this.processing) {
      try {
        const nextJob = this.getNextQueueJob();

        if (nextJob) {
          await this.processEmailJob(nextJob);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error("Email queue processor error:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  // 다음 처리할 작업 가져오기
  private getNextQueueJob(): EmailJob | null {
    const pendingJobs = Array.from(this.emailQueue.values()).filter(
      (job) => job.status === "PENDING"
    );

    if (pendingJobs.length === 0) return null;

    // 생성 시간 순으로 정렬
    pendingJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return pendingJobs[0];
  }

  // 이메일 작업 처리
  private async processEmailJob(job: EmailJob): Promise<void> {
    job.status = "SENDING";
    job.attempts++;
    this.emailQueue.set(job.id, job);

    console.log(`Sending email: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

    try {
      const html = this.renderTemplate(job.options.template, job.options.context);

      const mailOptions = {
        from: this.configService.get<string>("SMTP_FROM") || "noreply@recipt.app",
        to: Array.isArray(job.options.to) ? job.options.to.join(", ") : job.options.to,
        subject: job.options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);

      job.status = "SENT";
      job.sentAt = new Date();
      this.emailQueue.set(job.id, job);

      console.log(`Email sent successfully: ${job.id}`);
    } catch (error) {
      console.error(`Email sending failed for ${job.id}:`, error.message);

      if (job.attempts < job.maxAttempts) {
        job.status = "PENDING";
        this.emailQueue.set(job.id, job);
        console.log(`Will retry ${job.id} (${job.maxAttempts - job.attempts} attempts remaining)`);
      } else {
        job.status = "FAILED";
        job.error = error.message;
        this.emailQueue.set(job.id, job);
        console.error(`Email sending permanently failed: ${job.id}`);
      }
    }
  }

  // 템플릿 렌더링
  private renderTemplate(template: string, context?: Record<string, any>): string {
    const templates = {
      welcome: this.welcomeTemplate,
      passwordReset: this.passwordResetTemplate,
      eventNotification: this.eventNotificationTemplate,
      budgetApproval: this.budgetApprovalTemplate,
      settlementComplete: this.settlementCompleteTemplate,
    };

    const templateFn = templates[template] || this.defaultTemplate;
    return templateFn(context || {});
  }

  // 템플릿 함수들
  private welcomeTemplate(context: Record<string, any>): string {
    return `
      <h1>환영합니다, ${context.name}님!</h1>
      <p>Recipt에 가입해 주셔서 감사합니다.</p>
      <p>이제 단체 재무 관리를 효율적으로 시작할 수 있습니다.</p>
    `;
  }

  private passwordResetTemplate(context: Record<string, any>): string {
    return `
      <h1>비밀번호 재설정</h1>
      <p>안녕하세요, ${context.name}님</p>
      <p>비밀번호 재설정을 요청하셨습니다.</p>
      <p><a href="${context.resetLink}">여기를 클릭하여 비밀번호를 재설정하세요</a></p>
      <p>이 링크는 1시간 동안 유효합니다.</p>
    `;
  }

  private eventNotificationTemplate(context: Record<string, any>): string {
    return `
      <h1>새로운 행사 알림</h1>
      <p>${context.eventTitle} 행사가 등록되었습니다.</p>
      <p>일시: ${context.eventDate}</p>
      <p>장소: ${context.location}</p>
    `;
  }

  private budgetApprovalTemplate(context: Record<string, any>): string {
    return `
      <h1>예산서 승인 요청</h1>
      <p>${context.eventTitle}의 예산서가 검토를 기다리고 있습니다.</p>
      <p>총 예산: ${context.totalBudget}원</p>
      <p><a href="${context.approvalLink}">예산서 검토하기</a></p>
    `;
  }

  private settlementCompleteTemplate(context: Record<string, any>): string {
    return `
      <h1>결산서 완료</h1>
      <p>${context.eventTitle}의 결산이 완료되었습니다.</p>
      <p>총 수입: ${context.totalIncome}원</p>
      <p>총 지출: ${context.totalExpense}원</p>
      <p>순액: ${context.netAmount}원</p>
    `;
  }

  private defaultTemplate(context: Record<string, any>): string {
    return `
      <h1>${context.title || "알림"}</h1>
      <p>${context.message || "새로운 알림이 있습니다."}</p>
    `;
  }

  // 이메일 작업 상태 조회
  getEmailJobStatus(jobId: string): EmailJob | null {
    return this.emailQueue.get(jobId) || null;
  }

  // 큐 통계
  getQueueStats() {
    const jobs = Array.from(this.emailQueue.values());

    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "PENDING").length,
      sending: jobs.filter((j) => j.status === "SENDING").length,
      sent: jobs.filter((j) => j.status === "SENT").length,
      failed: jobs.filter((j) => j.status === "FAILED").length,
    };
  }
}
