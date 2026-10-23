import { combineSlices } from "@reduxjs/toolkit";
import { operatorReducer } from "@/app/model/operator";
import { themeReducer } from "@/app/model/theme";

const rootReducer = combineSlices({
  operator: operatorReducer,
  theme: themeReducer,
});

export default rootReducer;
