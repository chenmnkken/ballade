const Schema = require('ballade').Schema;
import {Map} from 'immutable';
import dispatcher from '../dispatcher/dispatcher';
import constatns from '../constants/todos';
const TODOS = 'todos';

const todoSchema = new Schema({
    id: {
        type: String,
        default: (+new Date() + Math.floor(Math.random() * 999999)).toString(36)
    },
    complete: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        default: "Ballade Getting Started"
    }
});

const todosSchema = new Schema({
    todos: [todoSchema]
});

// Filter specific index from todos by id
const getTodoId = ($todos, id) => {
    let index;

    $todos.some((item, i) => {
        if (item.get('id') === id) {
            index = i;
            return true;
        }
    });

    return index;
};

const todosStore = dispatcher.createImmutableStore(todosSchema, {
    [`${TODOS}/${constatns.CREATE}`]: (store, action) => {
        let $todos = store.immutable.get('todos');

        $todos = $todos.unshift(Map({
            id: (+new Date() + Math.floor(Math.random() * 999999)).toString(36),
            complete: false,
            text: action.text
        }));

        return store.immutable.set('todos', $todos);
    },

    [`${TODOS}/${constatns.UPDATE}`]: (store, action) => {
        let $todos = store.immutable.get('todos');
        let index = getTodoId($todos, action.id);

        if (index !== undefined) {
            $todos = $todos.setIn([index, 'text'], action.text);
        }

        return store.immutable.set('todos', $todos);
    },

    [`${TODOS}/${constatns.DELETE}`]: (store, action) => {
        let $todos = store.immutable.get('todos');
        let index = getTodoId($todos, action.id);

        if (index !== undefined) {
            $todos = $todos.splice(index, 1);
        }

        return store.immutable.set('todos', $todos);
    },

    [`${TODOS}/${constatns.DELETE_COMPLETE}`]: (store, action) => {
        let $todos = store.immutable.get('todos');

        $todos = $todos.filter((item) => (
            !item.get('complete')
        ));

        return store.immutable.set('todos', $todos);
    },

    [`${TODOS}/${constatns.TOGGLE}`]: (store, action) => {
        let $todos = store.immutable.get('todos');
        let index = getTodoId($todos, action.id);
        let complete;

        if (index !== undefined) {
            complete = $todos.getIn([index, 'complete']);
            $todos = $todos.setIn([index, 'complete'], !complete);
        }

        return store.immutable.set('todos', $todos);
    },

    [`${TODOS}/${constatns.TOGGLE_ALL}`]: (store, action) => {
        let $todos = store.immutable.get('todos');
        const active = $todos.some((item) => !item.get('complete'));

        $todos = $todos.update((list) => (
            list.map((item) => (
                item.set('complete', active)
            ))
        ));

        return store.immutable.set('todos', $todos);
    }
});

export default todosStore;
