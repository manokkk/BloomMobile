import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CycleDataResponse } from '../services/api';

interface CycleCalendarTabProps {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  cycleData: CycleDataResponse | null;
  onOpenCheckIn: () => void;
  onLogPeriodStart: () => void;
  loggingCycle: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const CycleCalendarTab: React.FC<CycleCalendarTabProps> = ({
  selectedDate,
  onSelectDate,
  cycleData,
  onOpenCheckIn,
  onLogPeriodStart,
  loggingCycle,
}) => {
  const initialParts = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(
    initialParts[0] || new Date().getUTCFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    (initialParts[1] ? initialParts[1] - 1 : new Date().getUTCMonth())
  );

  const todayIso = new Date().toISOString().split('T')[0];

  const loggedDates = useMemo(() => {
    const set = new Set<string>();
    cycleData?.logs.forEach((l) => set.add(l.log_date));
    return set;
  }, [cycleData?.logs]);

  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const cells: Array<{ iso: string | null; day: number | null }> = [];

    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push({ iso: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ iso: toIsoDate(viewYear, viewMonth, d), day: d });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const changeMonth = (delta: number) => {
    const dt = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(dt.getUTCFullYear());
    setViewMonth(dt.getUTCMonth());
  };

  const periodStart = cycleData?.cycle.start_date;
  const periodEnd = cycleData?.cycle.end_date;
  const fertileStart = cycleData?.prediction.fertile_window_start;
  const fertileEnd = cycleData?.prediction.fertile_window_end;
  const ovulationDate = cycleData?.prediction.ovulation_date;

  return (
    <View>
      <Text style={styles.pageTitle}>Cycle Calendar</Text>
      <Text style={styles.pageSubtitle}>
        Tap any day to view or log symptoms and period dates.
      </Text>

      <View style={styles.card}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => changeMonth(-1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#D23669" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => changeMonth(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color="#D23669" />
          </TouchableOpacity>
        </View>

        {/* Weekday Labels */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((wd) => (
            <Text key={wd} style={styles.weekdayLabel}>
              {wd}
            </Text>
          ))}
        </View>

        {/* Month Grid */}
        <View style={styles.grid}>
          {calendarCells.map((cell, idx) => {
            if (!cell.iso || !cell.day) {
              return <View key={`empty-${idx}`} style={styles.dayCell} />;
            }

            const iso = cell.iso;
            const isSelected = iso === selectedDate;
            const isToday = iso === todayIso;
            const isPeriod =
              Boolean(periodStart && periodEnd) &&
              iso >= periodStart! &&
              iso <= periodEnd!;
            const isOvulation = iso === ovulationDate;
            const isFertile =
              !isPeriod &&
              !isOvulation &&
              Boolean(fertileStart && fertileEnd) &&
              iso >= fertileStart! &&
              iso <= fertileEnd!;
            const hasLog = loggedDates.has(iso);

            return (
              <TouchableOpacity
                key={iso}
                style={[
                  styles.dayCell,
                  isPeriod && styles.periodCell,
                  isFertile && styles.fertileCell,
                  isOvulation && styles.ovulationCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => onSelectDate(iso)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {cell.day}
                </Text>
                {hasLog && <View style={styles.logDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#FFE4E6' }]} />
            <Text style={styles.legendText}>Period</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#FCE7F3' }]} />
            <Text style={styles.legendText}>Fertile</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#F3E8FF' }]} />
            <Text style={styles.legendText}>Ovulation</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.logDot} />
            <Text style={styles.legendText}>Logged</Text>
          </View>
        </View>
      </View>

      {/* Actions for Selected Date */}
      <View style={styles.actionsCard}>
        <Text style={styles.selectedHeader}>Selected: {selectedDate}</Text>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.secondaryAction, styles.actionButtonFlex]}
            onPress={onLogPeriodStart}
            disabled={loggingCycle}
            activeOpacity={0.8}
          >
            <Ionicons name="water-outline" size={16} color="#D23669" />
            <Text style={styles.secondaryActionText}>
              {loggingCycle ? 'Saving...' : 'Mark Period Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryAction, styles.actionButtonFlex]}
            onPress={onOpenCheckIn}
            activeOpacity={0.8}
          >
            <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Log Symptoms</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#D23669',
  },
  pageSubtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 13,
    color: '#5C5465',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE4E9',
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D23669',
    lineHeight: 22,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A32',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#8C8296',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
  },
  periodCell: {
    backgroundColor: '#FFE4E6',
  },
  fertileCell: {
    backgroundColor: '#FCE7F3',
  },
  ovulationCell: {
    backgroundColor: '#F3E8FF',
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: '#D23669',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D2A32',
  },
  todayText: {
    color: '#D23669',
    fontWeight: '800',
  },
  selectedText: {
    color: '#D23669',
    fontWeight: '800',
  },
  logDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D23669',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFF0F5',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#5C5465',
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE4E9',
  },
  selectedHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2A32',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonFlex: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#FFFAF0',
    borderWidth: 1.5,
    borderColor: '#F9A8D4',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D23669',
  },
  primaryAction: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#D23669',
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
