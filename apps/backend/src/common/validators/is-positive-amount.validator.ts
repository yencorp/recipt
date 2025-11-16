import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * 양수 금액 검증
 * 재무 관련 금액이 0보다 크고 합리적인 범위인지 확인
 */
export function IsPositiveAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isPositiveAmount",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const num = Number(value);

          // 숫자 변환 실패
          if (isNaN(num)) return false;

          // 0 이하
          if (num <= 0) return false;

          // 너무 큰 금액 (100억 초과)
          if (num > 10_000_000_000) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}는 0보다 크고 합리적인 금액이어야 합니다.`;
        },
      },
    });
  };
}
