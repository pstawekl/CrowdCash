/* eslint-disable react/jsx-props-no-spreading */
import { Control, FieldPath, FieldValues, Path } from 'react-hook-form';
import { Platform } from 'react-native';

import DatePickerAndroid from './DatePickerAndroid';
import DatePickerIos from './DatePickerIOS';

type DatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  color?: string;
  mode?: 'date' | 'time';
  onChangeDate?: (date: Date) => void;
  disabled?: boolean;
};

export default function DatePicker<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({ ...props }: DatePickerProps<T>) {
  if (Platform.OS === 'ios') {
    return <DatePickerIos<T, TName> {...props} />;
  }

  return <DatePickerAndroid<T, TName> {...props} />;
}
