import { combineSlices } from "@reduxjs/toolkit";
import user from "../features/user/slice";

const rootReducer = combineSlices({
  user,
});

export default rootReducer;
