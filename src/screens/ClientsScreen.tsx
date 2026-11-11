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
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Client, fmt } from '../data/prototypeData';

const PlusVectorIcon = ({ color = '#ffffff', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Line x1={12} y1={5} x2={12} y2={19} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} strokeLinecap="round" />
  </Svg>
);

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
  const [filterMode, setFilterMode] = useState<'active' | 'vip' | 'inactive'>('active');

  const activeClients = clients.filter((c) => c.isActive !== false);
  const inactiveClients = clients.filter((c) => c.isActive === false);
  const vipClients = activeClients.filter((c) => c.isVip);

  const filtered = clients.filter((c) => {
    const isActive = c.isActive !== false;
    if (filterMode === 'active' && !isActive) return false;
    if (filterMode === 'vip' && (!isActive || !c.isVip)) return false;
    if (filterMode === 'inactive' && isActive) return false;
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search Bar + Add Client (+) Icon + Active/VIP/Inactive filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor="rgba(18, 18, 18, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {onStartNewClient && (
            <TouchableOpacity
              style={styles.addPlusBtn}
              onPress={onStartNewClient}
              activeOpacity={0.85}
              accessibilityLabel="Add new client"
            >
              <PlusVectorIcon color="#ffffff" size={20} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'active' && styles.filterPillActive]}
            onPress={() => setFilterMode('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filterMode === 'active' && styles.filterTextActive]}>
              ACTIVE ({activeClients.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'vip' && styles.filterPillActive]}
            onPress={() => setFilterMode('vip')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filterMode === 'vip' && styles.filterTextActive]}>
              VIP ({vipClients.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'inactive' && styles.filterPillActive]}
            onPress={() => setFilterMode('inactive')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filterMode === 'inactive' && styles.filterTextActive]}>
              INACTIVE ({inactiveClients.length})
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
                  <Text
                    style={[
                      styles.clientName,
                      c.name.length > 26
                        ? { fontSize: 12 }
                        : c.name.length > 18
                          ? { fontSize: 13.5 }
                          : null,
                      c.isActive === false && styles.clientNameInactive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                  >
                    {c.name}
                  </Text>
                  <Text style={styles.clientMeta} numberOfLines={1}>
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

                {(c.isVip || c.isActive === false) && (
                  <View style={styles.cornerBadgeWrap} pointerEvents="none">
                    {c.isVip ? (
                      <View style={styles.vipBadge}>
                        <Text style={styles.vipBadgeText}>VIP</Text>
                      </View>
                    ) : null}
                    {c.isActive === false ? (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <UsersEmptyVectorIcon />
            </View>
            <Text style={styles.emptyTitle}>
              {filterMode === 'inactive'
                ? 'No inactive clients'
                : filterMode === 'vip'
                  ? 'No VIP clients yet'
                  : 'No clients yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filterMode === 'inactive'
                ? 'Clients marked inactive from their profile will appear here.'
                : filterMode === 'vip'
                  ? 'Tap the heart icon on any client to mark them as a VIP.'
                  : 'Save client details or import from your contacts to manage appointments and billing.'}
            </Text>
            {onStartNewClient && filterMode === 'active' && (
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.tint,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.06)',
  },
  addPlusBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  cornerBadgeWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    overflow: 'hidden',
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
    minWidth: 0,
    marginLeft: 14,
    marginRight: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  clientNameInactive: {
    color: 'rgba(18, 18, 18, 0.5)',
  },
  vipBadge: {
    backgroundColor: '#ffeef4',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vipBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#e8276b',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(18, 18, 18, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(18, 18, 18, 0.55)',
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
