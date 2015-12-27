import React, {Component} from 'react';
import {is} from 'immutable';
import Footer from './footer';
import Header from './header';
import MainSection from './main-section';
import todoStore from '../stores/todos';

class App extends Component {
    state = {
        $todos: todoStore.immutable.get('todos'),
        filter: 'all'
    }

    handleFilter = (filter) => {
        this.setState({
            filter
        });
    }

    componentDidMount () {
        todoStore.event.subscribe('todos', this.refreshTodos);
    }

    componentWillUnmount () {
        todoStore.event.unsubscribe('todos');
    }

    shouldComponentUpdate (nextProps, nextState) {
        const currentState = this.state;

        return Object.keys(nextState).some((item) => (
            currentState[item] !== nextState[item] &&
            !is(currentState[item], nextState[item])
        ));
    }

    refreshTodos = () => {
        const $todos = todoStore.immutable.get('todos');

        this.setState({
            $todos
        });
    }

    render () {
        const $todos = this.state.$todos;
        const todoSize = $todos.size;
        let completedCount = 0;
        let activeCount = 0;
        let completed;

        $todos.forEach((item) => {
            if (item.get('complete')) {
                completedCount++;
            }
        });

        activeCount = todoSize - completedCount;
        completed = todoSize > 0 && completedCount === todoSize;

        return (
            <div>
                <Header completed={completed} />
                <MainSection {...this.state} />
                <Footer
                    activeCount={activeCount}
                    completedCount={completedCount}
                    filter={this.state.filter}
                    onFilter={this.handleFilter} />
            </div>
        );
    }
};

export default App;
