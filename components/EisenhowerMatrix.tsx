// components/EisenhowerMatrix.tsx
import { Colors } from '@/constants/Colors';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onQuadrantPress?: (quadrant: 'do' | 'decide' | 'delegate' | 'delete') => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onTaskPress,
  onQuadrantPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Группируем задачи по квадрантам
  const quadrants = {
    do: tasks.filter(task => task.eisenhower === 'do' && !task.isCompleted),
    decide: tasks.filter(task => task.eisenhower === 'decide' && !task.isCompleted),
    delegate: tasks.filter(task => task.eisenhower === 'delegate' && !task.isCompleted),
    delete: tasks.filter(task => task.eisenhower === 'delete' && !task.isCompleted),
  };

  const quadrantConfig = {
    do: {
      title: 'Сделать',
      subtitle: 'Важно и срочно',
      color: '#10B981',
      icon: 'flash' as const,
    },
    decide: {
      title: 'Решить',
      subtitle: 'Важно, не срочно',
      color: '#3B82F6',
      icon: 'calendar' as const,
    },
    delegate: {
      title: 'Делегировать',
      subtitle: 'Не важно, срочно',
      color: '#F59E0B',
      icon: 'people' as const,
    },
    delete: {
      title: 'Удалить',
      subtitle: 'Не важно, не срочно',
      color: '#EF4444',
      icon: 'trash' as const,
    },
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return colors.muted;
    }
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const dueDate = new Date(date);
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays < 0) return `${Math.abs(diffDays)} дн. назад`;
    if (diffDays < 7) return `Через ${diffDays} дн.`;
    
    return dueDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const Quadrant = ({ 
    type, 
    tasks, 
    config 
  }: { 
    type: 'do' | 'decide' | 'delegate' | 'delete';
    tasks: Task[];
    config: typeof quadrantConfig[keyof typeof quadrantConfig];
  }) => (
    <TouchableOpacity
      style={[
        styles.quadrant,
        { backgroundColor: `${config.color}15` },
        { borderColor: config.color },
      ]}
      onPress={() => onQuadrantPress?.(type)}
      activeOpacity={0.7}
    >
      <View style={styles.quadrantHeader}>
        <View style={[styles.quadrantIcon, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.quadrantTitleContainer}>
          <Text style={[styles.quadrantTitle, { color: colors.foreground }]}>
            {config.title}
          </Text>
          <Text style={[styles.quadrantSubtitle, { color: colors.muted }]}>
            {config.subtitle}
          </Text>
        </View>
        <Text style={[styles.taskCount, { color: config.color }]}>
          {tasks.length}
        </Text>
      </View>

      {tasks.length > 0 ? (
        <ScrollView 
          style={styles.tasksList}
          showsVerticalScrollIndicator={false}
        >
          {tasks.slice(0, 5).map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, { backgroundColor: colors.background }]}
              onPress={() => onTaskPress?.(task)}
            >
              <View style={styles.taskContent}>
                <View 
                  style={[
                    styles.priorityDot, 
                    { backgroundColor: getPriorityColor(task.priority) }
                  ]} 
                />
                <Text 
                  style={[styles.taskTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
              </View>
              
              {task.dueDate && (
                <Text style={[styles.taskDueDate, { color: colors.muted }]}>
                  {formatDueDate(task.dueDate)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          
          {tasks.length > 5 && (
            <Text style={[styles.moreTasks, { color: colors.muted }]}>
              +{tasks.length - 5} еще
            </Text>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Все задачи выполнены
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.matrixGrid}>
        {/* Верхний ряд */}
        <View style={styles.row}>
          <View style={styles.cell}>
            <Quadrant 
              type="do" 
              tasks={quadrants.do} 
              config={quadrantConfig.do} 
            />
          </View>
          <View style={styles.cell}>
            <Quadrant 
              type="decide" 
              tasks={quadrants.decide} 
              config={quadrantConfig.decide} 
            />
          </View>
        </View>
        
        {/* Нижний ряд */}
        <View style={styles.row}>
          <View style={styles.cell}>
            <Quadrant 
              type="delegate" 
              tasks={quadrants.delegate} 
              config={quadrantConfig.delegate} 
            />
          </View>
          <View style={styles.cell}>
            <Quadrant 
              type="delete" 
              tasks={quadrants.delete} 
              config={quadrantConfig.delete} 
            />
          </View>
        </View>
      </View>
      
      {/* Легенда */}
      <View style={[styles.legend, { backgroundColor: colors.card }]}>
        <Text style={[styles.legendTitle, { color: colors.foreground }]}>
          Матрица Эйзенхауэра
        </Text>
        <Text style={[styles.legendText, { color: colors.muted }]}>
          Распределяйте задачи по квадрантам для эффективного планирования
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  matrixGrid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cell: {
    flex: 1,
  },
  quadrant: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    minHeight: 200,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quadrantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quadrantTitleContainer: {
    flex: 1,
  },
  quadrantTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  quadrantSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  taskCount: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  tasksList: {
    maxHeight: 120,
  },
  taskItem: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
  },
  taskDueDate: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 16,
  },
  moreTasks: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    marginTop: 8,
  },
  legend: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
    lineHeight: 16,
  },
});