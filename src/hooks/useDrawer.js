// src/hooks/useDrawer.js


import { useState, useCallback } from "react";

const useDrawer = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer  = useCallback(() => setDrawerVisible(true),  []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);
  const toggleDrawer = useCallback(() => setDrawerVisible((v) => !v), []);

  return { drawerVisible, openDrawer, closeDrawer, toggleDrawer };
};

export default useDrawer;