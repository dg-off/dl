import React, { useContext } from "react";
import type { PortraitConfig } from "../types";

export const PortraitConfigContext = React.createContext<PortraitConfig>({});

export const usePortraitConfig = (): PortraitConfig => useContext(PortraitConfigContext);
