import { Dispatch, SetStateAction, useState } from "react"

export interface IWrappedState<S> {
    value: S
    set: Dispatch<SetStateAction<S>>
}

export function useWrappedState<S>(initialState: S | (() => S)): IWrappedState<S> {
    const [value, setValue] = useState<S>(initialState);
    return {value, set: setValue};
}