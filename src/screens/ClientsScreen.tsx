import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
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

interface ClientsScreenProps {
  clients: Client[];
  onOpenClient: (clientId: number | string) => void;
  onStartNewClient?: () => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  onOpenClient,
  onStartNewClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      {/* Search Bar matching Prototype */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="rgba(18, 18, 18, 0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>

                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{c.name}</Text>
                  <Text style={styles.clientMeta}>
                    {c.phone} · {c.bookings} bookings
                  </Text>
                </View>

                <View style={styles.salesInfo}>
                  <Text style={styles.salesAmount}>{fmt(c.sales)}</Text>
                  <Text style={styles.lifetimeLabel}>LIFETIME</Text>
                </View>
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
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
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
