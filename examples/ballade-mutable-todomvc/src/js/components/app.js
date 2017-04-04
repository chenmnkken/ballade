import React, { Component } from 'react';
import { bindStore } from 'ballade';
import Footer from './footer';
import Header from './header';
import MainSection from './main-section';
import todosStore from '../stores/todos';

class App extends Component {
    state = {
        todos: todosStore.mutable.get('todos'),
        filter: 'all'
    };

    handleFilter = (filter) => {
        this.setState({
            filter
        });
    };

    render () {
        const todos = this.state.todos;
        const todoSize = todos.length;
        let completedCount = 0;
        let activeCount = 0;
        let completed;

        todos.forEach((item) => {
            if (item.complete) {
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
    };
};

App = bindStore(App, todosStore, {
    todos (value) {
        this.setState({
            todos: value
        });
    }
});

export default App;
