import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * 미래 날짜 검증
 * 행사 시작일 등이 과거가 아닌지 확인
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isFutureDate",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!(value instanceof Date)) {
            value = new Date(value);
          }

          if (isNaN(value.getTime())) return false;

          const now = new Date();
          now.setHours(0, 0, 0, 0); // 오늘 00:00:00

          return value >= now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}는 오늘 이후의 날짜여야 합니다.`;
        },
      },
    });
  };
}
