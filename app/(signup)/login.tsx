import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoginAuth from '../../components/LoginAuth';
import Account from '../../components/Account';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

export default function Login() {
    const [session, setSession] = useState<Session | null>(null);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Auth Change:', _event)
            setSession(session)
        })

        // Cleanup
        return () => {
            subscription.unsubscribe()
        }
    }, [])


    return (
        <KeyboardAvoidingView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {session && session.user ? (
                    <Account key={session.user.id} session={session} />
                ) : (
                    <LoginAuth />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
});
