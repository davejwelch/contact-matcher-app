import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleStart = async () => {
    setPermissionAsked(true);
    setLoading(true);

    const { status } = await Contacts.requestPermissionsAsync();

    if (status !== 'granted') {
      setDenied(true);
      setLoading(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });

    const hashes = new Set<string>();

    for (const contact of data) {
      for (const phone of contact.phoneNumbers || []) {
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          phone.number.trim()
        );
        hashes.add(hash);
      }
      for (const email of contact.emails || []) {
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          email.email.trim().toLowerCase()
        );
        hashes.add(hash);
      }
    }

    setContactCount(hashes.size);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!permissionAsked ? (
        <>
          <View style={styles.privacyBox}>
            <Text style={styles.privacyTitle}>🔒 Privacy Notice</Text>
            <Text style={styles.privacyText}>
              We never upload or store your contact data. Phone numbers and emails are securely hashed
              on your device using SHA-256, a one-way algorithm, and then the comparison is done. Access
              to your contacts and the hashed data is ephemeral. No names or raw contact data are ever
              stored or transmitted.
            </Text>
          </View>
          <Pressable style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>Hash My Contacts</Text>
          </Pressable>
        </>
      ) : loading ? (
        <ActivityIndicator size="large" />
      ) : denied ? (
        <Text style={styles.warning}>
          Permission denied. Please enable contacts access in settings.
        </Text>
      ) : (
        <>
          <Text style={styles.status}>Contacts securely hashed</Text>
          <Text style={styles.count}>{contactCount?.toLocaleString()} contacts</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  privacyBox: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  status: { fontSize: 18, marginBottom: 4 },
  count: { fontSize: 18, fontWeight: 'bold' },
  warning: { color: 'red', fontSize: 16, textAlign: 'center' },
});
