import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ContactScreen() {
    const handleWhatsApp = () => {
        Linking.openURL('whatsapp://send?phone=03475644055');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:khairullahkhaliq770@gmail.com');
    };

    const handleWebsite = () => {
        Linking.openURL('https://github.com/khairullah770');
    };

    const handleFAQ = () => {
        // You can link to a specific FAQ page or show a modal
        Linking.openURL('https://github.com/khairullah770/Skilled-Labor-App');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Contact</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* WhatsApp Section */}
                <TouchableOpacity style={styles.contactItem} onPress={handleWhatsApp}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.titleText}>03475644055</Text>
                        <Text style={styles.subText}>Click here to contact us on whatsapp.</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* Email Section */}
                <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="mail" size={32} color="#0047AB" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.titleText}>skilledlabor@gmail.com</Text>
                        <Text style={styles.subText}>Click here to contact us through email.</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* Website Section */}
                <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="globe" size={32} color="#0047AB" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.titleText}>www.skilledlabor.com</Text>
                        <Text style={styles.subText}>For more detail, Please visit our website by clicking here.</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* FAQ Section */}
                <TouchableOpacity style={styles.contactItem} onPress={handleFAQ}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="help-circle" size={32} color="#0047AB" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.titleText}>FAQ'S</Text>
                        <Text style={styles.subText}>If you want to know more about us please clicking here.</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
header: {
    alignItems: 'center',
    paddingTop: 50,  
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
},
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        paddingVertical: 10,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    separator: {
        height: 1.5,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 0,
    },
});
