import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * 한국 전화번호 형식 검증
 * 010-1234-5678, 02-1234-5678, 031-123-4567 등
 */
export function IsKoreanPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isKoreanPhone",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;

          // 한국 전화번호 패턴
          // 010-XXXX-XXXX, 02-XXX-XXXX, 031-XXX-XXXX 등
          const phonePattern = /^(01[016789]|02|0[3-9]{1}[0-9]{1})-?[0-9]{3,4}-?[0-9]{4}$/;

          return phonePattern.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}는 올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)`;
        },
      },
    });
  };
}
