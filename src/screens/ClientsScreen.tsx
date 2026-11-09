import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Client, fmt } from '../data/prototypeData';

interface ClientsScreenProps {
  clients: Client[];
  onOpenClient: (clientId: number) => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ clients, onOpenClient }) => {
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

      {/* Clients List */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((c, index) => {
          const initial = c.name.charAt(0);
          const isAccentChip = index === 0 || index === 2; // highlight Priya and Anu like prototype

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
        })}

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
});
