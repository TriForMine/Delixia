import {create} from 'zustand';

type AppMode = 'menu' | 'game' | 'editor';

interface AppState {
	mode: AppMode;
	setMode: (mode: AppMode) => void;
}

export const useStore = create<AppState>((set) => ({
	mode: 'menu',
	setMode: (mode) => set({mode}),
}));
