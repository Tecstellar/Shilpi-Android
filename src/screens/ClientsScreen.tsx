import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Client, fmt } from '../data/prototypeData';

const UsersEmptyVectorIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={1.8}>
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={9} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartVectorIcon = ({ filled }: { filled: boolean }) => (
  <Svg
    width={19}
    height={19}
    viewBox="0 0 24 24"
    fill={filled ? '#e8276b' : 'none'}
    stroke={filled ? '#e8276b' : 'rgba(18, 18, 18, 0.35)'}
    strokeWidth={2}
  >
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface ClientsScreenProps {
  clients: Client[];
  onOpenClient: (clientId: number | string) => void;
  onToggleVip?: (clientId: number | string) => void;
  onStartNewClient?: () => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  onOpenClient,
  onToggleVip,
  onStartNewClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vipOnly, setVipOnly] = useState(false);

  const vipCount = clients.filter((c) => c.isVip).length;

  const filtered = clients.filter((c) => {
    if (vipOnly && !c.isVip) return false;
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search Bar & All/VIP filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="rgba(18, 18, 18, 0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, !vipOnly && styles.filterPillActive]}
            onPress={() => setVipOnly(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, !vipOnly && styles.filterTextActive]}>
              ALL ({clients.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, vipOnly && styles.filterPillActive]}
            onPress={() => setVipOnly(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, vipOnly && styles.filterTextActive]}>
              VIP ({vipCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clients List or Empty State */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length > 0 ? (
          filtered.map((c, index) => {
            const initial = c.name.charAt(0);
            const isAccentChip = index % 2 === 0;

            return (
              <TouchableOpacity
                key={c.id}
                style={styles.clientRow}
                onPress={() => onOpenClient(c.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatarChip,
                    isAccentChip ? styles.avatarAccent : styles.avatarInk,
                  ]}
                >
                  {c.photoUri ? (
                    <Image source={{ uri: c.photoUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                  )}
                </View>

                <View style={styles.clientInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    {c.isVip ? (
                      <View style={styles.vipBadge}>
                        <Text style={styles.vipBadgeText}>VIP</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.clientMeta}>
                    {c.phone} · {c.bookings} bookings
                  </Text>
                </View>

                <View style={styles.salesInfo}>
                  <Text style={styles.salesAmount}>{fmt(c.sales)}</Text>
                  <Text style={styles.lifetimeLabel}>LIFETIME</Text>
                </View>

                {onToggleVip && (
                  <TouchableOpacity
                    style={[styles.heartBtn, c.isVip && styles.heartBtnActive]}
                    onPress={() => onToggleVip(c.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.75}
                  >
                    <HeartVectorIcon filled={!!c.isVip} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <UsersEmptyVectorIcon />
            </View>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptySubtitle}>
              Save client details to easily manage appointments, send quotes, and track lifetime billing.
            </Text>
            {onStartNewClient && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={onStartNewClient}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>＋ Add Client</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  searchInput: {
    backgroundColor: Colors.tint,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.06)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f4f4f6',
  },
  filterPillActive: {
    backgroundColor: '#121212',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: 'rgba(18, 18, 18, 0.6)',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    backgroundColor: '#ffffff',
    paddingBottom: 110,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  avatarChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarAccent: {
    backgroundColor: Colors.accent,
  },
  avatarInk: {
    backgroundColor: '#121212',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
    flexShrink: 1,
  },
  vipBadge: {
    backgroundColor: '#ffeef4',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  vipBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#e8276b',
  },
  heartBtn: {
    marginLeft: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f7f7f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: '#ffeef4',
  },
  clientMeta: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  salesInfo: {
    alignItems: 'flex-end',
  },
  salesAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  lifetimeLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(18, 18, 18, 0.45)',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffeef4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(18, 18, 18, 0.55)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
