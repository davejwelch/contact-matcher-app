import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

export default function CompareScreen() {
  const [myHashes, setMyHashes] = useState<string[]>([]);
  const [otherHashesText, setOtherHashesText] = useState('');
  const [matches, setMatches] = useState<string[]>([]);

  useEffect(() => {
    const loadContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission denied');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      const hashSet = new Set<string>();

      for (const contact of data) {
        (contact.phoneNumbers || []).forEach(async (p) => {
          const clean = p.number.replace(/\D/g, '');
          const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, clean);
          hashSet.add(hash);
        });
        (contact.emails || []).forEach(async (e) => {
          const clean = e.email.trim().toLowerCase();
          const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, clean);
          hashSet.add(hash);
        });
      }

      const finalHashes = await Promise.all(Array.from(hashSet));
      setMyHashes(finalHashes);
    };

    loadContacts();
  }, []);

  const checkMatches = () => {
    const other = otherHashesText
      .split(/\s+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const matched = myHashes.filter((hash) => other.includes(hash));
    setMatches(matched);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Paste Other Person’s Hashes Below:</Text>
      <TextInput
        multiline
        placeholder="Paste hashes here, one per line or space-separated"
        value={otherHashesText}
        onChangeText={setOtherHashesText}
        onBlur={checkMatches}
        style={styles.input}
      />

      <Text style={styles.result}>
        Matches Found: {matches.length}
      </Text>

      {matches.map((match, idx) => (
        <Text key={idx} style={styles.matchItem}>
          {match}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    minHeight: 120,
    borderRadius: 4,
    textAlignVertical: 'top',
  },
  result: { marginTop: 20, fontWeight: 'bold', fontSize: 16 },
  matchItem: {
    fontSize: 12,
    marginVertical: 2,
    color: '#333',
  },
});
