import React, { createContext, useContext, useState } from 'react';

type UserData = {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    category: string;
    experience: string;
    location: {
        latitude: number;
        longitude: number;
    };
};

type UserContextType = {
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userData, setUserData] = useState<UserData>({
        name: 'John Doe',
        email: 'laborer@example.com',
        phone: '03001234567',
        dob: '01/01/1990',
        address: '123 Main St, Karachi',
        category: 'Plumber',
        experience: '5 Years',
        location: {
            latitude: 24.8607,
            longitude: 67.0011,
        },
    });

    const updateUserData = (data: Partial<UserData>) => {
        setUserData((prev) => ({ ...prev, ...data }));
    };

    return (
        <UserContext.Provider value={{ userData, updateUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
