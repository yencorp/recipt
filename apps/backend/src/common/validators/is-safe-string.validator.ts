import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * XSS 방지를 위한 안전한 문자열 검증
 * HTML 태그, 스크립트 등을 포함하지 않는지 확인
 */
export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isSafeString",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;

          // HTML 태그 패턴
          const htmlPattern = /<[^>]*>/g;
          if (htmlPattern.test(value)) return false;

          // 스크립트 패턴
          const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
          if (scriptPattern.test(value)) return false;

          // 이벤트 핸들러 패턴
          const eventPattern = /on\w+\s*=/gi;
          if (eventPattern.test(value)) return false;

          // Javascript 프로토콜
          const jsProtocol = /javascript:/gi;
          if (jsProtocol.test(value)) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}에 잘못된 문자가 포함되어 있습니다. HTML 태그나 스크립트를 사용할 수 없습니다.`;
        },
      },
    });
  };
}
