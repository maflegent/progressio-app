// components/SmartTaskInput.tsx
import { Colors } from '@/constants/Colors';
import { EisenhowerMatrix, TaskPriority } from '@/types';
import { parseNaturalLanguage } from '@/utils/smartInputParser';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface SmartTaskInputProps {
  onSubmit: (parsedTask: {
    title: string;
    description?: string;
    priority: TaskPriority;
    eisenhower?: EisenhowerMatrix;
    dueDate?: Date;
    tags: string[];
  }) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SmartTaskInput: React.FC<SmartTaskInputProps> = ({
  onSubmit,
  placeholder = "Что нужно сделать? Используйте: 'завтра', '#тег', 'важно'...",
  autoFocus = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [input, setInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Примеры быстрого ввода
  const quickExamples = [
    "Купить молоко завтра #покупки",
    "Подготовить отчет важно и срочно",
    "Позвонить маме #семья",
    "Изучить React Native через 3 дня #обучение",
  ];

  useEffect(() => {
    if (input.trim().length > 3) {
      const parsed = parseNaturalLanguage(input);
      setParsedPreview(parsed);
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    const parsed = parseNaturalLanguage(input);
    onSubmit({
      ...parsed,
      // Убедимся, что все обязательные поля заполнены
      priority: parsed.priority || 'medium',
      tags: parsed.tags || [],
    });

    // Очищаем ввод
    setInput('');
    setParsedPreview(null);
    setShowPreview(false);
    Keyboard.dismiss();
  };

  const handleExamplePress = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const getPriorityColor = (priority?: TaskPriority) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return colors.muted;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Быстрые примеры */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.examplesContainer}
      >
        {quickExamples.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.exampleChip,
              { backgroundColor: colors.card }
            ]}
            onPress={() => handleExamplePress(example)}
          >
            <Text style={[styles.exampleText, { color: colors.muted }]}>
              {example}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Поле ввода */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.cardForeground,
              borderColor: colors.border,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          autoFocus={autoFocus}
          multiline
          maxLength={500}
        />
        
        {input.length > 0 && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Ionicons name="add" size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Предпросмотр разбора */}
      {showPreview && parsedPreview && (
        <View style={[styles.previewContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.cardForeground }]}>
            Будет создана задача:
          </Text>
          
          <View style={styles.previewContent}>
            <Text style={[styles.previewTaskTitle, { color: colors.cardForeground }]}>
              {parsedPreview.title || '(без названия)'}
            </Text>
            
            <View style={styles.previewDetails}>
              {parsedPreview.priority && (
                <View style={styles.detailItem}>
                  <Ionicons 
                    name="flag" 
                    size={14} 
                    color={getPriorityColor(parsedPreview.priority)} 
                  />
                  <Text style={[styles.detailText, { color: colors.muted }]}>
                    {parsedPreview.priority === 'urgent' && 'Срочно'}
                    {parsedPreview.priority === 'high' && 'Высокий'}
                    {parsedPreview.priority === 'medium' && 'Средний'}
                    {parsedPreview.priority === 'low' && 'Низкий'}
                  </Text>
                </View>
              )}
              
              {parsedPreview.dueDate && (
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.detailText, { color: colors.muted }]}>
                    {formatDate(parsedPreview.dueDate)}
                  </Text>
                </View>
              )}
              
              {parsedPreview.tags.length > 0 && (
                <View style={styles.detailItem}>
                  <Ionicons name="pricetag" size={14} color="#8B5CF6" />
                  <Text style={[styles.detailText, { color: colors.muted }]}>
                    {parsedPreview.tags.join(', ')}
                  </Text>
                </View>
              )}
              
              {parsedPreview.eisenhower && (
                <View style={styles.detailItem}>
                  <Ionicons name="grid" size={14} color="#F59E0B" />
                  <Text style={[styles.detailText, { color: colors.muted }]}>
                    {parsedPreview.eisenhower === 'do' && 'Сделать'}
                    {parsedPreview.eisenhower === 'decide' && 'Решить'}
                    {parsedPreview.eisenhower === 'delegate' && 'Делегировать'}
                    {parsedPreview.eisenhower === 'delete' && 'Удалить'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={[styles.previewHint, { color: colors.muted }]}>
            Нажмите Enter или кнопку "✓" для создания
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  examplesContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  exampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exampleText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  previewContent: {
    marginBottom: 8,
  },
  previewTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewHint: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
});