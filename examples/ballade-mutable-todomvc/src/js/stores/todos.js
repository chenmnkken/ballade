const Schema = require('ballade').Schema;
import dispatcher from '../dispatcher/dispatcher';
import constatns from '../constants/todos';
const TODOS = 'todos';

const todoSchema = new Schema({
    id: {
        $type: String,
        $default: (+new Date() + Math.floor(Math.random() * 999999)).toString(36)
    },
    complete: {
        $type: Boolean,
        $default: false
    },
    text: {
        $type: String,
        $default: "Ballade Getting Started"
    }
});

const todosSchema = new Schema({
    todos: [todoSchema]
});

const todosStore = dispatcher.createMutableStore(todosSchema, {
    [`${TODOS}/${constatns.CREATE}`]: (store, action) => {
        const todos = store.get('todos');

        todos.unshift({
            id: (+new Date() + Math.floor(Math.random() * 999999)).toString(36),
            complete: false,
            text: action.text
        });

        store.set('todos', todos);
    },

    [`${TODOS}/${constatns.UPDATE}`]: (store, action) => {
        const todos = store.get('todos');

        todos.some((item) => {
            if (item.id === action.id) {
                item.text = action.text;
                return true;
            }
        });

        store.set('todos', todos);
    },

    [`${TODOS}/${constatns.DELETE}`]: (store, action) => {
        const todos = store.get('todos');
        let index;

        todos.some((item, i) => {
            if (item.id === action.id) {
                index = i;
                return true;
            }
        });

        if (index !== undefined) {
            todos.splice(index, 1);
        }

        store.set('todos', todos);
    },

    [`${TODOS}/${constatns.DELETE_COMPLETE}`]: (store, action) => {
        let todos = store.get('todos');

        todos = todos.filter((item) => (
            !item.complete
        ));

        store.set('todos', todos);
    },

    [`${TODOS}/${constatns.TOGGLE}`]: (store, action) => {
        const todos = store.get('todos');

        todos.some((item, i) => {
            if (item.id === action.id) {
                item.complete = !item.complete;
                return true;
            }
        });

        store.set('todos', todos);
    },

    [`${TODOS}/${constatns.TOGGLE_ALL}`]: (store, action) => {
        const todos = store.get('todos');
        const active = todos.some((item) => !item.complete);

        todos.forEach((item) => {
            item.complete = active;
        });

        store.set('todos', todos);
    }
});

export default todosStore;
