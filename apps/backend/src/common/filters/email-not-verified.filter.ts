import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { EmailNotVerifiedException } from "../../modules/auth/exceptions/email-not-verified.exception";

@Catch(EmailNotVerifiedException)
export class EmailNotVerifiedExceptionFilter implements ExceptionFilter {
  catch(exception: EmailNotVerifiedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();

    // EmailNotVerifiedException의 response 객체를 그대로 사용
    response.status(HttpStatus.FORBIDDEN).json(exceptionResponse);
  }
}
