import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAlarmService } from '@/controllers/alarm.service';
import { WEEK_DAY_LABELS, alarmRepeatLabel } from '@/models/alarm.model';
import type { Alarm } from '@/models/database';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AlarmsScreen() {
  const { medicineId, medicineName } = useLocalSearchParams<{
    medicineId: string;
    medicineName: string;
  }>();
  const numericId = parseInt(medicineId, 10);
  const navigation = useNavigation();
  const { alarms, loading, add, toggleEnabled, remove } = useAlarmService(numericId);

  const [showModal, setShowModal] = useState(false);
  // Default: all days selected
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set(ALL_DAYS));
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: `Alarmes — ${medicineName ?? 'Medicamento'}` });
  }, [medicineName, navigation]);

  const allSelected = selectedDays.size === 7;

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const toggleAllDays = () => {
    setSelectedDays(allSelected ? new Set([1]) : new Set(ALL_DAYS));
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (date) setTime(date);
    } else if (date) {
      setTime(date);
    }
  };

  const openModal = () => {
    setSelectedDays(new Set(ALL_DAYS));
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    setTime(d);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (selectedDays.size === 0) return;
    setSaving(true);
    try {
      const days = allSelected ? 'all' : Array.from(selectedDays).sort();
      await add(time, days === 'all' ? 'all' : (days as number[]));
      setShowModal(false);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (alarm: Alarm) => {
    Alert.alert(
      'Remover alarme',
      `Remover o alarme de ${alarmRepeatLabel(alarm.startAt)} às ${formatTime(alarm.startAt)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => remove(alarm.id) },
      ]
    );
  };

  const previewLabel = () => {
    if (allSelected) return 'Todos os dias';
    return Array.from(selectedDays)
      .sort()
      .map(d => WEEK_DAY_LABELS[d])
      .join(', ');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Alarmes semanais ou diários para lembrar o paciente de tomar o medicamento.
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Nenhum alarme</Text>
              <Text style={styles.emptyText}>
                Toque em "+ Adicionar alarme" para configurar um lembrete.
              </Text>
            </View>
          ) : (
            <ActivityIndicator color="#0a7ea4" style={{ marginTop: 32 }} />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.alarmCard}>
            <View style={styles.alarmLeft}>
              <Text style={styles.alarmTime}>{formatTime(item.startAt)}</Text>
              <Text style={styles.alarmRepeat}>{alarmRepeatLabel(item.startAt)}</Text>
            </View>
            <View style={styles.alarmRight}>
              <Switch
                value={item.isEnabled}
                onValueChange={v => toggleEnabled(item.id, v)}
                trackColor={{ false: '#D1D5DB', true: '#0a7ea4' }}
                thumbColor="#fff"
              />
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openModal} activeOpacity={0.85}>
        <Text style={styles.fabText}>+ Adicionar alarme</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo alarme</Text>

            {/* All days toggle */}
            <TouchableOpacity
              style={[styles.allDaysBtn, allSelected && styles.allDaysBtnActive]}
              onPress={toggleAllDays}
              activeOpacity={0.8}
            >
              <Text style={[styles.allDaysBtnText, allSelected && styles.allDaysBtnTextActive]}>
                {allSelected ? '✓  Todos os dias' : 'Todos os dias'}
              </Text>
            </TouchableOpacity>

            {/* Day multi-select */}
            <View style={styles.daysRow}>
              {WEEK_DAY_LABELS.map((label, index) => {
                const active = selectedDays.has(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayBtn, active && styles.dayBtnActive]}
                    onPress={() => toggleDay(index)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time picker */}
            <Text style={styles.sectionLabel}>Horário</Text>

            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleTimeChange}
                style={styles.iosPicker}
                locale="pt-BR"
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.androidTimeBtn}
                  onPress={() => setShowAndroidPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.androidTimeText}>{formatTime(time)}</Text>
                  <Text style={styles.androidTimeTap}>Toque para alterar</Text>
                </TouchableOpacity>
                {showAndroidPicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    is24Hour
                    display="clock"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}

            {/* Preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>
                🔔 {previewLabel()} às {formatTime(time)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Salvar alarme</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  list: { padding: 16, paddingBottom: 96, gap: 12 },
  hint: { fontSize: 13, color: '#9BA1A6', textAlign: 'center', marginBottom: 4 },

  empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#11181C', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9BA1A6', textAlign: 'center', lineHeight: 20 },

  alarmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  alarmLeft: { gap: 2 },
  alarmTime: { fontSize: 32, fontWeight: '700', color: '#11181C', letterSpacing: 1 },
  alarmRepeat: { fontSize: 13, color: '#9BA1A6' },
  alarmRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18, color: '#EF4444' },

  fab: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    backgroundColor: '#0a7ea4',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#11181C', textAlign: 'center' },

  allDaysBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  allDaysBtnActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  allDaysBtnText: { fontSize: 15, fontWeight: '700', color: '#687076' },
  allDaysBtnTextActive: { color: '#fff' },

  daysRow: { flexDirection: 'row', gap: 5 },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
  },
  dayBtnActive: { backgroundColor: '#0a7ea4' },
  dayBtnText: { fontSize: 11, fontWeight: '700', color: '#687076' },
  dayBtnTextActive: { color: '#fff' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9BA1A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  iosPicker: { height: 120, marginHorizontal: -8 },

  androidTimeBtn: {
    backgroundColor: '#F4F6F8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  androidTimeText: { fontSize: 36, fontWeight: '700', color: '#11181C', letterSpacing: 2 },
  androidTimeTap: { fontSize: 12, color: '#9BA1A6', marginTop: 4 },

  previewBox: {
    backgroundColor: '#E8F4F8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  previewText: { fontSize: 14, fontWeight: '600', color: '#0a7ea4' },

  confirmBtn: {
    backgroundColor: '#0a7ea4',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  cancelModalBtn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  cancelModalBtnText: { color: '#9BA1A6', fontSize: 16, fontWeight: '600' },
});
