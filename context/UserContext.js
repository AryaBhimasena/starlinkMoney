import { createContext, useState, useEffect } from "react";
import {
  saveUserData,
  getUserData,
  removeUserData,
  syncUserDataAfterLogin,
  fetchAndStoreUserRelatedData,
} from "../services/indexedDBService";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserData();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const loginUser = async (uid) => {
    await saveUserData(uid);
    const userData = await getUserData();
    setUser(userData);
    await syncUserDataAfterLogin(uid);
  };

  const logoutUser = async () => {
    await removeUserData();
    setUser(null);
  };

  const fetchUserRelatedData = async (entitasId) => {
    await fetchAndStoreUserRelatedData(entitasId);
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser, fetchUserRelatedData }}>
      {children}
    </UserContext.Provider>
  );
};
