import React, {Component} from 'react';
import Footer from './footer';
import Header from './header';
import MainSection from './main-section';
import todoStore from '../stores/todos';

class App extends Component {
    state = {
        todos: todoStore.mutable.get('todos'),
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

    refreshTodos = () => {
        const todos = todoStore.mutable.get('todos');

        this.setState({
            todos
        });
    }

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
    }
};

export default App;
