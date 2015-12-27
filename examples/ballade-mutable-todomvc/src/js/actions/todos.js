import dispatcher from '../dispatcher/dispatcher';
import constants from '../constants/todos';
const TODOS = 'todos';

const todoActions = dispatcher.createActions({
    create: (text) => ({
        type: `${TODOS}/${constants.CREATE}`,
        text
    }),

    update: (id, text) => ({
        type: `${TODOS}/${constants.UPDATE}`,
        text,
        id
    }),

    delete: (id) => ({
        type: `${TODOS}/${constants.DELETE}`,
        id
    }),

    deleteComplete: () => ({
        type: `${TODOS}/${constants.DELETE_COMPLETE}`
    }),

    toggle: (id) => ({
        type: `${TODOS}/${constants.TOGGLE}`,
        id
    }),

    toggleAll: () => ({
        type: `${TODOS}/${constants.TOGGLE_ALL}`
    })
});

export default todoActions;
