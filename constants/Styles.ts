// constants/Styles.ts
import { StyleSheet, Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GlobalStyles = StyleSheet.create({
  // Тени для iOS и Android
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  // Для красивых кнопок
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Для карточек
  cardContainer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
});