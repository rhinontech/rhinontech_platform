import { create } from 'zustand';
import { EmailElement, EmailTemplate, ElementType, GlobalStyle } from '@/types/email-builder';
import { nanoid } from 'nanoid';

interface EmailStore {
    template: EmailTemplate;
    selectedElementId: string | null;

    // Actions
    addElement: (type: ElementType, parentId?: string) => void;
    updateElement: (id: string, updates: Partial<EmailElement>) => void;
    removeElement: (id: string) => void;
    moveElement: (activeId: string, overId: string) => void;
    setSelectedElement: (id: string | null) => void;
    loadTemplate: (template: EmailTemplate) => void;
    resetTemplate: () => void;
    updateGlobalStyle: (updates: Partial<GlobalStyle>) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const initialTemplate: EmailTemplate = {
    id: nanoid(),
    name: 'Untitled Template',
    version: '1.0',
    elements: [],
    globalStyles: {
        backgroundColor: '#f4f4f4',
        contentBackgroundColor: '#ffffff',
        contentWidth: '600px',
        fontFamily: 'Arial, sans-serif',
        textColor: '#000000',
        paddingTop: '20px',
        paddingBottom: '20px',
    },
};

export const useEmailStore = create<EmailStore>((set, get) => {
    let past: EmailTemplate[] = [];
    let future: EmailTemplate[] = [];

    const saveHistory = () => {
        const current = get().template;
        past = [...past.slice(-49), current]; // Keep last 50 states
        future = [];
    };

    return {
        template: initialTemplate,
        selectedElementId: null,

        addElement: (type, parentId) =>
            set((state) => {
                saveHistory();
                const newElement: EmailElement = {
                    id: nanoid(),
                    type,
                    props: {
                        style: {
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            paddingLeft: '10px',
                            paddingRight: '10px',
                        },
                    },
                    children: [],
                };

                // Handle Layouts: Create columns automatically
                if (type.startsWith('layout-')) {
                    const createColumn = (): EmailElement => ({
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '10px' } },
                        children: [],
                    });

                    if (type === 'layout-1') {
                        newElement.children = [createColumn()];
                    } else if (type === 'layout-2' || type === 'layout-70-30' || type === 'layout-30-70' || type === 'layout-60-40' || type === 'layout-40-60') {
                        newElement.children = [createColumn(), createColumn()];
                    } else if (type === 'layout-3') {
                        newElement.children = [createColumn(), createColumn(), createColumn()];
                    } else if (type === 'layout-4') {
                        newElement.children = [createColumn(), createColumn(), createColumn(), createColumn()];
                    }
                }

                // If adding to root
                if (!parentId) {
                    return {
                        template: {
                            ...state.template,
                            elements: [...state.template.elements, newElement],
                        },
                    };
                }

                // If adding to a container (recursive search)
                const addRecursive = (elements: EmailElement[]): EmailElement[] => {
                    return elements.map((el) => {
                        if (el.id === parentId) {
                            return { ...el, children: [...(el.children || []), newElement] };
                        }
                        if (el.children) {
                            return { ...el, children: addRecursive(el.children) };
                        }
                        return el;
                    });
                };

                return {
                    template: {
                        ...state.template,
                        elements: addRecursive(state.template.elements),
                    },
                };
            }),

        updateElement: (id, updates) =>
            set((state) => {
                saveHistory();
                const updateRecursive = (elements: EmailElement[]): EmailElement[] => {
                    return elements.map((el) => {
                        if (el.id === id) {
                            return { ...el, ...updates };
                        }
                        if (el.children) {
                            return { ...el, children: updateRecursive(el.children) };
                        }
                        return el;
                    });
                };

                return {
                    template: {
                        ...state.template,
                        elements: updateRecursive(state.template.elements),
                    },
                };
            }),

        removeElement: (id) =>
            set((state) => {
                saveHistory();
                const removeRecursive = (elements: EmailElement[]): EmailElement[] => {
                    return elements
                        .filter((el) => el.id !== id)
                        .map((el) => ({
                            ...el,
                            children: el.children ? removeRecursive(el.children) : undefined,
                        }));
                };

                return {
                    template: {
                        ...state.template,
                        elements: removeRecursive(state.template.elements),
                    },
                    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
                };
            }),

        moveElement: (activeId, overId) =>
            set((state) => {
                saveHistory();
                const deepClone = JSON.parse(JSON.stringify(state.template.elements));

                const findContainer = (elements: any[]): any[] | undefined => {
                    const activeIndex = elements.findIndex((el: any) => el.id === activeId);
                    const overIndex = elements.findIndex((el: any) => el.id === overId);

                    if (activeIndex !== -1 && overIndex !== -1) {
                        return elements;
                    }

                    for (const el of elements) {
                        if (el.children) {
                            const found = findContainer(el.children);
                            if (found) return found;
                        }
                    }
                    return undefined;
                };

                const container = findContainer(deepClone);
                if (container) {
                    const oldIndex = container.findIndex((el: any) => el.id === activeId);
                    const newIndex = container.findIndex((el: any) => el.id === overId);
                    const [movedElement] = container.splice(oldIndex, 1);
                    container.splice(newIndex, 0, movedElement);

                    return {
                        template: {
                            ...state.template,
                            elements: deepClone
                        }
                    };
                }

                return state;
            }),

        setSelectedElement: (id) => set({ selectedElementId: id }),

        loadTemplate: (template) => {
            saveHistory();
            set({ template });
        },

        resetTemplate: () => {
            saveHistory();
            set({ template: initialTemplate });
        },

        updateGlobalStyle: (updates) =>
            set((state) => {
                saveHistory();
                return {
                    template: {
                        ...state.template,
                        globalStyles: {
                            ...state.template.globalStyles,
                            ...updates,
                        },
                    },
                };
            }),

        undo: () => {
            if (past.length === 0) return;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, -1);
            future = [get().template, ...future];
            past = newPast;
            set({ template: previous });
        },

        redo: () => {
            if (future.length === 0) return;
            const next = future[0];
            const newFuture = future.slice(1);
            past = [...past, get().template];
            future = newFuture;
            set({ template: next });
        },

        get canUndo() {
            return past.length > 0;
        },

        get canRedo() {
            return future.length > 0;
        },
    };
});
