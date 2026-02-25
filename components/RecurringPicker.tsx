// components/RecurringPicker.tsx
import { Colors } from '@/constants/Colors';
import { RecurringPattern, RecurringRule, getRecurringDescription } from '@/utils/recurringTasks';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

interface RecurringPickerProps {
  value?: string; // JSON строка с правилом
  onChange: (rule: RecurringRule | null) => void;
}

export const RecurringPicker: React.FC<RecurringPickerProps> = ({
  value,
  onChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showModal, setShowModal] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<RecurringPattern>('daily');
  const [interval, setInterval] = useState('1');
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState('');

  const patterns: Array<{
    id: RecurringPattern;
    label: string;
    icon: string;
    description: string;
  }> = [
    { id: 'daily', label: 'Ежедневно', icon: 'calendar', description: 'Каждый день' },
    { id: 'weekly', label: 'Еженедельно', icon: 'calendar', description: 'Каждую неделю' },
    { id: 'monthly', label: 'Ежемесячно', icon: 'calendar', description: 'Каждый месяц' },
    { id: 'yearly', label: 'Ежегодно', icon: 'calendar', description: 'Каждый год' },
    { id: 'weekdays', label: 'По будням', icon: 'business', description: 'Пн-Пт' },
    { id: 'weekends', label: 'По выходным', icon: 'cafe', description: 'Сб-Вс' },
    { id: 'custom', label: 'Настроить', icon: 'settings', description: 'Выбрать дни' },
  ];

  const parseCurrentValue = (): RecurringRule | null => {
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  };

  const handleSave = () => {
    const rule: RecurringRule = {
      pattern: selectedPattern,
    };

    const intervalNum = parseInt(interval);
    if (intervalNum > 1) {
      rule.interval = intervalNum;
    }

    // Для ежемесячных задач можно указать день месяца
    if (selectedPattern === 'monthly') {
      rule.monthDay = new Date().getDate(); // Текущий день месяца
    }

    // Настройка конечной даты или количества повторений
    if (endDate) {
      rule.endDate = new Date(endDate);
    } else if (occurrences) {
      rule.occurrences = parseInt(occurrences);
    }

    onChange(rule);
    setShowModal(false);
  };

  const handleClear = () => {
    onChange(null);
    setShowModal(false);
  };

  const currentRule = parseCurrentValue();

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.triggerButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons 
          name={currentRule ? "repeat" : "repeat-outline"} 
          size={20} 
          color={currentRule ? colors.primary : colors.muted} 
        />
        <Text style={[
          styles.triggerText,
          { color: currentRule ? colors.primary : colors.muted },
        ]}>
          {currentRule ? getRecurringDescription(value) : 'Повторение'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Настройка повторения
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Выбор типа повторения */}
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Тип повторения
              </Text>
              <View style={styles.patternsGrid}>
                {patterns.map(pattern => (
                  <TouchableOpacity
                    key={pattern.id}
                    style={[
                      styles.patternButton,
                      { 
                        backgroundColor: selectedPattern === pattern.id 
                          ? colors.primary 
                          : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPattern(pattern.id)}
                  >
                    <Ionicons 
                      name={pattern.icon as any} 
                      size={24} 
                      color={selectedPattern === pattern.id ? colors.primaryForeground : colors.muted} 
                    />
                    <Text style={[
                      styles.patternLabel,
                      { 
                        color: selectedPattern === pattern.id 
                          ? colors.primaryForeground 
                          : colors.cardForeground,
                      },
                    ]}>
                      {pattern.label}
                    </Text>
                    <Text style={[
                      styles.patternDescription,
                      { 
                        color: selectedPattern === pattern.id 
                          ? colors.primaryForeground 
                          : colors.muted,
                      },
                    ]}>
                      {pattern.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Интервал */}
              {(selectedPattern === 'daily' || 
                selectedPattern === 'weekly' || 
                selectedPattern === 'monthly' || 
                selectedPattern === 'yearly') && (
                <View style={styles.intervalContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Интервал
                  </Text>
                  <View style={styles.intervalInputContainer}>
                    <Text style={[styles.intervalLabel, { color: colors.muted }]}>
                      Каждые
                    </Text>
                    <TextInput
                      style={[
                        styles.intervalInput,
                        {
                          backgroundColor: colors.card,
                          color: colors.cardForeground,
                          borderColor: colors.border,
                        },
                      ]}
                      value={interval}
                      onChangeText={setInterval}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={colors.muted}
                    />
                    <Text style={[styles.intervalLabel, { color: colors.muted }]}>
                      {selectedPattern === 'daily' && 'дней'}
                      {selectedPattern === 'weekly' && 'недель'}
                      {selectedPattern === 'monthly' && 'месяцев'}
                      {selectedPattern === 'yearly' && 'лет'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Окончание повторений */}
              <View style={styles.endOptions}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Завершить повторение
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.endOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="infinite" size={20} color={colors.muted} />
                  <Text style={[styles.endOptionText, { color: colors.cardForeground }]}>
                    Никогда
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.endOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="calendar" size={20} color={colors.muted} />
                  <Text style={[styles.endOptionText, { color: colors.cardForeground }]}>
                    До даты
                  </Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        color: colors.cardForeground,
                        borderColor: colors.border,
                      },
                    ]}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="ГГГГ-ММ-ДД"
                    placeholderTextColor={colors.muted}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.endOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="list" size={20} color={colors.muted} />
                  <Text style={[styles.endOptionText, { color: colors.cardForeground }]}>
                    После
                  </Text>
                  <TextInput
                    style={[
                      styles.occurrencesInput,
                      {
                        color: colors.cardForeground,
                        borderColor: colors.border,
                      },
                    ]}
                    value={occurrences}
                    onChangeText={setOccurrences}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={colors.muted}
                  />
                  <Text style={[styles.endOptionText, { color: colors.muted }]}>
                    повторений
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Предпросмотр */}
              <View style={[styles.preview, { backgroundColor: colors.card }]}>
                <Text style={[styles.previewTitle, { color: colors.cardForeground }]}>
                  Пример следующих дат:
                </Text>
                <Text style={[styles.previewText, { color: colors.muted }]}>
                  {getRecurringDescription(JSON.stringify({
                    pattern: selectedPattern,
                    interval: parseInt(interval) || 1,
                  }))}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, { borderColor: colors.border }]}
                onPress={handleClear}
              >
                <Text style={[styles.clearButtonText, { color: colors.muted }]}>
                  Без повторения
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>
                  Сохранить
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  patternButton: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  patternLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  patternDescription: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  intervalContainer: {
    marginBottom: 24,
  },
  intervalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intervalLabel: {
    fontSize: 16,
  },
  intervalInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  endOptions: {
    marginBottom: 24,
  },
  endOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  endOptionText: {
    fontSize: 16,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginLeft: 'auto',
  },
  occurrencesInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    marginLeft: 8,
  },
  preview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});