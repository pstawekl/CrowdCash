import Slider from '@react-native-community/slider'; // Użyj slidera z react-native-community
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import PauseIcon from '../components/Icons/PauseIcon';
import PlayIcon from '../components/Icons/PlayIcon';

export type SessionType = 'work' | 'break' | 'relax' | 'training';

export default function PomodoroScreen() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [totalTime, setTotalTime] = useState(25 * 60);
    const [sesionType, setSessionType] = useState<SessionType>('work');

    // Funkcja do rozpoczęcia/stopowania odliczania
    const toggleTimer = () => {
        if (isRunning) {
            clearInterval(intervalId as NodeJS.Timeout); // Zatrzymaj timer
            setIntervalId(null);
        } else {
            const id = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 0) {
                        clearInterval(id); // Zatrzymaj timer po zakończeniu
                        return 0;
                    }
                    return prevTime - 1; // Decrementuj o 1 sekundę
                });
            }, 1000);
            setIntervalId(id);
        }
        setIsRunning(!isRunning); // Zmieniaj status, czy zegar działa
    };

    // Funkcja do formatowania czasu (minuty:sekundy)
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Funkcja do resetowania czasu
    const resetTimer = () => {
        setTimeLeft(totalTime); // Resetuj czas do pierwotnej wartości
        if (intervalId) {
            clearInterval(intervalId); // Zatrzymaj timer, jeśli działa
            setIntervalId(null);
        }
        setIsRunning(false); // Zatrzymaj odliczanie
    };

    // Oblicz procent ukończenia w zależności od pozostałego czasu
    const progress = (timeLeft / totalTime) * 100;

    // Funkcja do obsługi zmiany wartości na suwaku
    const handleSliderChange = (value: number) => {
        const newTime = Math.round(value) * 60; // Konwertuj minuty na sekundy
        setTotalTime(newTime);
        setTimeLeft(newTime); // Zaktualizuj czas
    };

    return (
        <LinearGradient
            colors={['#9CFF2E', '#1E5631']}
            style={styles.backgroundGradient}
        >
            <View style={styles.container}>
            /* Session Type Selector */
                <View style={styles.selectorContainer}>
                    <Text style={styles.selectorLabel}>Session Type:</Text>
                    <View style={styles.typesContainer}>
                        {(['work', 'break', 'relax', 'training'] as SessionType[]).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeButton,
                                    sesionType === type && styles.selectedTypeButton
                                ]}
                                onPress={() => setSessionType(type)}
                            >
                                <Text
                                    style={[
                                        styles.typeText,
                                        sesionType === type && styles.selectedTypeText
                                    ]}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                {/* Rysowanie koła */}
                <View style={styles.circleContainer}>
                    <Svg height="200" width="200" viewBox="0 0 200 200">
                        <Circle
                            cx="100"
                            cy="100"
                            r="90"
                            stroke="#e6e6e6"
                            strokeWidth="15"
                            fill="none"
                        />
                        <Circle
                            cx="100"
                            cy="100"
                            r="90"
                            stroke="#4caf50" // Kolor okręgu w zależności od postępu
                            strokeWidth="15"
                            fill="none"
                            strokeDasharray="565.48" // Obwód okręgu (2 * π * r)
                            strokeDashoffset={(1 - progress / 100) * 565.48} // Ustawienie postępu
                            strokeLinecap="round"
                        />
                    </Svg>
                </View>

                {/* Zegar */}
                <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

                {/* Przycisk do start/stop */}
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={toggleTimer}
                    >
                        {isRunning ? (
                            <PauseIcon
                                width='20px'
                                height='20px'
                            />
                        ) : (
                            <PlayIcon
                                width='20px'
                                height='20px'
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={resetTimer}
                    >
                        <Text style={styles.buttonText}>Reset</Text>
                    </TouchableOpacity>
                </View>

                {/* Suwak do ustawiania czasu */}
                <Text style={styles.sliderLabel}>Ustaw czas: {Math.round(totalTime / 60)} minut</Text>
                <Slider
                    minimumValue={1}
                    maximumValue={60}
                    step={1}
                    value={totalTime / 60} // Wyświetlaj czas w minutach
                    onValueChange={handleSliderChange}
                    style={styles.slider}
                />

                {timeLeft === 0 && !isRunning && (
                    <Text style={styles.finishedText}>Czas pracy zakończony! Zrób przerwę.</Text>
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    backgroundGradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    timer: {
        fontSize: 60,
        marginBottom: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginBottom: 20,
    },
    circleContainer: {
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    finishedText: {
        fontSize: 18,
        color: 'green',
        marginTop: 20,
        fontWeight: 'bold',
    },
    sliderLabel: {
        fontSize: 18,
        marginBottom: 10,
        color: '#fff',
    },
    slider: {
        width: '80%',
    },
    iconButton: {
        backgroundColor: '#4caf50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectorContainer: {
        width: '100%',
        marginBottom: 20,
    },
    selectorLabel: {
        fontSize: 18,
        marginBottom: 10,
    },
    typesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    typeButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e6e6e6',
        marginHorizontal: 5,
    },
    selectedTypeButton: {
        backgroundColor: '#4caf50',
    },
    typeText: {
        fontSize: 14,
    },
    selectedTypeText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
