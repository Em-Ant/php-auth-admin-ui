import { addListener, type TypedAddListener } from "@reduxjs/toolkit";
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/store/store";

/**
 * Typed store access for every layer below `app`. The RootState/AppDispatch
 * import is type-only, so this module has no runtime dependency on the app
 * layer and the slices stay free of component code (ADR-0003).
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>;
