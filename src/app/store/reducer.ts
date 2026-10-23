import { combineSlices } from "@reduxjs/toolkit";
import { operatorReducer } from "@/app/model/operator";

const rootReducer = combineSlices({
  operator: operatorReducer,
});

export default rootReducer;
