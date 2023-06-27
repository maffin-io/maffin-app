import { DateTime } from 'luxon';
import { ValueTransformer } from 'typeorm';

export class DateTimeTransformer implements ValueTransformer {
  // eslint-disable-next-line class-methods-use-this
  from(value: string | null): DateTime | null {
    // For some reason, when using TreeRepository this is null at some point
    if (!value) {
      return null;
    }
    const result = DateTime.fromSQL(value);
    if (!result.isValid) {
      throw new Error(`invalid date: ${result.invalidExplanation}`);
    }
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  to(value: DateTime): string {
    const result = value.toSQLDate();
    if (result === null) {
      throw new Error(`invalid date: ${value.invalidExplanation}`);
    }
    return result;
  }
}
