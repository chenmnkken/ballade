import React, {Component, PropTypes} from 'react';
import TodoItem from './todo-item';

class MainSection extends Component {
    static propTypes = {
        todos: PropTypes.array,
        filter: PropTypes.string
    }

    renderItems = () => {
        const {filter, todos} = this.props;

        return todos.map((item, i) => {
            if (filter === 'all' ||
                (filter === 'completed' && item.complete) ||
                (filter === 'active' && !item.complete)
            ) {
                return (
                    <TodoItem key={`todo-item-${i}`} {...item} />
                );
            }
        });
    }

    render () {
        return (
            <section>
                <ul className="todo-list">
                    {this.renderItems()}
                </ul>
            </section>
        )
    }
};

export default MainSection;
