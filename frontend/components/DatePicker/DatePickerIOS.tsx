import DateTimePicker from '@react-native-community/datetimepicker';
import {
    Control,
    Controller,
    FieldPath,
    FieldPathValue,
    FieldValues,
    Path,
} from 'react-hook-form';
import { StyleSheet } from 'react-native';

type DatePickerProps<T extends FieldValues> = {
    name: Path<T>;
    control: Control<T>;
    color?: string;
    mode?: 'date' | 'time';
    onChangeDate?: (date: Date) => void;
};

export default function DatePickerIOS<
    T extends FieldValues,
    TName extends FieldPath<T> = FieldPath<T>,
>({
    name,
    control,
    color,
    mode = 'date',
    onChangeDate,
}: DatePickerProps<T>) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <DateTimePicker
                    value={field.value ?? new Date()}
                    mode={mode}
                    locale="pl-PL"
                    is24Hour
                    accentColor={color}
                    style={mode === 'date' ? styles.date : styles.time}
                    onChange={(e, date) => {
                        if (date) {
                            field.onChange(date as FieldPathValue<T, TName>);
                            onChangeDate?.(date);
                        }
                    }}
                />
            )}
        />
    );
}

const styles = StyleSheet.create({
    date: {
        minWidth: 100,
    },
    time: {},
});
