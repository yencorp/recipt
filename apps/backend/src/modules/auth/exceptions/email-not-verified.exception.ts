import { UnauthorizedException } from "@nestjs/common";

export class EmailNotVerifiedException extends UnauthorizedException {
  constructor(email: string) {
    super({
      statusCode: 403,
      message:
        "이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해 주세요.",
      code: "EMAIL_NOT_VERIFIED",
      email,
    });
  }
}
